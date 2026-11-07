-- Two-user test for Phase 7B. Run in the Supabase SQL Editor AFTER the migration is pushed.
-- It always ends with an error on purpose: that rolls back all test data.
-- "ALL 7B TESTS PASSED" in the error message = success. Any message starting with FAIL = a problem.

do $$
declare
  a constant uuid := '00000000-0000-0000-0000-00000000000a';
  b constant uuid := '00000000-0000-0000-0000-00000000000b';
  r jsonb;
  cid uuid := gen_random_uuid();
  n integer;
  b_name text;
begin
  insert into auth.users (id, aud, role, email) values
    (a, 'authenticated', 'authenticated', 'a@test.invalid'),
    (b, 'authenticated', 'authenticated', 'b@test.invalid');
  select display_name into b_name from public.profiles where id = b;
  if b_name is null then raise exception 'FAIL: profile was not auto-created'; end if;

  -- ===== Act as user A =====
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';

  -- Points formula (mirrors src/lib/points.test.ts)
  r := public.submit_result(cid, 'noughts-and-crosses', 'beginner', 'win');
  if (r ->> 'points_awarded')::int <> 15 then raise exception 'FAIL: first win should pay 15, got %', r ->> 'points_awarded'; end if;

  -- Duplicate client_result_id pays once
  r := public.submit_result(cid, 'noughts-and-crosses', 'beginner', 'win');
  if not (r ->> 'duplicate')::boolean or (r ->> 'points_awarded')::int <> 15 then raise exception 'FAIL: duplicate not detected'; end if;
  if (r -> 'new_totals' ->> 'points')::int <> 15 then raise exception 'FAIL: duplicate paid twice'; end if;

  r := public.submit_result(gen_random_uuid(), 'noughts-and-crosses', 'beginner', 'win');
  if (r ->> 'points_awarded')::int <> 20 then raise exception 'FAIL: second win should pay 20'; end if;
  r := public.submit_result(gen_random_uuid(), 'noughts-and-crosses', 'beginner', 'lose');
  if (r ->> 'points_awarded')::int <> 1 then raise exception 'FAIL: loss should pay 1'; end if;
  r := public.submit_result(gen_random_uuid(), 'noughts-and-crosses', 'beginner', 'win');
  if (r ->> 'points_awarded')::int <> 15 then raise exception 'FAIL: streak should reset after a loss'; end if;
  if (r -> 'new_totals' ->> 'points')::int <> 51 then raise exception 'FAIL: expected 51 total, got %', r -> 'new_totals' ->> 'points'; end if;
  r := public.submit_result(gen_random_uuid(), 'connect-4', 'expert', 'draw');
  if (r ->> 'points_awarded')::int <> 5 then raise exception 'FAIL: draw should pay 5'; end if;

  -- Puzzle formula: base 10 + efficiency 10 + streak 5 - hint 5 = 20
  r := public.submit_result(gen_random_uuid(), 'mastermind', 'beginner', 'win', 1, 1);
  if (r ->> 'points_awarded')::int <> 20 then raise exception 'FAIL: puzzle win should pay 20, got %', r ->> 'points_awarded'; end if;
  -- Hints can never push a win below 1 point
  r := public.submit_result(gen_random_uuid(), 'mastermind', 'beginner', 'win', 10, 5);
  if (r ->> 'points_awarded')::int <> 1 then raise exception 'FAIL: puzzle win floor should be 1'; end if;
  r := public.submit_result(gen_random_uuid(), 'mastermind', 'expert', 'lose', 10, 0);
  if (r ->> 'points_awarded')::int <> 1 then raise exception 'FAIL: puzzle loss should pay 1'; end if;

  -- Invalid input is rejected
  begin perform public.submit_result(gen_random_uuid(), 'not-a-game', 'beginner', 'win');
    raise exception 'FAIL: unknown game accepted';
  exception when others then if sqlerrm like 'FAIL:%' then raise; end if; end;
  begin perform public.submit_result(gen_random_uuid(), 'mastermind', 'beginner', 'win', 11, 0);
    raise exception 'FAIL: too many attempts accepted';
  exception when others then if sqlerrm like 'FAIL:%' then raise; end if; end;
  begin perform public.submit_result(gen_random_uuid(), 'mastermind', 'beginner', 'draw', 3, 0);
    raise exception 'FAIL: puzzle draw accepted';
  exception when others then if sqlerrm like 'FAIL:%' then raise; end if; end;

  -- Direct writes are denied
  begin insert into public.game_stats (user_id, game_id, difficulty, points) values (a, 'hangman', 'beginner', 999999);
    raise exception 'FAIL: direct insert into game_stats allowed';
  exception when insufficient_privilege then null; end;
  begin update public.game_stats set points = 999999 where user_id = a;
    raise exception 'FAIL: direct update of game_stats allowed';
  exception when insufficient_privilege then null; end;
  begin insert into public.game_results (user_id, client_result_id, game_id, difficulty, outcome, points_awarded)
      values (a, gen_random_uuid(), 'hangman', 'beginner', 'win', 999999);
    raise exception 'FAIL: direct insert into game_results allowed';
  exception when insufficient_privilege then null; end;

  -- Display name rules
  begin update public.profiles set display_name = 'ab' where id = a;
    raise exception 'FAIL: short name accepted';
  exception when check_violation then null; end;
  begin update public.profiles set display_name = 'Bad Name!' where id = a;
    raise exception 'FAIL: invalid characters accepted';
  exception when check_violation then null; end;
  begin execute format('update public.profiles set display_name = %L where id = %L', b_name, a);
    raise exception 'FAIL: duplicate name accepted';
  exception when unique_violation then null; end;
  update public.profiles set display_name = 'Alice_01' where id = a;

  -- ===== Act as user B =====
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';

  select count(*) into n from public.game_stats where user_id = a;
  if n <> 0 then raise exception 'FAIL: B can read A game_stats'; end if;
  select count(*) into n from public.game_results where user_id = a;
  if n <> 0 then raise exception 'FAIL: B can read A game_results'; end if;
  select count(*) into n from public.profiles where id = a;
  if n <> 0 then raise exception 'FAIL: B can read A profile'; end if;
  update public.profiles set display_name = 'Hacked_1' where id = a;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: B can edit A profile'; end if;

  -- Import works once, and imported stats are not verified stats
  r := public.import_local_stats('{"games":[{"game_id":"gomoku","difficulty":"expert","played":5,"wins":3,"losses":2,"draws":0,"best_streak":2,"points":150}]}'::jsonb);
  if (r ->> 'imported')::int <> 1 then raise exception 'FAIL: import did not import'; end if;
  begin perform public.import_local_stats('{"games":[]}'::jsonb);
    raise exception 'FAIL: second import allowed';
  exception when others then if sqlerrm like 'FAIL:%' then raise; end if; end;
  select count(*) into n from public.game_stats;
  if n <> 0 then raise exception 'FAIL: import leaked into verified game_stats'; end if;

  -- ===== Anonymous (not signed in) =====
  execute 'reset role';
  execute 'set local role anon';
  begin perform public.submit_result(gen_random_uuid(), 'gomoku', 'beginner', 'win');
    raise exception 'FAIL: anon can call submit_result';
  exception when insufficient_privilege then null; end;
  select count(*) into n from public.leaderboard_all_time where display_name = 'Alice_01' and game_id = 'overall';
  if n <> 1 then raise exception 'FAIL: leaderboard should show Alice_01'; end if;

  -- Leaderboard views expose no ids or emails
  execute 'reset role';
  select count(*) into n from information_schema.columns
    where table_schema = 'public' and table_name in ('leaderboard_all_time', 'leaderboard_weekly')
      and column_name in ('user_id', 'id', 'email');
  if n <> 0 then raise exception 'FAIL: leaderboard exposes an id or email column'; end if;

  raise exception 'ALL 7B TESTS PASSED (this error is intentional: it rolls the test data back)';
end;
$$;