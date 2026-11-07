-- Owner-only trial greetings. Existing calendars and real recipient replies stay intact.
begin;
alter table public.luke_preview_progress add column if not exists greetings jsonb not null default '{}';

create or replace function public.get_luke_greetings() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare uid uuid:=public.luke_require_user(); result jsonb;
begin
  select coalesce(jsonb_agg(payload order by updated desc),'[]') into result from (
    select jsonb_build_object('calendarId',g.calendar_id,'userId',g.user_id,'day',g.day,
      'name',coalesce(nullif(p.name,''),nullif(u.raw_user_meta_data->>'name',''),'En venn'),
      'body',g.body,'image',g.image,'audio',g.audio,'revision',g.revision,'seenRevision',g.seen_revision,
      'updatedAt',g.updated_at,'owner',g.owner_id=uid) payload,g.updated_at updated
    from public.luke_greetings g left join public.luke_profiles p on p.user_id=g.user_id join auth.users u on u.id=g.user_id
    where (g.owner_id=uid and g.revision>0) or (g.user_id=uid and public.luke_can_reply(g.calendar_id,g.day))
    union all
    select jsonb_build_object('calendarId',p.calendar_id,'userId',uid,'day',d.key::integer,'name','Deg',
      'body',d.value->>'body','image',d.value->'image','audio',d.value->'audio',
      'revision',d.value->'revision','seenRevision',d.value->'seenRevision','updatedAt',d.value->>'updatedAt',
      'owner',true,'previewMode',m.key),(d.value->>'updatedAt')::timestamptz
    from public.luke_preview_progress p join public.luke_calendars c on c.id=p.calendar_id and c.owner_id=uid
      cross join lateral jsonb_each(p.greetings) m cross join lateral jsonb_each(m.value) d
    where p.user_id=uid and p.enabled and (d.value->>'revision')::bigint>0
  ) entries;
  return result;
end $$;

create or replace function public.luke_preview_greeting(p_calendar_id text,p_mode text,p_day integer,p_action text,p_payload jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=public.luke_require_user(); r public.luke_preview_progress; c jsonb; entries jsonb; item jsonb;
  body text; image text; audio text; rev bigint; claimed boolean;
begin
  select document into c from public.luke_calendars where id=p_calendar_id and owner_id=uid;
  if c is null then raise exception 'Bare eieren kan teste hilsener her.' using errcode='42501'; end if;
  if p_mode is null or p_mode not in ('test','date') or p_day is null or p_day not between 1 and 24
    or p_action is null or p_action not in ('claim','save') or p_payload is null
    or jsonb_typeof(p_payload)<>'object' or octet_length(p_payload::text)>25000 then raise exception 'Ugyldig prøvehilsen.'; end if;
  select * into r from public.luke_preview_progress where calendar_id=p_calendar_id and user_id=uid for update;
  if not found or not r.enabled then raise exception 'Slå på Lagre fremdrift for å lagre prøvehilsenen.' using errcode='42501'; end if;
  if not ((case when p_mode='test' then r.test_progress else r.date_progress end)->'opened' @> jsonb_build_array(p_day))
    or (p_mode='date' and p_day>public.luke_available_day((c->>'year')::integer)) then
    raise exception 'Åpne luka i forhåndsvisningen først.' using errcode='42501'; end if;
  entries:=coalesce(r.greetings->p_mode,'{}');item:=entries->p_day::text;claimed:=item is null;
  if p_action='claim' and not claimed then return 'false'; end if;
  item:=coalesce(item,jsonb_build_object('body','','image',null,'audio',null,'revision',0,'seenRevision',0,'updatedAt',clock_timestamp()));
  if p_action='save' then
    if jsonb_typeof(p_payload->'body') is distinct from 'string'
      or coalesce(jsonb_typeof(p_payload->'image'),'null') not in ('string','null')
      or coalesce(jsonb_typeof(p_payload->'audio'),'null') not in ('string','null')
      or jsonb_typeof(p_payload->'revision') is distinct from 'number' or p_payload->>'revision' !~ '^[0-9]{1,15}$' then
      raise exception 'Ugyldig prøvehilsen.'; end if;
    body:=trim(p_payload->>'body');image:=p_payload->>'image';audio:=p_payload->>'audio';rev:=(p_payload->>'revision')::bigint;
    if length(body)>3000 or (body='' and image is null and audio is null) then raise exception 'Skriv en hilsen, eller legg til bilde eller lyd.'; end if;
    if (item->>'revision')::bigint<>rev then raise exception 'Prøvehilsenen er endret på en annen enhet. Hent den nyeste versjonen før du lagrer.' using errcode='40001'; end if;
    -- Trial files use the owner's private door uploads. They are never attached
    -- to the calendar document, so membership cannot grant download access.
    perform 1 from public.luke_media where 'luke-media:'||path in (image,audio) order by path for share;
    if (image is not null and not exists(select 1 from public.luke_media where 'luke-media:'||path=image and calendar_id=p_calendar_id and day=p_day and scope='door' and user_id=uid and uploaded_at is not null and not deleting and mime_type like 'image/%'))
      or (audio is not null and not exists(select 1 from public.luke_media where 'luke-media:'||path=audio and calendar_id=p_calendar_id and day=p_day and scope='door' and user_id=uid and uploaded_at is not null and not deleting and mime_type like 'audio/%')) then
      raise exception 'Vedlegget tilhører ikke denne prøvehilsenen.' using errcode='42501'; end if;
    if item->>'body'=body and item->>'image' is not distinct from image and item->>'audio' is not distinct from audio then return public.get_luke_greetings(); end if;
    item:=item||jsonb_build_object('body',body,'image',image,'audio',audio,'revision',rev+1,'updatedAt',clock_timestamp());
  end if;
  update public.luke_preview_progress set greetings=greetings||jsonb_build_object(p_mode,entries||jsonb_build_object(p_day::text,item)),
    revision=revision+1,updated_at=clock_timestamp() where calendar_id=p_calendar_id and user_id=uid;
  if p_action='claim' then return to_jsonb(claimed); end if;
  return public.get_luke_greetings();
end $$;

create or replace function public.read_luke_greetings(p_calendar_id text,p_seen jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=public.luke_require_user(); item jsonb; r public.luke_preview_progress; entry jsonb; mode text; day_key text; seen bigint;
begin
  if not exists(select 1 from public.luke_calendars where id=p_calendar_id and owner_id=uid) then raise exception 'Ingen tilgang.' using errcode='42501'; end if;
  if jsonb_typeof(p_seen) is distinct from 'array' or jsonb_array_length(p_seen)>500 then raise exception 'Ugyldig lesebekreftelse.'; end if;
  for item in select value from jsonb_array_elements(p_seen) loop
    mode:=item->>'previewMode';
    if mode is null then
      update public.luke_greetings set seen_revision=greatest(seen_revision,least(revision,(item->>'revision')::bigint))
        where calendar_id=p_calendar_id and owner_id=uid and user_id=(item->>'userId')::uuid and day=(item->>'day')::integer
          and seen_revision<least(revision,(item->>'revision')::bigint);
    elsif mode in ('test','date') and item->>'userId'=uid::text then
      select * into r from public.luke_preview_progress where calendar_id=p_calendar_id and user_id=uid for update;
      day_key:=item->>'day';entry:=r.greetings#>array[mode,day_key];
      if entry is not null and r.enabled then
        seen:=greatest((entry->>'seenRevision')::bigint,least((entry->>'revision')::bigint,(item->>'revision')::bigint));
        if seen>(entry->>'seenRevision')::bigint then
          update public.luke_preview_progress set greetings=jsonb_set(greetings,array[mode,day_key,'seenRevision'],to_jsonb(seen)),
            revision=revision+1,updated_at=clock_timestamp() where calendar_id=p_calendar_id and user_id=uid;
        end if;
      end if;
    end if;
  end loop;
  return public.get_luke_greetings();
end $$;

create or replace function public.luke_media_can_remove(p_path text) returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.luke_media a where a.path=p_path and a.user_id=auth.uid() and a.created_at<now()-interval '1 day'
    and not exists(select 1 from public.luke_calendars c where c.id=a.calendar_id and strpos(c.document::text,'luke-media:'||a.path)>0)
    and not exists(select 1 from public.luke_greetings g where g.image='luke-media:'||a.path or g.audio='luke-media:'||a.path)
    and not exists(select 1 from public.luke_preview_progress p where p.calendar_id=a.calendar_id and p.user_id=a.user_id
      and strpos(p.greetings::text,'luke-media:'||a.path)>0))
$$;
create or replace function public.luke_media_ready() returns integer language sql stable set search_path='' as $$ select 3 $$;
revoke all on function public.luke_preview_greeting(text,text,integer,text,jsonb) from public,anon,authenticated;
grant execute on function public.luke_preview_greeting(text,text,integer,text,jsonb) to authenticated;
notify pgrst,'reload schema';
commit;
