-- Real PostgreSQL permissions, disposable storage metadata and isolated accounts.
begin;
insert into auth.users(id,email,raw_user_meta_data) values
 ('7a000000-0000-4000-8000-000000000001','owner@example.invalid','{"name":"Avsender"}'),
 ('7a000000-0000-4000-8000-000000000002','first@example.invalid','{"name":"Mottaker A"}'),
 ('7a000000-0000-4000-8000-000000000003','second@example.invalid','{"name":"Mottaker B"}'),
 ('7a000000-0000-4000-8000-000000000004','stranger@example.invalid','{}');
insert into public.luke_calendars(id,owner_id,document)
 select id,'7a000000-0000-4000-8000-000000000001',jsonb_build_object('id',id,'title','Kalender','year',year,'doors',
 (select jsonb_agg(jsonb_build_object('day',d,'kind','message','title','','body','Hei')) from generate_series(1,24) d))
 from (values('media-past',2020),('media-future',2100)) c(id,year);
insert into public.luke_members(calendar_id,user_id)
 select c.id,u.id from public.luke_calendars c cross join auth.users u
 where c.id in ('media-past','media-future') and u.id in ('7a000000-0000-4000-8000-000000000002','7a000000-0000-4000-8000-000000000003');
create temp table media_vars(k text primary key,v text);
grant select,insert,update on media_vars to authenticated;
set local role authenticated;
select set_config('request.jwt.claim.sub','7a000000-0000-4000-8000-000000000001',true);
insert into media_vars values('past',public.reserve_luke_media('media-past',1,'door','image/jpeg',500,repeat('a',64))),
 ('future',public.reserve_luke_media('media-future',24,'door','audio/mp4',800,repeat('b',64))),
 ('orphan',public.reserve_luke_media('media-past',2,'door','image/jpeg',500,repeat('e',64)));
insert into storage.objects(bucket_id,name,metadata) select 'luke-media',v,jsonb_build_object('size',500,'mimetype',a.mime_type) from media_vars join public.luke_media a on a.path=v;
select public.finish_luke_media(v) from media_vars;
do $$ begin
 assert (select count(*)=3 from storage.objects), 'Owner cannot read uploaded files';
 assert public.reserve_luke_media('media-past',1,'door','image/jpeg',500,repeat('a',64))=(select v from media_vars where k='past'), 'Retries create duplicate files';
 assert not has_function_privilege('anon','public.reserve_luke_media(text,integer,text,text,integer,text)','EXECUTE'), 'Anonymous upload registration';
 assert not has_table_privilege('authenticated','public.luke_greetings','UPDATE'), 'Direct greeting mutation';
 begin perform public.reserve_luke_media('media-past',1,'door','text/html',10,repeat('c',64)); raise exception 'HTML attachment accepted'; exception when raise_exception then if sqlerrm='HTML attachment accepted' then raise;end if;end;
 begin perform public.reserve_luke_media('media-past',1,'door','audio/mp4',9000000,repeat('c',64));raise exception 'Oversized attachment accepted';exception when raise_exception then if sqlerrm='Oversized attachment accepted' then raise;end if;end;
end $$;
reset role;
update public.luke_calendars set document=jsonb_set(document,'{doors,0,image}',to_jsonb('luke-media:'||(select v from media_vars where k='past'))) where id='media-past';
update public.luke_calendars set document=jsonb_set(document,'{doors,23,audio}',to_jsonb('luke-media:'||(select v from media_vars where k='future'))) where id='media-future';
set local role authenticated;
select set_config('request.jwt.claim.sub','7a000000-0000-4000-8000-000000000002',true);
do $$ begin
 assert (select count(*)=1 from storage.objects), 'Recipient can see future or unpublished media';
 assert not public.luke_media_can_read((select v from media_vars where k='future')), 'Future download authorized';
 assert public.get_luke_workspace()::text not like '%'||(select v from media_vars where k='future')||'%', 'Future media reference leaked in calendar';
 begin perform public.claim_luke_greeting_prompt('media-past',1);raise exception 'Prompt before opening accepted';exception when insufficient_privilege then null;end;
 begin perform public.reserve_luke_media('media-past',1,'door','image/jpeg',1,repeat('c',64));raise exception 'Recipient uploaded door content';exception when insufficient_privilege then null;end;
 perform public.open_luke_door('media-past',1);
 assert public.claim_luke_greeting_prompt('media-past',1), 'First close did not claim a prompt';
 assert not public.claim_luke_greeting_prompt('media-past',1), 'Dismissed prompt repeated';
 perform public.save_luke_greeting('media-past',1,'Takk for luka!',null,null,0);
 assert public.get_luke_greetings()->0->>'body'='Takk for luka!', 'Greeting not returned to sender';
 assert (public.get_luke_greetings()->0->>'revision')::integer=1, 'First revision incorrect';
 perform public.save_luke_greeting('media-past',1,'Takk for luka!',null,null,1);
 assert (public.get_luke_greetings()->0->>'revision')::integer=1, 'Unchanged save raises unread notification';
 begin perform public.save_luke_greeting('media-past',1,'Old draft',null,null,0);raise exception 'Stale greeting overwrote a new one';exception when serialization_failure then null;end;
 begin perform public.save_luke_greeting('media-past',1,'Bad attachment','luke-media:'||(select v from media_vars where k='past'),null,1);raise exception 'Someone else media attached';exception when insufficient_privilege then null;end;
 begin perform public.claim_luke_greeting_prompt('media-future',1);raise exception 'Future prompt accepted';exception when insufficient_privilege then null;end;
end $$;
insert into media_vars values('reply',public.reserve_luke_media('media-past',1,'reply','image/jpeg',500,repeat('c',64))),
 ('voice',public.reserve_luke_media('media-past',1,'reply','audio/webm',1500,repeat('d',64)));
insert into storage.objects(bucket_id,name,metadata) select 'luke-media',v,jsonb_build_object('size',500,'mimetype',a.mime_type) from media_vars join public.luke_media a on a.path=v where k in ('reply','voice');
select public.finish_luke_media(v) from media_vars where k in ('reply','voice');
select set_config('request.jwt.claim.sub','7a000000-0000-4000-8000-000000000001',true);
do $$ begin assert not public.luke_media_can_read((select v from media_vars where k='reply')), 'Owner can read an unsent draft attachment';end $$;
select set_config('request.jwt.claim.sub','7a000000-0000-4000-8000-000000000002',true);
select public.save_luke_greeting('media-past',1,'Her er min hilsen','luke-media:'||(select v from media_vars where k='reply'),'luke-media:'||(select v from media_vars where k='voice'),1);
select set_config('request.jwt.claim.sub','7a000000-0000-4000-8000-000000000003',true);
do $$ begin
 assert public.get_luke_greetings()='[]'::jsonb, 'Recipient B can read recipient A greeting';
 assert (select count(*)=0 from public.luke_greetings), 'Raw greeting rows leak to another recipient';
 assert not public.luke_media_can_read((select v from media_vars where k='reply')), 'Recipient B can download recipient A photo';
 assert not public.luke_media_can_read((select v from media_vars where k='voice')), 'Recipient B can download recipient A voice';
 begin insert into storage.objects(bucket_id,name) values('luke-media',(select v from media_vars where k='reply')||'x');raise exception 'Unregistered upload accepted';exception when insufficient_privilege then null;end;
 begin perform public.read_luke_greetings('media-past','[]');raise exception 'Recipient marked owner notifications read';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claim.sub','7a000000-0000-4000-8000-000000000001',true);
do $$ begin
 assert (public.get_luke_greetings()->0->>'revision')::integer=2, 'Owner missing edited greeting';
 assert (public.get_luke_greetings()->0->>'seenRevision')::integer=0, 'Greeting marked read before viewing';
 assert public.luke_media_can_read((select v from media_vars where k='reply')), 'Owner cannot read recipient image';
 assert public.luke_media_can_read((select v from media_vars where k='voice')), 'Owner cannot read recipient audio';
 perform public.read_luke_greetings('media-past','[{"userId":"7a000000-0000-4000-8000-000000000002","day":1,"revision":1}]');
 assert (public.get_luke_greetings()->0->>'seenRevision')::integer=1, 'Read marker consumed a newer edit';
 perform public.read_luke_greetings('media-past','[{"userId":"7a000000-0000-4000-8000-000000000002","day":1,"revision":2}]');
 assert (public.get_luke_greetings()->0->>'seenRevision')::integer=2, 'Read marker not persisted';
end $$;
select set_config('request.jwt.claim.sub','7a000000-0000-4000-8000-000000000002',true);
select public.save_luke_greeting('media-past',1,'Ny oppdatering','luke-media:'||(select v from media_vars where k='reply'),'luke-media:'||(select v from media_vars where k='voice'),2);
select set_config('request.jwt.claim.sub','7a000000-0000-4000-8000-000000000004',true);
do $$ begin
 assert (select count(*)=0 from storage.objects), 'Stranger can list files';
 assert public.get_luke_greetings()='[]'::jsonb, 'Stranger can list greetings';
 begin perform public.save_luke_greeting('media-past',1,'Forged',null,null,0);raise exception 'Stranger sent a greeting';exception when insufficient_privilege then null;end;
end $$;
reset role;
update public.luke_media set created_at=now()-interval '2 days';
set local role authenticated;
select set_config('request.jwt.claim.sub','7a000000-0000-4000-8000-000000000001',true);
do $$ begin
 assert public.luke_media_can_remove((select v from media_vars where k='orphan')), 'Unused upload not collected';
 assert not public.luke_media_can_remove((select v from media_vars where k='past')), 'Attached image considered garbage';
 assert not public.luke_media_can_remove((select v from media_vars where k='future')), 'Future audio considered garbage';
 assert not public.luke_media_can_remove((select v from media_vars where k='reply')), 'Owner can delete recipient attachment';
 assert (public.get_luke_greetings()->0->>'revision')::integer=3 and (public.get_luke_greetings()->0->>'seenRevision')::integer=2, 'Edited greeting did not become unread again';
end $$;
select public.luke_unused_media();
delete from storage.objects where name=(select v from media_vars where k='orphan');
select public.finish_luke_cleanup(jsonb_build_array((select v from media_vars where k='orphan')));
do $$ begin assert not exists(select 1 from public.luke_media where path=(select v from media_vars where k='orphan')), 'Deleted file left a reservation';end $$;
insert into media_vars values('size-check',public.reserve_luke_media('media-past',3,'door','image/jpeg',1,repeat('f',64)));
insert into storage.objects(bucket_id,name,metadata) values('luke-media',(select v from media_vars where k='size-check'),'{"size":700,"mimetype":"image/jpeg"}');
select public.finish_luke_media((select v from media_vars where k='size-check'));
do $$ begin
 assert (select bytes=700 from public.luke_media where path=(select v from media_vars where k='size-check')), 'Quota trusts browser-declared bytes';
 assert not public.luke_media_can_delete((select v from media_vars where k='past')), 'Attached object can be deleted';
end $$;
select public.stop_luke_sharing('media-past');
select set_config('request.jwt.claim.sub','7a000000-0000-4000-8000-000000000002',true);
do $$ begin
 assert public.get_luke_greetings()='[]'::jsonb, 'Removed member retains greeting access';
 assert not public.luke_media_can_read((select v from media_vars where k='reply')), 'Revoked photo access remains';
 begin perform public.save_luke_greeting('media-past',1,'After revocation',null,null,3);raise exception 'Revoked user edited greeting';exception when insufficient_privilege then null;end;
end $$;
reset role;
do $$ begin
 assert (select opened=array[1] from public.luke_progress where calendar_id='media-past' and user_id='7a000000-0000-4000-8000-000000000002'), 'Greeting changed opened progress';
 assert (select revision=1 from public.luke_calendars where id='media-past'), 'Greeting changed calendar revision';
 assert (select public=false and file_size_limit=8388608 from storage.buckets where id='luke-media'), 'Attachment bucket is public or unlimited';
end $$;
rollback;
select 'PASS: private attachments, future locks, upload limits, immutable paths, editable greetings, one-time prompts, unread revisions, recipient isolation, cleanup and revocation. All test data rolled back.' as result;
