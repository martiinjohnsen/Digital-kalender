begin;
insert into auth.users(id,email) values('fc000000-0000-4000-8000-000000000001','glass-owner@luke.example'),('fc000000-0000-4000-8000-000000000002','glass-other@luke.example');
insert into public.luke_profiles(user_id,name,snow) values('fc000000-0000-4000-8000-000000000001','Behold navnet',false);
select set_config('request.jwt.claim.sub','fc000000-0000-4000-8000-000000000001',true);
set local role authenticated;
do $$ begin
 assert public.luke_glass()->>'level'='60', 'Existing accounts lack default';
 assert public.luke_glass(15)->>'level'='15', 'Preference write failed';
 assert public.luke_glass()->>'level'='15', 'Second device cannot read preference';
 assert public.luke_glass(100)->>'level'='100', 'Endpoint value failed';
 begin perform public.luke_glass(101); raise exception 'Out-of-range glass accepted'; exception when raise_exception then assert sqlerrm='Velg et glassnivå mellom 0 og 100.'; end;
 assert public.luke_glass()->>'level'='100', 'Failed write lost preference';
 assert (select name='Behold navnet' and snow=false from public.luke_profiles), 'Glass changed existing profile';
 assert not has_function_privilege('anon','public.luke_glass(integer)','EXECUTE'), 'Anonymous access';
 assert not has_table_privilege('authenticated','public.luke_glass_settings','UPDATE'), 'Direct writes exposed';
end $$;
select set_config('request.jwt.claim.sub','fc000000-0000-4000-8000-000000000002',true);
do $$ begin
 assert (select count(*)=0 from public.luke_glass_settings), 'Another account sees preference';
 assert public.luke_glass()->>'level'='60', 'New account inherited another preference';
 perform public.luke_glass(30);
 assert public.luke_glass()->>'level'='30', 'Second account cannot save own preference';
end $$;
select set_config('request.jwt.claim.sub','fc000000-0000-4000-8000-000000000001',true);
do $$ begin assert public.luke_glass()->>'level'='100', 'Other account overwrote owner'; end $$;
reset role;
rollback;
select 'PASS: glass preference defaults, cross-device readback, range checks, account isolation and unchanged profile. All test data rolled back.' result;
