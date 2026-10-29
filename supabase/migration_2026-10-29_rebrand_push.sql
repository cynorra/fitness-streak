-- Rebrand: server-side push titles VitaTribe / StreakFit -> DietitianFit. Idempotent.
-- Rewrites every public function whose body still mentions the old names (push_on_notification,
-- push_on_dietitian_review, push_on_appointment, refresh_challenge_progress, redeem_referral, ...)
-- from its own definition, so owner, SECURITY DEFINER, search_path and grants are kept as they are.

do $$
declare
  f record;
  v_def text;
begin
  for f in
    select p.oid, p.proname
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prokind = 'f'
      and (p.prosrc like '%VitaTribe%' or p.prosrc like '%StreakFit%')
  loop
    v_def := pg_get_functiondef(f.oid);
    v_def := replace(replace(v_def, 'VitaTribe', 'DietitianFit'), 'StreakFit', 'DietitianFit');
    execute v_def;
    raise notice 'rebranded function %', f.proname;
  end loop;
end;
$$;

-- Verify: must return 0 rows.
-- select proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public' and (p.prosrc like '%VitaTribe%' or p.prosrc like '%StreakFit%');
