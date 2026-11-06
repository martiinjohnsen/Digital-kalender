-- Add account-bound owner previews without changing calendars or recipient data.
begin;
create table if not exists public.luke_preview_progress (
  calendar_id text not null references public.luke_calendars(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  test_progress jsonb not null default '{"opened":[],"answers":{}}',
  date_progress jsonb not null default '{"opened":[],"answers":{}}',
  revision bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (calendar_id,user_id)
);
alter table public.luke_preview_progress enable row level security;
revoke all on public.luke_preview_progress from anon,authenticated;
grant select on public.luke_preview_progress to authenticated;
do $$ begin
if not exists(select 1 from pg_policies where schemaname='public' and tablename='luke_preview_progress' and policyname='own_preview') then
create policy own_preview on public.luke_preview_progress for select to authenticated using (
  user_id=(select auth.uid()) and exists (
    select 1 from public.luke_calendars c where c.id=calendar_id and c.owner_id=(select auth.uid())
  )
);
end if;
end $$;

-- Normalize legacy single-choice answers as well as newer multiple/text answers.
-- Kept private: this function never grants access to calendar documents.
create or replace function public.luke_preview_payload(p jsonb) returns jsonb
language plpgsql immutable set search_path='' as $$
declare k text; v jsonb; response jsonb; answers jsonb := '{}'; opened jsonb; choices integer[]; fields integer;
begin
  if p is null or jsonb_typeof(p)<>'object' or octet_length(p::text)>400000
    or coalesce(jsonb_typeof(p->'opened'),'')<>'array'
    or coalesce(jsonb_typeof(p->'answers'),'')<>'object' then
    raise exception 'Ugyldig prøvefremdrift.';
  end if;
  if jsonb_array_length(p->'opened')>24 or (select count(*) from jsonb_object_keys(p->'answers'))>768 then
    raise exception 'For mye prøvefremdrift.';
  end if;
  if exists(select 1 from jsonb_array_elements(p->'opened') n
    where jsonb_typeof(n)<>'number' or n::text !~ '^([1-9]|1[0-9]|2[0-4])$') then
    raise exception 'Ugyldig lukenummer.';
  end if;
  select coalesce(jsonb_agg(n order by n),'[]') into opened
    from (select distinct value::integer n from jsonb_array_elements_text(p->'opened')) ds;
  for k,v in select * from jsonb_each(p->'answers') loop
    if k !~ '^([1-9]|1[0-9]|2[0-4])-[0-9]{1,2}-[a-z0-9]{1,32}$' or jsonb_typeof(v)<>'object' then
      raise exception 'Ugyldig prøvesvar.';
    end if;
    fields := (v ? 'answer')::integer + (v ? 'answers')::integer + (v ? 'text')::integer;
    if fields<>1 then raise exception 'Ugyldig prøvesvar.'; end if;
    if v ? 'text' then
      if jsonb_typeof(v->'text')<>'string' or length(trim(v->>'text'))=0 or length(v->>'text')>300 then
        raise exception 'Skriv et svar på opptil 300 tegn.';
      end if;
      response := jsonb_build_object('text',v->>'text');
    elsif v ? 'answer' then
      if jsonb_typeof(v->'answer')<>'number' or v->>'answer' !~ '^([0-9]|1[01])$' then raise exception 'Ugyldig svaralternativ.'; end if;
      response := jsonb_build_object('answer',v->'answer');
    else
      if jsonb_typeof(v->'answers')<>'array' then raise exception 'Velg et svar.'; end if;
      if jsonb_array_length(v->'answers') not between 1 and 12 or exists (
        select 1 from jsonb_array_elements(v->'answers') n where jsonb_typeof(n)<>'number' or n::text !~ '^([0-9]|1[01])$'
      ) then raise exception 'Ugyldige svaralternativer.'; end if;
      select array_agg(value::integer order by value::integer) into choices from jsonb_array_elements_text(v->'answers');
      if cardinality(choices)<>(select count(distinct n) from unnest(choices) n) then raise exception 'Ugyldige svaralternativer.'; end if;
      response := jsonb_build_object('answers',to_jsonb(choices));
    end if;
    answers := answers || jsonb_build_object(k,response);
  end loop;
  return jsonb_build_object('opened',opened,'answers',answers);
end $$;

create or replace function public.luke_preview(p_calendar_id text,p_action text default 'load',p_payload jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid := public.luke_require_user(); c jsonb; r public.luke_preview_progress;
  mode text; incoming jsonb; previous jsonb; merged jsonb; opened jsonb; k text; v jsonb; d jsonb; q jsonb; day_num integer; idx integer;
begin
  select document into c from public.luke_calendars where id=p_calendar_id and owner_id=uid;
  if c is null then raise exception 'Bare eieren kan bruke denne forhåndsvisningen.' using errcode='42501'; end if;
  if p_action is null or p_action not in ('load','enable','merge','import') or p_payload is null
    or jsonb_typeof(p_payload)<>'object' or octet_length(p_payload::text)>800000 then raise exception 'Ugyldig forespørsel.'; end if;
  if p_action<>'load' then
    insert into public.luke_preview_progress(calendar_id,user_id) values(p_calendar_id,uid) on conflict do nothing;
    select * into r from public.luke_preview_progress where calendar_id=p_calendar_id and user_id=uid for update;
    if p_action='enable' then
      if coalesce(jsonb_typeof(p_payload->'enabled'),'')<>'boolean' then raise exception 'Velg om fremdriften skal lagres.'; end if;
      update public.luke_preview_progress set enabled=(p_payload->>'enabled')::boolean where calendar_id=p_calendar_id and user_id=uid;
    else
      if p_action='merge' and not r.enabled then raise exception 'Slå på Lagre fremdrift først.'; end if;
      if p_action='merge' and coalesce(p_payload->>'mode','') not in ('test','date') then raise exception 'Ugyldig prøvemodus.'; end if;
      foreach mode in array array['test','date'] loop
        if p_action='merge' and mode<>p_payload->>'mode' then continue; end if;
        incoming := public.luke_preview_payload(case when p_action='import' then p_payload->mode else p_payload->'progress' end);
        if p_action='merge' then
          -- New answers must refer to existing questions. Imports also retain
          -- historical keys for questions edited since the old trial answer.
          if mode='date' and exists(select 1 from jsonb_array_elements_text(incoming->'opened') a
            where a::integer>public.luke_available_day((c->>'year')::integer)) then
            raise exception 'Luken har ikke åpnet ennå.' using errcode='42501';
          end if;
          for k,v in select * from jsonb_each(incoming->'answers') loop
            day_num := split_part(k,'-',1)::integer; idx := split_part(k,'-',2)::integer;
            if mode='date' and day_num>public.luke_available_day((c->>'year')::integer) then raise exception 'Luken har ikke åpnet ennå.' using errcode='42501'; end if;
            select value into d from jsonb_array_elements(c->'doors') where (value->>'day')::integer=day_num;
            q := public.luke_questions(d,c)->idx;
            if q is null then raise exception 'Spørsmålet finnes ikke.'; end if;
            if q->>'type'='text' then
              if not v ? 'text' then raise exception 'Skriv et svar.'; end if;
            else
              if v ? 'text' then raise exception 'Velg et svar.'; end if;
              if exists(select 1 from jsonb_array_elements_text(coalesce(v->'answers',jsonb_build_array(v->'answer'))) a
                where a::integer>=jsonb_array_length(q->'options')) then raise exception 'Ugyldig svaralternativ.'; end if;
            end if;
          end loop;
        end if;
        previous := case when mode='test' then r.test_progress else r.date_progress end;
        select coalesce(jsonb_agg(n order by n),'[]') into opened from (
          select distinct value::integer n from jsonb_array_elements_text((previous->'opened') || (incoming->'opened'))
        ) ds;
        -- Atomic union, with the first stored attempt winning across devices.
        merged := jsonb_build_object('opened',opened,'answers',(incoming->'answers') || (previous->'answers'));
        if mode='test' then r.test_progress := merged; else r.date_progress := merged; end if;
      end loop;
      update public.luke_preview_progress set test_progress=r.test_progress,date_progress=r.date_progress where calendar_id=p_calendar_id and user_id=uid;
    end if;
    update public.luke_preview_progress set revision=revision+1,updated_at=now() where calendar_id=p_calendar_id and user_id=uid;
  end if;
  select * into r from public.luke_preview_progress where calendar_id=p_calendar_id and user_id=uid;
  return jsonb_build_object('initialized',found,'enabled',coalesce(r.enabled,false),'revision',coalesce(r.revision,0),
    'test',coalesce(r.test_progress,'{"opened":[],"answers":{}}'),'date',coalesce(r.date_progress,'{"opened":[],"answers":{}}'));
end $$;
revoke all on function public.luke_preview_payload(jsonb),public.luke_preview(text,text,jsonb) from public,anon,authenticated;
grant execute on function public.luke_preview(text,text,jsonb) to authenticated;
do $$ begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='luke_preview_progress') then
    alter publication supabase_realtime add table public.luke_preview_progress;
  end if;
end $$;
commit;
