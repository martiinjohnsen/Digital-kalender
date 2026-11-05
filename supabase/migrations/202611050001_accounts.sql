-- Luke accounts. Calendar documents are private to their owner. Recipients use
-- RPCs that remove future doors and quiz solutions before data leaves Postgres.
begin;

create table public.luke_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '' check (length(name) <= 60),
  snow boolean not null default true
);
create table public.luke_calendars (
  id text primary key check (id ~ '^[a-zA-Z0-9-]{1,80}$'),
  owner_id uuid not null references auth.users(id) on delete cascade,
  document jsonb not null check (jsonb_typeof(document) = 'object' and octet_length(document::text) < 15000000),
  revision bigint not null default 1,
  updated_at timestamptz not null default now()
);
create index on public.luke_calendars(owner_id);
create table public.luke_members (
  calendar_id text not null references public.luke_calendars(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (calendar_id, user_id)
);
create index on public.luke_members(user_id);
create table public.luke_invites (
  calendar_id text primary key references public.luke_calendars(id) on delete cascade,
  token text not null unique default encode(extensions.gen_random_bytes(32), 'hex'),
  created_at timestamptz not null default now()
);
-- Realtime events contain only an ID and revision, never door contents.
create table public.luke_updates (
  calendar_id text primary key references public.luke_calendars(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  revision bigint not null,
  updated_at timestamptz not null default now()
);
create table public.luke_answers (
  calendar_id text not null references public.luke_calendars(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  question_key text not null,
  response jsonb not null,
  result jsonb not null,
  primary key (calendar_id, user_id, question_key)
);
create table public.luke_progress (
  calendar_id text not null references public.luke_calendars(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  opened integer[] not null default '{}',
  primary key (calendar_id, user_id)
);

alter table public.luke_profiles enable row level security;
alter table public.luke_calendars enable row level security;
alter table public.luke_members enable row level security;
alter table public.luke_invites enable row level security;
alter table public.luke_updates enable row level security;
alter table public.luke_answers enable row level security;
alter table public.luke_progress enable row level security;
revoke all on public.luke_profiles, public.luke_calendars, public.luke_members,
  public.luke_invites, public.luke_updates, public.luke_answers, public.luke_progress from anon, authenticated;
grant select on public.luke_profiles, public.luke_calendars, public.luke_members,
  public.luke_updates, public.luke_answers, public.luke_progress to authenticated;
create policy own_profile on public.luke_profiles for select to authenticated using (user_id = (select auth.uid()));
create policy owner_document on public.luke_calendars for select to authenticated using (owner_id = (select auth.uid()));
create policy own_membership on public.luke_members for select to authenticated using (user_id = (select auth.uid()));
create policy visible_updates on public.luke_updates for select to authenticated using (
  owner_id = (select auth.uid()) or exists (
    select 1 from public.luke_members m where m.calendar_id = luke_updates.calendar_id and m.user_id = (select auth.uid())
  )
);
create policy own_answers on public.luke_answers for select to authenticated using (user_id = (select auth.uid()));
create policy own_progress on public.luke_progress for select to authenticated using (user_id = (select auth.uid()));

create function public.luke_require_user() returns uuid
language plpgsql stable set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Logg inn for å fortsette.' using errcode = '28000'; end if;
  return auth.uid();
end $$;
create function public.luke_available_day(p_year integer) returns integer
language sql stable set search_path = '' as $$
  select case when (now() at time zone 'Europe/Oslo')::date < make_date(p_year,12,1) then 0
    when (now() at time zone 'Europe/Oslo')::date > make_date(p_year,12,24) then 24
    else extract(day from now() at time zone 'Europe/Oslo')::integer end;
$$;
create function public.luke_question_complete(q jsonb) returns boolean
language plpgsql immutable set search_path = '' as $$
declare choices jsonb;
begin
  if coalesce(trim(q->>'title'),'') = '' then return false; end if;
  if q->>'type' = 'text' then
    return jsonb_typeof(q->'acceptedAnswers') = 'array' and jsonb_array_length(q->'acceptedAnswers') > 0
      and not exists (select 1 from jsonb_array_elements_text(q->'acceptedAnswers') a where trim(a) = '');
  end if;
  if jsonb_typeof(q->'options') <> 'array' or jsonb_array_length(q->'options') < 2 then return false; end if;
  choices := coalesce(q->'correctAnswers', jsonb_build_array(q->'answerIndex'));
  return jsonb_array_length(choices) > 0
    and not exists (select 1 from jsonb_array_elements_text(q->'options') a where trim(a) = '')
    and not exists (select 1 from jsonb_array_elements_text(choices) a
      where a !~ '^[0-9]+$' or a::integer >= jsonb_array_length(q->'options'));
exception when others then return false;
end $$;
create function public.luke_questions(d jsonb, c jsonb) returns jsonb
language plpgsql immutable set search_path = '' as $$
declare qs jsonb := '[]';
begin
  if d ? 'questions' then qs := d->'questions';
  else
    if d ? 'quiz' then qs := jsonb_build_array((d->'quiz') || jsonb_build_object('title',d->>'title')); end if;
    if coalesce((d->>'showCalendarQuiz')::boolean,false) then qs := qs || coalesce(c->'quiz'->'questions','[]'); end if;
  end if;
  return coalesce((select jsonb_agg(q) from jsonb_array_elements(qs) q where public.luke_question_complete(q)), '[]');
end $$;
create function public.luke_question_key(p_day integer, p_index integer, q jsonb) returns text
language sql immutable set search_path = '' as $$ select p_day::text || '-' || p_index::text || '-' || md5(q::text) $$;
create function public.luke_public_document(c jsonb, p_id text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare d jsonb; q jsonb; ds jsonb := '[]'; qs jsonb; i integer; lim integer;
begin
  lim := public.luke_available_day((c->>'year')::integer);
  for d in select value from jsonb_array_elements(c->'doors') loop
    if (d->>'day')::integer > lim then
      ds := ds || jsonb_build_array(jsonb_build_object('day',(d->>'day')::integer,'kind','message','title','','body',''));
    else
      qs := '[]'; i := 0;
      for q in select value from jsonb_array_elements(public.luke_questions(d,c)) loop
        qs := qs || jsonb_build_array(
          (q - 'correctAnswers' - 'acceptedAnswers' - 'remote') ||
          jsonb_build_object('answerIndex',0,'explanation','',
            'remote',jsonb_build_object('key',public.luke_question_key((d->>'day')::integer,i,q),
              'multiple',jsonb_array_length(coalesce(q->'correctAnswers',jsonb_build_array(q->'answerIndex'))) > 1)) ||
          case when q->>'type' = 'text' then jsonb_build_object('acceptedAnswers','[]'::jsonb) else '{}'::jsonb end
        );
        i := i + 1;
      end loop;
      ds := ds || jsonb_build_array((d - 'quiz' - 'showCalendarQuiz' - 'questions') || jsonb_build_object('questions',qs));
    end if;
  end loop;
  return (c - 'doors' - 'quiz' - 'remote' - 'receivedSourceId') || jsonb_build_object(
    'id',p_id,'access','received','demo',false,'doors',ds,'remote',true,'serverAvailableDay',lim);
end $$;

create function public.get_luke_workspace() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare uid uuid := public.luke_require_user(); cs jsonb; vs jsonb; prefs jsonb; progress jsonb;
begin
  select coalesce(jsonb_agg(c.document || jsonb_build_object('access','owner','remote',true) order by c.updated_at desc),'[]'),
    coalesce(jsonb_object_agg(c.id,c.revision),'{}') into cs,vs from public.luke_calendars c where c.owner_id = uid;
  cs := cs || coalesce((select jsonb_agg(public.luke_public_document(c.document,c.id) order by c.updated_at desc)
    from public.luke_members m join public.luke_calendars c on c.id = m.calendar_id
    where m.user_id = uid and c.owner_id <> uid), '[]');
  select jsonb_build_object('name',p.name,'snow',p.snow) into prefs from public.luke_profiles p where p.user_id = uid;
  if prefs is null then
    select jsonb_build_object('name',left(coalesce(u.raw_user_meta_data->>'name',''),60),'snow',true) into prefs from auth.users u where u.id = uid;
  end if;
  select coalesce(jsonb_object_agg(c.id,jsonb_build_object(
    'opened',coalesce(to_jsonb(p.opened),'[]'),
    'answers',coalesce((select jsonb_object_agg(a.question_key,a.response || jsonb_build_object('result',a.result))
      from public.luke_answers a where a.user_id = uid and a.calendar_id = c.id),'{}'))),'{}') into progress
    from public.luke_members m join public.luke_calendars c on c.id = m.calendar_id
    left join public.luke_progress p on p.calendar_id = c.id and p.user_id = uid where m.user_id = uid;
  return jsonb_build_object('data',jsonb_build_object('version',1,'calendars',cs,'preferences',prefs),'versions',vs,'progress',progress);
end $$;

create function public.save_luke_workspace(p_changes jsonb, p_deletes jsonb, p_unfollow jsonb, p_preferences jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.luke_require_user(); item jsonb; doc jsonb; row public.luke_calendars; ident text; days integer;
begin
  if jsonb_typeof(p_changes) <> 'array' or jsonb_typeof(p_deletes) <> 'array' or jsonb_array_length(p_changes) > 100 then
    raise exception 'Ugyldig oppdatering.'; end if;
  -- Lock changed records in a stable order, and validate every revision before writing.
  perform 1 from public.luke_calendars c where c.id in (
    select x->'document'->>'id' from jsonb_array_elements(p_changes) x union select x->>'id' from jsonb_array_elements(p_deletes) x
  ) order by c.id for update;
  for item in select value from jsonb_array_elements(p_changes) loop
    doc := item->'document'; ident := doc->>'id';
    if ident is null or ident !~ '^[a-zA-Z0-9-]{1,80}$' or coalesce(trim(doc->>'title'),'') = ''
      or length(doc->>'title') > 100 or (doc->>'year')::integer not between 2020 and 2100
      or jsonb_typeof(doc->'doors') <> 'array' or jsonb_array_length(doc->'doors') <> 24 then raise exception 'Ugyldig kalender.'; end if;
    select count(distinct (d->>'day')::integer) into days from jsonb_array_elements(doc->'doors') d where (d->>'day')::integer between 1 and 24;
    if days <> 24 then raise exception 'Kalenderen må ha én luke for hver dag.'; end if;
    select * into row from public.luke_calendars where id = ident;
    if found then
      if row.owner_id <> uid then raise exception 'Du kan ikke redigere denne kalenderen.' using errcode = '42501'; end if;
      if row.revision <> (item->>'expectedRevision')::bigint or item->>'expectedRevision' is null then
        raise exception 'Kalenderen er endret på en annen enhet. Utkastet ditt er beholdt.' using errcode = '40001'; end if;
    elsif item->>'expectedRevision' is not null then
      raise exception 'Kalenderen er endret eller fjernet på en annen enhet.' using errcode = '40001';
    end if;
    doc := (doc - 'remote' - 'serverAvailableDay' - 'receivedSourceId') || jsonb_build_object('access','owner','demo',false);
    if row.id is not null then
      update public.luke_calendars set document=doc,revision=revision+1,updated_at=now() where id=ident and owner_id=uid;
    else
      -- A concurrent insert must fail, never overwrite somebody else's row.
      insert into public.luke_calendars(id,owner_id,document) values (ident,uid,doc);
    end if;
    insert into public.luke_updates(calendar_id,owner_id,revision)
      select id,owner_id,revision from public.luke_calendars where id=ident
      on conflict(calendar_id) do update set revision=excluded.revision,updated_at=now();
  end loop;
  for item in select value from jsonb_array_elements(p_deletes) loop
    select * into row from public.luke_calendars where id = item->>'id';
    if found then
      if row.owner_id <> uid then raise exception 'Ingen tilgang.' using errcode='42501'; end if;
      if item->>'expectedRevision' is null or row.revision <> (item->>'expectedRevision')::bigint then raise exception 'Kalenderen er endret på en annen enhet.' using errcode='40001'; end if;
      delete from public.luke_calendars where id=row.id;
    end if;
  end loop;
  delete from public.luke_members where user_id=uid and calendar_id in (select jsonb_array_elements_text(p_unfollow));
  if (select count(*) from public.luke_calendars where owner_id=uid) > 100 then raise exception 'Du kan ha opptil 100 egne kalendere.'; end if;
  insert into public.luke_profiles(user_id,name,snow) values(uid,left(coalesce(p_preferences->>'name',''),60),coalesce((p_preferences->>'snow')::boolean,true))
    on conflict(user_id) do update set name=excluded.name,snow=excluded.snow;
  return public.get_luke_workspace();
end $$;

create function public.create_luke_invite(p_calendar_id text) returns text
language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.luke_require_user(); value text;
begin
  if not exists(select 1 from public.luke_calendars where id=p_calendar_id and owner_id=uid) then raise exception 'Ingen tilgang.' using errcode='42501'; end if;
  insert into public.luke_invites(calendar_id) values(p_calendar_id) on conflict do nothing;
  select token into value from public.luke_invites where calendar_id=p_calendar_id;
  return value;
end $$;
create function public.accept_luke_invite(p_token text) returns text
language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.luke_require_user(); ident text; owner uuid;
begin
  if p_token !~ '^[a-f0-9]{64}$' then raise exception 'Delingslenken er ugyldig eller avsluttet.'; end if;
  select i.calendar_id,c.owner_id into ident,owner from public.luke_invites i join public.luke_calendars c on c.id=i.calendar_id where i.token=p_token for update of i;
  if ident is null then raise exception 'Delingslenken er ugyldig eller avsluttet.'; end if;
  if owner <> uid then insert into public.luke_members(calendar_id,user_id) values(ident,uid) on conflict do nothing; end if;
  return ident;
end $$;
create function public.stop_luke_sharing(p_calendar_id text) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.luke_require_user();
begin
  if not exists(select 1 from public.luke_calendars where id=p_calendar_id and owner_id=uid) then raise exception 'Ingen tilgang.' using errcode='42501'; end if;
  delete from public.luke_invites where calendar_id=p_calendar_id;
  delete from public.luke_members where calendar_id=p_calendar_id;
end $$;
create function public.open_luke_door(p_calendar_id text,p_day integer) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.luke_require_user(); c jsonb; result jsonb;
begin
  select document into c from public.luke_calendars where id=p_calendar_id and exists(select 1 from public.luke_members where calendar_id=p_calendar_id and user_id=uid);
  if c is null then raise exception 'Kalenderen er ikke tilgjengelig.' using errcode='42501'; end if;
  if p_day not between 1 and public.luke_available_day((c->>'year')::integer) then raise exception 'Luken har ikke åpnet ennå.' using errcode='42501'; end if;
  insert into public.luke_progress(calendar_id,user_id,opened) values(p_calendar_id,uid,array[p_day])
    on conflict(calendar_id,user_id) do update set opened=(select array_agg(distinct n order by n) from unnest(luke_progress.opened || p_day) n);
  select to_jsonb(opened) into result from public.luke_progress where calendar_id=p_calendar_id and user_id=uid;
  return result;
end $$;
create function public.submit_luke_answer(p_calendar_id text,p_day integer,p_index integer,p_response jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid := public.luke_require_user(); c jsonb; d jsonb; q jsonb; k text; selected integer[]; correct integer[]; is_right boolean; result jsonb; payload jsonb; written text;
begin
  select document into c from public.luke_calendars where id=p_calendar_id and exists(select 1 from public.luke_members where calendar_id=p_calendar_id and user_id=uid);
  if c is null then raise exception 'Kalenderen er ikke tilgjengelig.' using errcode='42501'; end if;
  if p_day not between 1 and public.luke_available_day((c->>'year')::integer) then raise exception 'Luken har ikke åpnet ennå.' using errcode='42501'; end if;
  select value into d from jsonb_array_elements(c->'doors') where (value->>'day')::integer=p_day;
  q := public.luke_questions(d,c)->p_index;
  if q is null or p_index < 0 then raise exception 'Spørsmålet finnes ikke.'; end if;
  k := public.luke_question_key(p_day,p_index,q);
  if q->>'type'='text' then
    written := trim(p_response->>'text');
    if written is null or written='' or length(written)>300 then raise exception 'Skriv et svar på opptil 300 tegn.'; end if;
    select exists(select 1 from jsonb_array_elements_text(q->'acceptedAnswers') a
      where lower(regexp_replace(trim(normalize(a,NFKC)),'\s+',' ','g')) = lower(regexp_replace(trim(normalize(written,NFKC)),'\s+',' ','g'))) into is_right;
    payload := jsonb_build_object('text',written);
    result := jsonb_build_object('correct',is_right,'acceptedAnswer',q->'acceptedAnswers'->>0,'explanation',q->>'explanation');
  else
    if jsonb_typeof(p_response->'answers') <> 'array' then raise exception 'Velg et svar.'; end if;
    if exists(select 1 from jsonb_array_elements_text(p_response->'answers') a where a !~ '^[0-9]+$') then raise exception 'Ugyldig svar.'; end if;
    select array_agg(a::integer order by a::integer) into selected from jsonb_array_elements_text(p_response->'answers') a;
    if coalesce(cardinality(selected),0)=0 or cardinality(selected)>12
      or exists(select 1 from unnest(selected) n where n<0 or n>=jsonb_array_length(q->'options'))
      or cardinality(selected)<>(select count(distinct n) from unnest(selected) n) then raise exception 'Ugyldig svar.'; end if;
    select array_agg(a::integer order by a::integer) into correct from jsonb_array_elements_text(coalesce(q->'correctAnswers',jsonb_build_array(q->'answerIndex'))) a;
    is_right := selected=correct;
    payload := jsonb_build_object('answers',to_jsonb(selected));
    result := jsonb_build_object('correct',is_right,'correctAnswers',to_jsonb(correct),'explanation',q->>'explanation');
  end if;
  insert into public.luke_answers(calendar_id,user_id,question_key,response,result) values(p_calendar_id,uid,k,payload,result) on conflict do nothing;
  select response || jsonb_build_object('result',a.result) into payload from public.luke_answers a where calendar_id=p_calendar_id and user_id=uid and question_key=k;
  return jsonb_build_object('key',k,'attempt',payload);
end $$;

-- Helpers are not API endpoints. In particular, callers must never be able to
-- pass an arbitrary document to a SECURITY DEFINER helper.
revoke all on function public.luke_require_user(),public.luke_available_day(integer),public.luke_question_complete(jsonb),
  public.luke_questions(jsonb,jsonb),public.luke_question_key(integer,integer,jsonb),public.luke_public_document(jsonb,text) from public,anon,authenticated;
revoke all on function public.get_luke_workspace(),public.save_luke_workspace(jsonb,jsonb,jsonb,jsonb),
  public.create_luke_invite(text),public.accept_luke_invite(text),public.stop_luke_sharing(text),
  public.open_luke_door(text,integer),public.submit_luke_answer(text,integer,integer,jsonb) from public,anon,authenticated;
grant execute on function public.get_luke_workspace(),public.save_luke_workspace(jsonb,jsonb,jsonb,jsonb),
  public.create_luke_invite(text),public.accept_luke_invite(text),public.stop_luke_sharing(text),
  public.open_luke_door(text,integer),public.submit_luke_answer(text,integer,integer,jsonb) to authenticated;
alter publication supabase_realtime add table public.luke_updates,public.luke_members,public.luke_profiles,public.luke_progress,public.luke_answers;
commit;
