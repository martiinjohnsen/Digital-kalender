-- A presentation preference, separate from calendars and their revisions.
begin;
create table if not exists public.luke_glass_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  level integer not null check(level between 0 and 100),
  updated_at timestamptz not null default now()
);
alter table public.luke_glass_settings enable row level security;
revoke all on public.luke_glass_settings from anon,authenticated;
grant select on public.luke_glass_settings to authenticated;
do $$ begin
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='luke_glass_settings' and policyname='own_glass') then
    create policy own_glass on public.luke_glass_settings for select to authenticated using(user_id=(select auth.uid()));
  end if;
end $$;
create or replace function public.luke_glass(p_level integer default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid := public.luke_require_user(); result integer;
begin
  if p_level is not null then
    if p_level not between 0 and 100 then raise exception 'Velg et glassnivå mellom 0 og 100.'; end if;
    insert into public.luke_glass_settings(user_id,level) values(uid,p_level)
      on conflict(user_id) do update set level=excluded.level,updated_at=now()
      where public.luke_glass_settings.level is distinct from excluded.level;
  end if;
  select level into result from public.luke_glass_settings where user_id=uid;
  return jsonb_build_object('level',coalesce(result,60));
end $$;
revoke all on function public.luke_glass(integer) from public,anon,authenticated;
grant execute on function public.luke_glass(integer) to authenticated;
do $$ begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='luke_glass_settings') then
    alter publication supabase_realtime add table public.luke_glass_settings;
  end if;
end $$;
commit;
