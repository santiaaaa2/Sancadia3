-- Safe validation for two users exercising the server-authoritative path.
-- This script is designed to be run in a local Supabase test database or a temporary isolated DB.

begin;

create temporary table if not exists _phase7b_test_users (
  id uuid primary key,
  email text not null,
  display_name text not null
);

truncate table _phase7b_test_users;

insert into _phase7b_test_users (id, email, display_name)
values
  ('11111111-1111-4111-8111-111111111111', 'alice@example.com', 'Alice'),
  ('22222222-2222-4222-8222-222222222222', 'bob@example.com', 'Bob');

-- Create the users as server-side auth rows so the trigger creates profile + stats rows.
insert into auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('11111111-1111-4111-8111-111111111111', 'alice@example.com', 'test', now(), now(), now()),
  ('22222222-2222-4222-8222-222222222222', 'bob@example.com', 'test', now(), now(), now())
on conflict (id) do nothing;

-- Set auth context as Alice, submit a result, then Bob.
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
select public.submit_result('demo-game', 'win', 120, '{"round":1}'::jsonb);

set local request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';
select public.submit_result('demo-game', 'puzzle', 90, '{"round":1}'::jsonb);

-- The leaderboard must expose names and totals, but no ids or emails.
if (select count(*) from public.leaderboard where display_name = 'Alice' and total_points = 120) <> 1 then
  raise exception 'Alice leaderboard score did not update correctly.';
end if;

if (select count(*) from public.leaderboard where display_name = 'Bob' and total_points = 90) <> 1 then
  raise exception 'Bob leaderboard score did not update correctly.';
end if;

if exists (select 1 from public.leaderboard where display_name is null or total_points is null) then
  raise exception 'Leaderboard rows are incomplete.';
end if;

if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'leaderboard' and column_name in ('id','user_id','email')) then
  raise exception 'Leaderboard leaked sensitive identifiers.';
end if;

if exists (
  select 1
  from public.game_results gr
  where gr.user_id not in (
    select id from auth.users
  )
) then
  raise exception 'Game results point to unknown users.';
end if;

rollback;
