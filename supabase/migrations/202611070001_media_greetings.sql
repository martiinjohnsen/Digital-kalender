-- Private attachments and editable replies. Existing calendars/progress are untouched.
begin;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('luke-media','luke-media',false,8388608,array['image/jpeg','image/png','image/webp','audio/mp4','audio/webm','audio/ogg','audio/mpeg','audio/wav'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create table if not exists public.luke_media (
  path text primary key,
  calendar_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  day integer not null check(day between 1 and 24),
  scope text not null check(scope in ('door','reply')),
  mime_type text not null,
  bytes integer not null check(bytes between 1 and 8388608),
  created_at timestamptz not null default now(),
  uploaded_at timestamptz,
  deleting boolean not null default false
);
alter table public.luke_media add column if not exists uploaded_at timestamptz;
alter table public.luke_media add column if not exists deleting boolean not null default false;
create index if not exists luke_media_calendar on public.luke_media(calendar_id);
create index if not exists luke_media_user on public.luke_media(user_id,created_at);
create table if not exists public.luke_greetings (
  calendar_id text not null references public.luke_calendars(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  day integer not null check(day between 1 and 24),
  body text not null default '' check(length(body)<=3000),
  image text,
  audio text,
  revision bigint not null default 0,
  seen_revision bigint not null default 0,
  prompted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(calendar_id,user_id,day)
);
create index if not exists luke_greetings_owner on public.luke_greetings(owner_id,updated_at);
alter table public.luke_media enable row level security;
alter table public.luke_greetings enable row level security;
revoke all on public.luke_media,public.luke_greetings from anon,authenticated;
grant select on public.luke_media,public.luke_greetings to authenticated;

create or replace function public.luke_can_reply(p_calendar_id text,p_day integer) returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.luke_calendars c
    join public.luke_members m on m.calendar_id=c.id and m.user_id=auth.uid()
    join public.luke_progress p on p.calendar_id=c.id and p.user_id=m.user_id
    where c.id=p_calendar_id and c.owner_id<>auth.uid() and p_day between 1 and public.luke_available_day((c.document->>'year')::integer)
      and p_day=any(p.opened))
$$;
create or replace function public.luke_media_can_read(p_path text) returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.luke_media a join public.luke_calendars c on c.id=a.calendar_id
    where a.path=p_path and not a.deleting and ((c.owner_id=auth.uid() and (a.scope='door' or exists(
      select 1 from public.luke_greetings g where g.calendar_id=c.id and g.user_id=a.user_id and g.day=a.day
        and (g.image='luke-media:'||a.path or g.audio='luke-media:'||a.path)))) or
      (exists(select 1 from public.luke_members m where m.calendar_id=c.id and m.user_id=auth.uid()) and
       ((a.scope='door' and a.uploaded_at is not null and a.day<=public.luke_available_day((c.document->>'year')::integer) and exists(
         select 1 from jsonb_array_elements(c.document->'doors') d where (d->>'day')::integer=a.day
           and (d->>'image'='luke-media:'||a.path or d->>'audio'='luke-media:'||a.path))) or
        (a.scope='reply' and a.user_id=auth.uid())))))
$$;
create or replace function public.luke_media_can_write(p_path text) returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.luke_media a join public.luke_calendars c on c.id=a.calendar_id
    where a.path=p_path and a.user_id=auth.uid() and not a.deleting and
      ((a.scope='door' and c.owner_id=auth.uid()) or
       (a.scope='reply' and public.luke_can_reply(c.id,a.day))))
$$;
drop policy if exists luke_private_media_read on public.luke_media;
create policy luke_private_media_read on public.luke_media for select to authenticated using(public.luke_media_can_read(path));
drop policy if exists luke_private_greetings on public.luke_greetings;
create policy luke_private_greetings on public.luke_greetings for select to authenticated using(
  owner_id=auth.uid() or (user_id=auth.uid() and public.luke_can_reply(calendar_id,day)));
drop policy if exists luke_media_download on storage.objects;
create policy luke_media_download on storage.objects for select to authenticated using(bucket_id='luke-media' and public.luke_media_can_read(name));
drop policy if exists luke_media_upload on storage.objects;
create policy luke_media_upload on storage.objects for insert to authenticated with check(bucket_id='luke-media' and public.luke_media_can_write(name));
-- Files are immutable. Replacing an attachment creates a new, content-addressed path.
create or replace function public.luke_media_can_remove(p_path text) returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.luke_media a where a.path=p_path and a.user_id=auth.uid() and a.created_at<now()-interval '1 day'
    and not exists(select 1 from public.luke_calendars c where c.id=a.calendar_id and strpos(c.document::text,'luke-media:'||a.path)>0)
    and not exists(select 1 from public.luke_greetings g where g.image='luke-media:'||a.path or g.audio='luke-media:'||a.path))
$$;
create or replace function public.luke_media_can_delete(p_path text) returns boolean
language sql stable security definer set search_path='' as $$
  select public.luke_media_can_remove(p_path) and exists(select 1 from public.luke_media where path=p_path and deleting)
$$;
drop policy if exists luke_media_cleanup on storage.objects;
create policy luke_media_cleanup on storage.objects for delete to authenticated using(bucket_id='luke-media' and public.luke_media_can_delete(name));
drop policy if exists luke_media_download on storage.objects;
create policy luke_media_download on storage.objects for select to authenticated using(bucket_id='luke-media' and (public.luke_media_can_read(name) or public.luke_media_can_delete(name)));
-- Claim unused files before deleting through the Storage API. Writers lock the
-- same registry rows and cannot attach a claimed file while removal is pending.
create or replace function public.luke_unused_media() returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=public.luke_require_user(); candidate record; result jsonb:='[]';
begin
  for candidate in select path from public.luke_media where user_id=uid and public.luke_media_can_remove(path)
    order by path limit 50 for update skip locked loop
    if public.luke_media_can_remove(candidate.path) then
      if exists(select 1 from storage.objects where bucket_id='luke-media' and name=candidate.path) then
        update public.luke_media set deleting=true where path=candidate.path;
        result:=result||jsonb_build_array(candidate.path);
      else delete from public.luke_media where path=candidate.path;
      end if;
    end if;
  end loop;
  return result;
end $$;
create or replace function public.finish_luke_cleanup(p_paths jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare uid uuid:=public.luke_require_user();
begin
  if jsonb_typeof(p_paths) is distinct from 'array' or jsonb_array_length(p_paths)>50 then raise exception 'Ugyldig filopprydding.'; end if;
  delete from public.luke_media a where a.user_id=uid and a.deleting and a.path in (select jsonb_array_elements_text(p_paths))
    and not exists(select 1 from storage.objects where bucket_id='luke-media' and name=a.path);
end $$;
-- Keep the maximum file size reserved until Storage confirms the actual size.
-- This prevents underreported browser sizes from bypassing the account quota.
create or replace function public.finish_luke_media(p_path text) returns text
language plpgsql security definer set search_path='' as $$
declare uid uuid:=public.luke_require_user(); a public.luke_media; actual jsonb;
begin
  perform pg_advisory_xact_lock(hashtextextended(uid::text,71));
  select * into a from public.luke_media where path=p_path and user_id=uid for update;
  if a.path is null or not public.luke_media_can_write(p_path) then raise exception 'Ingen tilgang til denne filen.' using errcode='42501'; end if;
  select metadata into actual from storage.objects where bucket_id='luke-media' and name=p_path;
  if actual is null or actual->>'size' is null or (actual->>'size')::bigint not between 1 and 8388608 or
    split_part(actual->>'mimetype',';',1) is distinct from a.mime_type then raise exception 'Filen er ikke ferdig lastet opp. Prøv igjen.'; end if;
  update public.luke_media set bytes=(actual->>'size')::integer,uploaded_at=coalesce(uploaded_at,now()) where path=p_path;
  return 'luke-media:'||p_path;
end $$;
create or replace function public.luke_guard_calendar_media() returns trigger
language plpgsql security definer set search_path='' as $$
declare attachment record;
begin
  perform 1 from public.luke_media where path in (
    select substring(v.source from 12) from jsonb_array_elements(new.document->'doors') d
      cross join lateral (values(d->>'image'),(d->>'audio')) v(source) where v.source like 'luke-media:%') order by path for share;
  for attachment in select v.source,(d->>'day')::integer as day from jsonb_array_elements(new.document->'doors') d
    cross join lateral (values(d->>'image'),(d->>'audio')) v(source) where v.source like 'luke-media:%' loop
    if not exists(select 1 from public.luke_media where path=substring(attachment.source from 12)
      and calendar_id=new.id and day=attachment.day and scope='door' and user_id=new.owner_id
      and uploaded_at is not null and not deleting) then
      raise exception 'Vedlegget er ikke tilgjengelig for denne luka. Legg det til på nytt.'; end if;
  end loop;
  return new;
end $$;
drop trigger if exists luke_guard_calendar_media on public.luke_calendars;
create trigger luke_guard_calendar_media before insert or update of document on public.luke_calendars for each row execute function public.luke_guard_calendar_media();

create or replace function public.reserve_luke_media(p_calendar_id text,p_day integer,p_scope text,p_mime text,p_bytes integer,p_hash text) returns text
language plpgsql security definer set search_path='' as $$
declare uid uuid:=public.luke_require_user(); owner uuid; ext text; result text;
begin
  select owner_id into owner from public.luke_calendars where id=p_calendar_id;
  if owner is null or p_day not between 1 and 24 or p_scope not in ('door','reply') or
    not ((p_scope='door' and owner=uid) or (p_scope='reply' and public.luke_can_reply(p_calendar_id,p_day))) then
    raise exception 'Du har ikke tilgang til å laste opp her.' using errcode='42501'; end if;
  if p_bytes is null or p_bytes not between 1 and 8388608 or p_hash is null or p_hash !~ '^[a-f0-9]{64}$' then raise exception 'Filen er ugyldig eller for stor.'; end if;
  ext:=case p_mime when 'image/jpeg' then 'jpg' when 'image/png' then 'png' when 'image/webp' then 'webp'
    when 'audio/mp4' then 'm4a' when 'audio/webm' then 'webm' when 'audio/ogg' then 'ogg'
    when 'audio/mpeg' then 'mp3' when 'audio/wav' then 'wav' end;
  if ext is null then raise exception 'Dette filformatet støttes ikke.'; end if;
  result:=p_calendar_id||'/'||p_scope||'/'||p_day::text||'/'||uid::text||'/'||p_hash||'.'||ext;
  perform pg_advisory_xact_lock(hashtextextended(uid::text,71));
  if not exists(select 1 from public.luke_media where path=result) then
    if (select count(*) from public.luke_media where user_id=uid and created_at>now()-interval '1 day')>=200
      or (select coalesce(sum(bytes),0) from public.luke_media where user_id=uid)+8388608>262144000 then
      raise exception 'Du har nådd opplastingsgrensen. Ta kontakt hvis du trenger mer plass.'; end if;
    insert into public.luke_media(path,calendar_id,user_id,day,scope,mime_type,bytes)
      values(result,p_calendar_id,uid,p_day,p_scope,p_mime,8388608);
  end if;
  if exists(select 1 from public.luke_media where path=result and deleting) then raise exception 'Filen ryddes. Prøv igjen om litt.'; end if;
  return result;
end $$;

create or replace function public.get_luke_greetings() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare uid uuid:=public.luke_require_user(); result jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object('calendarId',g.calendar_id,'userId',g.user_id,'day',g.day,
    'name',coalesce(nullif(p.name,''),nullif(u.raw_user_meta_data->>'name',''),'En venn'),
    'body',g.body,'image',g.image,'audio',g.audio,'revision',g.revision,'seenRevision',g.seen_revision,
    'updatedAt',g.updated_at,'owner',g.owner_id=uid) order by g.updated_at desc),'[]') into result
  from public.luke_greetings g left join public.luke_profiles p on p.user_id=g.user_id join auth.users u on u.id=g.user_id
  where (g.owner_id=uid and g.revision>0) or (g.user_id=uid and public.luke_can_reply(g.calendar_id,g.day));
  return result;
end $$;
create or replace function public.claim_luke_greeting_prompt(p_calendar_id text,p_day integer) returns boolean
language plpgsql security definer set search_path='' as $$
declare uid uuid:=public.luke_require_user(); inserted integer;
begin
  if not public.luke_can_reply(p_calendar_id,p_day) then raise exception 'Åpne luka før du sender en hilsen.' using errcode='42501'; end if;
  insert into public.luke_greetings(calendar_id,user_id,owner_id,day)
    select id,uid,owner_id,p_day from public.luke_calendars where id=p_calendar_id
    on conflict do nothing;
  get diagnostics inserted=row_count;
  return inserted=1;
end $$;
create or replace function public.save_luke_greeting(p_calendar_id text,p_day integer,p_body text,p_image text,p_audio text,p_revision bigint) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=public.luke_require_user(); row public.luke_greetings;
begin
  if not public.luke_can_reply(p_calendar_id,p_day) then raise exception 'Du har ikke tilgang til denne hilsenen.' using errcode='42501'; end if;
  if p_body is null or length(p_body)>3000 or (trim(p_body)='' and p_image is null and p_audio is null) then
    raise exception 'Skriv en hilsen, eller legg til bilde eller lyd.'; end if;
  perform 1 from public.luke_media where 'luke-media:'||path in (p_image,p_audio) order by path for share;
  if (p_image is not null and not exists(select 1 from public.luke_media where 'luke-media:'||path=p_image and calendar_id=p_calendar_id and day=p_day and scope='reply' and user_id=uid and uploaded_at is not null and not deleting and mime_type like 'image/%'))
    or (p_audio is not null and not exists(select 1 from public.luke_media where 'luke-media:'||path=p_audio and calendar_id=p_calendar_id and day=p_day and scope='reply' and user_id=uid and uploaded_at is not null and not deleting and mime_type like 'audio/%')) then
    raise exception 'Vedlegget tilhører ikke denne hilsenen.' using errcode='42501'; end if;
  insert into public.luke_greetings(calendar_id,user_id,owner_id,day)
    select id,uid,owner_id,p_day from public.luke_calendars where id=p_calendar_id on conflict do nothing;
  select * into row from public.luke_greetings where calendar_id=p_calendar_id and user_id=uid and day=p_day for update;
  if p_revision is null or row.revision<>p_revision then raise exception 'Hilsenen er endret på en annen enhet. Hent den nyeste versjonen før du lagrer.' using errcode='40001'; end if;
  if row.body is distinct from trim(p_body) or row.image is distinct from p_image or row.audio is distinct from p_audio then
    update public.luke_greetings set body=trim(p_body),image=p_image,audio=p_audio,revision=revision+1,updated_at=clock_timestamp()
      where calendar_id=p_calendar_id and user_id=uid and day=p_day;
  end if;
  return public.get_luke_greetings();
end $$;
create or replace function public.read_luke_greetings(p_calendar_id text,p_seen jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=public.luke_require_user(); item jsonb;
begin
  if not exists(select 1 from public.luke_calendars where id=p_calendar_id and owner_id=uid) then raise exception 'Ingen tilgang.' using errcode='42501'; end if;
  if jsonb_typeof(p_seen) is distinct from 'array' or jsonb_array_length(p_seen)>500 then raise exception 'Ugyldig lesebekreftelse.'; end if;
  for item in select value from jsonb_array_elements(p_seen) loop
    update public.luke_greetings set seen_revision=greatest(seen_revision,least(revision,(item->>'revision')::bigint))
      where calendar_id=p_calendar_id and owner_id=uid and user_id=(item->>'userId')::uuid and day=(item->>'day')::integer
        and seen_revision<least(revision,(item->>'revision')::bigint);
  end loop;
  return public.get_luke_greetings();
end $$;
create or replace function public.luke_media_ready() returns integer language sql stable set search_path='' as $$ select 2 $$;

revoke all on function public.luke_can_reply(text,integer),public.luke_media_can_read(text),public.luke_media_can_write(text),
  public.reserve_luke_media(text,integer,text,text,integer,text),public.get_luke_greetings(),
  public.claim_luke_greeting_prompt(text,integer),public.save_luke_greeting(text,integer,text,text,text,bigint),
  public.read_luke_greetings(text,jsonb),public.luke_media_ready() from public,anon,authenticated;
revoke all on function public.luke_media_can_remove(text),public.luke_media_can_delete(text),public.luke_unused_media(),public.finish_luke_cleanup(jsonb),public.finish_luke_media(text),public.luke_guard_calendar_media() from public,anon,authenticated;
grant execute on function public.luke_can_reply(text,integer),public.luke_media_can_read(text),public.luke_media_can_write(text),
  public.reserve_luke_media(text,integer,text,text,integer,text),public.get_luke_greetings(),
  public.claim_luke_greeting_prompt(text,integer),public.save_luke_greeting(text,integer,text,text,text,bigint),
  public.read_luke_greetings(text,jsonb) to authenticated;
grant execute on function public.luke_media_can_remove(text),public.luke_media_can_delete(text),public.luke_unused_media(),public.finish_luke_cleanup(jsonb),public.finish_luke_media(text) to authenticated;
grant execute on function public.luke_media_ready() to anon,authenticated;
do $$ begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='luke_greetings') then
    alter publication supabase_realtime add table public.luke_greetings;
  end if;
end $$;
notify pgrst,'reload schema';
commit;
