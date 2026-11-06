-- Isolated fixtures, never run against the live project.
begin;
insert into auth.users(id,email) values
 ('fb000000-0000-4000-8000-000000000001','preview-owner@luke.example'),
 ('fb000000-0000-4000-8000-000000000002','preview-recipient@luke.example'),
 ('fb000000-0000-4000-8000-000000000003','preview-stranger@luke.example');
insert into public.luke_calendars(id,owner_id,document) values (
 'preview-test','fb000000-0000-4000-8000-000000000001',jsonb_build_object('year',2100,'doors',jsonb_build_array(
 jsonb_build_object('day',1,'body','Keep this content','questions','[{"title":"Velg","options":["A","B"],"answerIndex":1},{"title":"Skriv","type":"text","acceptedAnswers":["God jul"]}]'::jsonb),
 jsonb_build_object('day',2,'body','Second door'))));
insert into public.luke_members(calendar_id,user_id) values ('preview-test','fb000000-0000-4000-8000-000000000002');
select set_config('request.jwt.claim.sub','fb000000-0000-4000-8000-000000000001',true);
set local role authenticated;
do $$ declare a jsonb; b jsonb; begin
 assert not has_function_privilege('anon','public.luke_preview(text,text,jsonb)','EXECUTE'), 'Guest preview RPC exposed';
 assert not has_function_privilege('authenticated','public.luke_preview_payload(jsonb)','EXECUTE'), 'Private payload helper exposed';
 assert not has_table_privilege('authenticated','public.luke_preview_progress','UPDATE'), 'Direct preview writes exposed';
 a:=public.luke_preview('preview-test');
 assert a->>'initialized'='false' and a->>'enabled'='false', 'New preview must start clean';
 begin perform public.luke_preview('preview-test','merge','{"mode":"test","progress":{"opened":[1],"answers":{}}}'); raise exception 'Disabled preview accepted write'; exception when raise_exception then assert sqlerrm='Slå på Lagre fremdrift først.'; end;
 a:=public.luke_preview('preview-test','enable','{"enabled":true}');
 assert a->>'enabled'='true', 'Account preference missing';
 a:=public.luke_preview('preview-test','merge','{"mode":"test","progress":{"opened":[1],"answers":{"1-0-abc":{"answer":0,"result":{"correct":true}}}}}');
 assert a->'test'->'opened'='[1]' and a->'test'->'answers'->'1-0-abc'='{"answer":0}', 'Preview save or sanitization failed';
 -- A second device loads the same state and contributes without replacing it.
 b:=public.luke_preview('preview-test');
 assert a=b, 'Fresh device sees different preview';
 b:=public.luke_preview('preview-test','merge','{"mode":"test","progress":{"opened":[2],"answers":{"1-0-abc":{"answer":1},"1-1-text":{"text":"God jul"}}}}');
 assert b->'test'->'opened'='[1,2]' and b->'test'->'answers'->'1-0-abc'->>'answer'='0', 'Concurrent device overwrote first attempt';
 assert b->'date'='{"opened":[],"answers":{}}', 'Test mode leaked into date mode';
 begin perform public.luke_preview('preview-test','merge','{"mode":"date","progress":{"opened":[1],"answers":{}}}'); raise exception 'Future date opened'; exception when insufficient_privilege then null; end;
 begin perform public.luke_preview('preview-test','merge','{"mode":"test","progress":{"opened":[0,25],"answers":{}}}'); raise exception 'Invalid days saved'; exception when raise_exception then assert sqlerrm='Ugyldig lukenummer.'; end;
 begin perform public.luke_preview('preview-test','merge','{"mode":"test","progress":{"opened":[],"answers":{"1-0-bad":{"answers":[1,1]}}}}'); raise exception 'Repeated options saved'; exception when raise_exception then assert sqlerrm='Ugyldige svaralternativer.'; end;
 begin perform public.luke_preview('preview-test','merge','{"mode":"test","progress":{"opened":[],"answers":{"1-0-bad":{"answers":[11]}}}}'); raise exception 'Nonexistent option saved'; exception when raise_exception then assert sqlerrm='Ugyldig svaralternativ.'; end;
 begin perform public.luke_preview('preview-test','merge','{"mode":"test","progress":{"opened":[],"answers":{"2-0-bad":{"answer":0}}}}'); raise exception 'Nonexistent question saved'; exception when raise_exception then assert sqlerrm='Spørsmålet finnes ikke.'; end;
 -- An old device imports both historic slots. Server attempts still win.
 b:=public.luke_preview('preview-test','import','{"test":{"opened":[3],"answers":{"1-0-abc":{"answer":1},"4-0-legacy":{"answer":0}}},"date":{"opened":[1],"answers":{"1-0-old":{"answers":[1]}}}}');
 assert b->'test'->'opened'='[1,2,3]' and b->'test'->'answers'->'1-0-abc'->>'answer'='0', 'Import lost existing preview';
 assert b->'date'->'answers' ? '1-0-old' and b->'test'->'answers' ? '4-0-legacy', 'Legacy answers lost';
 b:=public.luke_preview('preview-test','enable','{"enabled":false}');
 assert b->>'enabled'='false' and b->'test'->'opened'='[1,2,3]', 'Disable deleted saved trial';
 a:=public.luke_preview('preview-test','enable','{"enabled":true}');
 assert a->'test'->'answers'=b->'test'->'answers', 'Re-enable reset saved trial';
 assert (select count(*)=0 from public.luke_answers) and (select count(*)=0 from public.luke_progress), 'Preview changed real recipient data';
 assert (select revision=1 and document->'doors'->0->>'body'='Keep this content' from public.luke_calendars where id='preview-test'), 'Preview changed calendar document';
end $$;
select set_config('request.jwt.claim.sub','fb000000-0000-4000-8000-000000000002',true);
do $$ begin
 assert (select count(*)=0 from public.luke_preview_progress), 'Recipient can read owner trial';
 begin perform public.luke_preview('preview-test'); raise exception 'Recipient loaded owner trial'; exception when insufficient_privilege then null; end;
 begin perform public.luke_preview('preview-test','enable','{"enabled":true}'); raise exception 'Recipient edited owner trial'; exception when insufficient_privilege then null; end;
 begin perform public.open_luke_door('preview-test',1); raise exception 'Recipient future lock bypass'; exception when insufficient_privilege then null; end;
 begin perform public.submit_luke_answer('preview-test',1,0,'{"answers":[1]}'); raise exception 'Recipient future quiz bypass'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','fb000000-0000-4000-8000-000000000003',true);
do $$ begin
 assert (select count(*)=0 from public.luke_preview_progress), 'Stranger can read owner trial';
 begin perform public.luke_preview('preview-test'); raise exception 'Stranger loaded owner trial'; exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'PASS: account preview sync, atomic merges, legacy imports, mode isolation, first attempts, owner-only permissions and unchanged recipient locks/data. All test data rolled back.' result;
