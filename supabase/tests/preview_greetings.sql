begin;
insert into auth.users(id,email) values
 ('7b000000-0000-4000-8000-000000000001','trial-owner@example.invalid'),
 ('7b000000-0000-4000-8000-000000000002','trial-recipient@example.invalid');
insert into public.luke_calendars(id,owner_id,document)
 values('greeting-trial','7b000000-0000-4000-8000-000000000001',jsonb_build_object('id','greeting-trial','title','Keep this','year',2020,'doors',
  (select jsonb_agg(jsonb_build_object('day',d,'kind','message','title','','body','Original content')) from generate_series(1,24) d)));
insert into public.luke_members(calendar_id,user_id) values('greeting-trial','7b000000-0000-4000-8000-000000000002');
create temp table trial_media(path text);grant all on trial_media to authenticated;
set local role authenticated;
select set_config('request.jwt.claim.sub','7b000000-0000-4000-8000-000000000001',true);
do $$ begin
 assert not has_function_privilege('anon','public.luke_preview_greeting(text,text,integer,text,jsonb)','EXECUTE');
 begin perform public.luke_preview_greeting('greeting-trial','test',1,'claim');raise exception 'Disabled saved trial accepted';exception when insufficient_privilege then null;end;
 perform public.luke_preview('greeting-trial','enable','{"enabled":true}');
 begin perform public.luke_preview_greeting('greeting-trial','test',1,'claim');raise exception 'Unopened trial accepted';exception when insufficient_privilege then null;end;
 perform public.luke_preview('greeting-trial','merge','{"mode":"test","progress":{"opened":[1],"answers":{}}}');
 assert public.luke_preview_greeting('greeting-trial','test',1,'claim')='true';
 assert public.luke_preview_greeting('greeting-trial','test',1,'claim')='false','Prompt repeated across devices';
 perform public.luke_preview_greeting('greeting-trial','test',1,'save','{"body":"Prøve","image":null,"audio":null,"revision":0}');
 assert public.get_luke_greetings()->0->>'body'='Prøve';
 assert public.get_luke_greetings()->0->>'previewMode'='test';
 assert public.get_luke_greetings()->0->>'owner'='true';
 assert public.get_luke_greetings()->0->>'revision'='1';
 perform public.luke_preview_greeting('greeting-trial','test',1,'save','{"body":"Prøve","image":null,"audio":null,"revision":1}');
 assert public.get_luke_greetings()->0->>'revision'='1','Unchanged trial raised another notification';
 begin perform public.luke_preview_greeting('greeting-trial','test',1,'save','{"body":"Stale","image":null,"audio":null,"revision":0}');raise exception 'Stale trial overwritten';exception when serialization_failure then null;end;
 begin perform public.luke_preview_greeting('greeting-trial','date',1,'save','{"body":"Wrong mode","revision":0}');raise exception 'Test opening leaked to date';exception when insufficient_privilege then null;end;
 perform public.luke_preview('greeting-trial','merge','{"mode":"date","progress":{"opened":[1],"answers":{}}}');
 perform public.luke_preview_greeting('greeting-trial','date',1,'save','{"body":"Date trial","revision":0}');
 assert jsonb_array_length(public.get_luke_greetings())=2;
 perform public.read_luke_greetings('greeting-trial','[{"userId":"7b000000-0000-4000-8000-000000000001","day":1,"revision":1,"previewMode":"test"}]');
 assert (select greetings#>>'{test,1,seenRevision}'='1' and greetings#>>'{date,1,seenRevision}'='0' from public.luke_preview_progress where calendar_id='greeting-trial');
 perform public.luke_preview_greeting('greeting-trial','test',1,'save','{"body":"Edited trial","revision":1}');
 perform public.read_luke_greetings('greeting-trial','[{"userId":"7b000000-0000-4000-8000-000000000001","day":1,"revision":1,"previewMode":"test"}]');
 assert (select greetings#>>'{test,1,revision}'='2' and greetings#>>'{test,1,seenRevision}'='1' from public.luke_preview_progress where calendar_id='greeting-trial'),'Old read confirmation consumed a newer trial';
end $$;
insert into trial_media select public.reserve_luke_media('greeting-trial',1,'door','audio/mp4',200,repeat('a',64));
insert into storage.objects(bucket_id,name,metadata) select 'luke-media',path,'{"size":200,"mimetype":"audio/mp4"}' from trial_media;
select public.finish_luke_media(path) from trial_media;
select public.luke_preview_greeting('greeting-trial','test',1,'save',jsonb_build_object('body','With voice','image',null,'audio','luke-media:'||path,'revision',2)) from trial_media;
select public.luke_preview('greeting-trial','enable','{"enabled":false}');
do $$ begin
 assert public.get_luke_greetings()='[]'::jsonb,'Disabled saved trials still displayed';
 begin perform public.luke_preview_greeting('greeting-trial','test',1,'save','{"body":"While off","revision":3}');raise exception 'Disabled trial wrote to account';exception when insufficient_privilege then null;end;
end $$;
reset role;
update public.luke_media set created_at=now()-interval '2 days' where calendar_id='greeting-trial';
set local role authenticated;
select set_config('request.jwt.claim.sub','7b000000-0000-4000-8000-000000000001',true);
do $$ begin
 assert not public.luke_media_can_remove((select path from trial_media)),'Hidden saved trial audio considered garbage';
 perform public.luke_preview('greeting-trial','enable','{"enabled":true}');
 assert (select greetings#>>'{test,1,body}'='With voice' from public.luke_preview_progress where calendar_id='greeting-trial'),'Toggle deleted saved trial';
end $$;
select set_config('request.jwt.claim.sub','7b000000-0000-4000-8000-000000000002',true);
do $$ begin
 assert public.get_luke_greetings()='[]'::jsonb,'Recipient read an owner trial';
 assert (select count(*)=0 from public.luke_preview_progress),'Raw trial rows leaked to recipient';
 assert not public.luke_media_can_read((select path from trial_media)),'Trial audio leaked through membership';
 assert public.get_luke_workspace()::text not like '%luke-media:%','Trial media leaked into shared calendar';
 begin perform public.luke_preview_greeting('greeting-trial','test',1,'claim');raise exception 'Recipient claimed owner trial';exception when insufficient_privilege then null;end;
 perform public.open_luke_door('greeting-trial',1);
 perform public.save_luke_greeting('greeting-trial',1,'Real recipient',null,null,0);
 assert public.get_luke_greetings()->0->>'body'='Real recipient','Real reply affected by trial';
end $$;
select set_config('request.jwt.claim.sub','7b000000-0000-4000-8000-000000000001',true);
do $$ begin
 assert jsonb_array_length(public.get_luke_greetings())=3,'Owner cannot see both real replies and trials';
 assert (select count(*)=1 from public.luke_greetings where calendar_id='greeting-trial'),'Owner trial became a real recipient reply';
 assert (select revision=1 and document->>'title'='Keep this' from public.luke_calendars where id='greeting-trial'),'Trial changed original calendar';
end $$;
reset role;
do $$ begin
 assert (select count(*)=1 from public.luke_progress where calendar_id='greeting-trial'),'Trial created real owner progress';
 assert (select opened=array[1] from public.luke_progress where calendar_id='greeting-trial' and user_id='7b000000-0000-4000-8000-000000000002'),'Trial changed recipient progress';
end $$;
rollback;
select 'PASS: owner trial greetings, mode isolation, cross-device revisions, prompts, read markers, persistence toggle, private media, real recipient isolation and unchanged calendar data.' result;
