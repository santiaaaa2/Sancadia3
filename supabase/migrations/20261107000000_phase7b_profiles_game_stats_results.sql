-- Phase 7B: profiles, game stats, results, server-side scoring, leaderboards.
-- Safe to run over the hand-made profiles table.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1. Profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists stats_imported boolean not null default false;
alter table public.profiles drop column if exists total_points; -- points never live on the profile
alter table public.profiles alter column display_name drop default;

alter table public.profiles drop constraint if exists profiles_display_name_format;
alter table public.profiles
  add constraint profiles_display_name_format check (display_name ~ '^[A-Za-z0-9_]{3,16}$');

create unique index if not exists profiles_display_name_lower_key
  on public.profiles (lower(display_name));

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- New auth user -> profile named like "Player4821". Never uses the email.
-- Never raises: a sign-up must not fail because of a name clash.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_try integer := 0;
begin
  loop
    v_try := v_try + 1;
    v_name := case
      when v_try <= 10 then 'Player' || (1000 + floor(random() * 9000))::int
      when v_try <= 20 then 'Player' || (100000 + floor(random() * 900000))::int
      else 'P' || substr(replace(new.id::text, '-', ''), 1, 12)
    end;
    begin
      insert into public.profiles (id, display_name)
      values (new.id, v_name)
      on conflict (id) do nothing;
      exit;
    exception when unique_violation then
      if v_try >= 25 then exit; end if;
    end;
  end loop;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

revoke all on function public.handle_new_user() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Allowlists (add a row when a new game ships)
-- ---------------------------------------------------------------------------
create table if not exists public.game_catalog (
  game_id text primary key,
  kind text not null check (kind in ('versus', 'puzzle')),
  active boolean not null default true
);

create table if not exists public.puzzle_limits (
  game_id text not null references public.game_catalog (game_id),
  difficulty text not null check (difficulty in ('beginner', 'professional', 'expert')),
  max_attempts integer not null check (max_attempts > 0),
  primary key (game_id, difficulty)
);

insert into public.game_catalog (game_id, kind) values
  ('noughts-and-crosses', 'versus'),
  ('connect-4', 'versus'),
  ('gomoku', 'versus'),
  ('reversi', 'versus'),
  ('checkers', 'versus'),
  ('battleships', 'versus'),
  ('mastermind', 'puzzle'),
  ('bullscows', 'puzzle'),
  ('hangman', 'puzzle')
on conflict (game_id) do nothing;

insert into public.puzzle_limits (game_id, difficulty, max_attempts) values
  ('mastermind', 'beginner', 10), ('mastermind', 'professional', 8), ('mastermind', 'expert', 10),
  ('bullscows', 'beginner', 12), ('bullscows', 'professional', 10), ('bullscows', 'expert', 10),
  -- CHECK: hangman values are provisional (wrong-guess limits). Confirm against HangmanGame.
  ('hangman', 'beginner', 8), ('hangman', 'professional', 6), ('hangman', 'expert', 5)
on conflict (game_id, difficulty) do nothing;

-- ---------------------------------------------------------------------------
-- 3. Stats, results, imported stats
-- ---------------------------------------------------------------------------
create table if not exists public.game_stats (
  user_id uuid not null references auth.users (id) on delete cascade,
  game_id text not null references public.game_catalog (game_id),
  difficulty text not null check (difficulty in ('beginner', 'professional', 'expert')),
  played integer not null default 0 check (played >= 0),
  wins integer not null default 0 check (wins >= 0),
  losses integer not null default 0 check (losses >= 0),
  draws integer not null default 0 check (draws >= 0),
  current_streak integer not null default 0 check (current_streak >= 0),
  best_streak integer not null default 0 check (best_streak >= 0),
  best_attempts integer check (best_attempts is null or best_attempts > 0),
  total_attempts_in_wins integer not null default 0 check (total_attempts_in_wins >= 0),
  points integer not null default 0 check (points >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, game_id, difficulty)
);

create table if not exists public.game_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_result_id uuid not null,
  game_id text not null references public.game_catalog (game_id),
  difficulty text not null check (difficulty in ('beginner', 'professional', 'expert')),
  outcome text not null check (outcome in ('win', 'loss', 'draw')),
  attempts integer check (attempts is null or attempts > 0),
  hints_used integer not null default 0 check (hints_used >= 0),
  points_awarded integer not null default 0 check (points_awarded >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, client_result_id)
);

create index if not exists game_results_user_created_idx on public.game_results (user_id, created_at desc);
create index if not exists game_results_created_idx on public.game_results (created_at desc);

-- Stats the player had locally before signing in. Kept apart from verified stats.
create table if not exists public.imported_stats (
  user_id uuid not null references auth.users (id) on delete cascade,
  game_id text not null references public.game_catalog (game_id),
  difficulty text not null check (difficulty in ('beginner', 'professional', 'expert')),
  played integer not null default 0,
  wins integer not null default 0,
  losses integer not null default 0,
  draws integer not null default 0,
  best_streak integer not null default 0,
  best_attempts integer,
  total_attempts_in_wins integer not null default 0,
  points integer not null default 0,
  imported_at timestamptz not null default now(),
  primary key (user_id, game_id, difficulty)
);

-- ---------------------------------------------------------------------------
-- 4. Row Level Security and privileges
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.game_stats enable row level security;
alter table public.game_results enable row level security;
alter table public.imported_stats enable row level security;
alter table public.game_catalog enable row level security;
alter table public.puzzle_limits enable row level security;

revoke all on public.profiles, public.game_stats, public.game_results, public.imported_stats,
  public.game_catalog, public.puzzle_limits from anon, authenticated;

grant select on public.profiles, public.game_stats, public.game_results, public.imported_stats
  to authenticated;
grant update (display_name) on public.profiles to authenticated;

drop policy if exists "Profiles are viewable by everyone" on public.profiles;
drop policy if exists "Profiles viewable by everyone" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users can update their own display name" on public.profiles;
drop policy if exists "Users can delete their own profile" on public.profiles;
drop policy if exists "Own profile readable" on public.profiles;
drop policy if exists "Own profile display name editable" on public.profiles;
drop policy if exists "Own stats readable" on public.game_stats;
drop policy if exists "Own results readable" on public.game_results;
drop policy if exists "Own imported stats readable" on public.imported_stats;

create policy "Own profile readable" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "Own profile display name editable" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "Own stats readable" on public.game_stats
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Own results readable" on public.game_results
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Own imported stats readable" on public.imported_stats
  for select to authenticated using ((select auth.uid()) = user_id);
-- No insert/update/delete policies on stats, results or imports: only the functions below write.

-- ---------------------------------------------------------------------------
-- 5. Points formula. MUST match src/lib/points.ts (calculatePoints / calculatePuzzlePoints).
-- ---------------------------------------------------------------------------
create or replace function public.compute_points(
  p_kind text, p_difficulty text, p_outcome text,
  p_streak integer, p_attempts integer, p_max_attempts integer, p_hints integer
) returns integer
language plpgsql
immutable
set search_path = public
as $$
declare
  v_base integer := case p_difficulty when 'beginner' then 10 when 'professional' then 20 else 40 end;
  v_eff integer := 0;
begin
  if p_kind = 'puzzle' then
    if p_outcome <> 'win' then return 1; end if;
    if p_max_attempts > 1 then
      v_eff := round(10::numeric * (p_max_attempts - p_attempts) / (p_max_attempts - 1))::integer;
    end if;
    return greatest(1, v_base + v_eff + least(p_streak * 5, 25) - p_hints * 5);
  end if;
  if p_outcome = 'draw' then return 5; end if;
  if p_outcome = 'loss' then return 1; end if;
  return v_base + least(p_streak * 5, 25);
end;
$$;

revoke all on function public.compute_points(text, text, text, integer, integer, integer, integer)
  from public, anon, authenticated;

create or replace function public._result_totals(p_user uuid, p_game text, p_difficulty text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'game_id', gs.game_id,
    'difficulty', gs.difficulty,
    'played', gs.played,
    'wins', gs.wins,
    'losses', gs.losses,
    'draws', gs.draws,
    'current_streak', gs.current_streak,
    'best_streak', gs.best_streak,
    'best_attempts', gs.best_attempts,
    'total_attempts_in_wins', gs.total_attempts_in_wins,
    'points', gs.points,
    'total_points', (select coalesce(sum(points), 0) from public.game_stats where user_id = p_user)
  )
  from public.game_stats gs
  where gs.user_id = p_user and gs.game_id = p_game and gs.difficulty = p_difficulty;
$$;

revoke all on function public._result_totals(uuid, text, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. submit_result: the only way verified results enter the database
-- ---------------------------------------------------------------------------
create or replace function public.submit_result(
  p_client_result_id uuid,
  p_game_id text,
  p_difficulty text,
  p_outcome text,
  p_attempts integer default null,
  p_hints_used integer default 0
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_kind text;
  v_outcome text;
  v_max integer;
  v_attempts integer;
  v_hints integer := coalesce(p_hints_used, 0);
  v_stats public.game_stats;
  v_existing public.game_results;
  v_streak integer;
  v_points integer;
  v_recent integer;
begin
  if v_user is null then raise exception 'auth_required'; end if;
  if p_client_result_id is null then raise exception 'invalid_client_result_id'; end if;

  select kind into v_kind from public.game_catalog where game_id = p_game_id and active;
  if v_kind is null then raise exception 'invalid_game'; end if;

  if p_difficulty is null or p_difficulty not in ('beginner', 'professional', 'expert') then
    raise exception 'invalid_difficulty';
  end if;

  v_outcome := case when p_outcome = 'lose' then 'loss' else p_outcome end;
  if v_outcome is null or v_outcome not in ('win', 'loss', 'draw') then
    raise exception 'invalid_outcome';
  end if;

  if v_hints < 0 or v_hints > 10 then raise exception 'invalid_hints'; end if;

  if v_kind = 'puzzle' then
    if v_outcome = 'draw' then raise exception 'invalid_outcome'; end if;
    select max_attempts into v_max from public.puzzle_limits
      where game_id = p_game_id and difficulty = p_difficulty;
    if v_max is null then raise exception 'invalid_game'; end if;
    v_attempts := p_attempts;
    if v_attempts is null or v_attempts < 1 or v_attempts > v_max then
      raise exception 'invalid_attempts';
    end if;
  else
    v_attempts := null;
    v_hints := 0;
  end if;

  -- Lock this user's stats row so concurrent submissions are serialised.
  insert into public.game_stats (user_id, game_id, difficulty)
  values (v_user, p_game_id, p_difficulty)
  on conflict (user_id, game_id, difficulty) do nothing;

  select * into v_stats from public.game_stats
    where user_id = v_user and game_id = p_game_id and difficulty = p_difficulty
    for update;

  -- Idempotent retry: same client_result_id pays once.
  select * into v_existing from public.game_results
    where user_id = v_user and client_result_id = p_client_result_id;
  if found then
    return jsonb_build_object(
      'points_awarded', v_existing.points_awarded,
      'duplicate', true,
      'new_totals', public._result_totals(v_user, v_existing.game_id, v_existing.difficulty)
    );
  end if;

  select count(*) into v_recent from public.game_results
    where user_id = v_user and created_at > now() - interval '1 minute';
  if v_recent >= 30 then raise exception 'rate_limited'; end if;

  v_streak := case when v_outcome = 'win' then v_stats.current_streak + 1 else 0 end;
  v_points := public.compute_points(v_kind, p_difficulty, v_outcome, v_streak,
                                    v_attempts, v_max, v_hints);

  insert into public.game_results
    (user_id, client_result_id, game_id, difficulty, outcome, attempts, hints_used, points_awarded)
  values
    (v_user, p_client_result_id, p_game_id, p_difficulty, v_outcome, v_attempts, v_hints, v_points);

  update public.game_stats set
    played = played + 1,
    wins = wins + (v_outcome = 'win')::int,
    losses = losses + (v_outcome = 'loss')::int,
    draws = draws + (v_outcome = 'draw')::int,
    current_streak = v_streak,
    best_streak = greatest(best_streak, v_streak),
    best_attempts = case
      when v_outcome = 'win' and v_kind = 'puzzle'
        then least(coalesce(best_attempts, v_attempts), v_attempts)
      else best_attempts end,
    total_attempts_in_wins = total_attempts_in_wins
      + case when v_outcome = 'win' and v_kind = 'puzzle' then v_attempts else 0 end,
    points = points + v_points,
    updated_at = now()
  where user_id = v_user and game_id = p_game_id and difficulty = p_difficulty;

  return jsonb_build_object(
    'points_awarded', v_points,
    'duplicate', false,
    'new_totals', public._result_totals(v_user, p_game_id, p_difficulty)
  );
end;
$$;

revoke all on function public.submit_result(uuid, text, text, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.submit_result(uuid, text, text, text, integer, integer)
  to authenticated;

-- ---------------------------------------------------------------------------
-- 7. import_local_stats: once per user, capped, stored apart from verified stats
-- payload: {"games":[{"game_id","difficulty","played","wins","losses","draws",
--                     "best_streak","best_attempts","total_attempts_in_wins","points"}]}
-- ---------------------------------------------------------------------------
create or replace function public.import_local_stats(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_item jsonb;
  v_count integer := 0;
  v_played integer;
  v_wins integer;
begin
  if v_user is null then raise exception 'auth_required'; end if;
  if jsonb_typeof(p_payload -> 'games') is distinct from 'array' then
    raise exception 'invalid_payload';
  end if;
  if jsonb_array_length(p_payload -> 'games') > 100 then raise exception 'payload_too_large'; end if;

  update public.profiles set stats_imported = true
    where id = v_user and stats_imported = false;
  if not found then raise exception 'already_imported'; end if;

  for v_item in select * from jsonb_array_elements(p_payload -> 'games') loop
    if not exists (select 1 from public.game_catalog where game_id = v_item ->> 'game_id' and active)
       or (v_item ->> 'difficulty') not in ('beginner', 'professional', 'expert') then
      continue;
    end if;

    v_played := least(greatest(coalesce((v_item ->> 'played')::int, 0), 0), 2000);
    v_wins := least(greatest(coalesce((v_item ->> 'wins')::int, 0), 0), v_played);

    insert into public.imported_stats
      (user_id, game_id, difficulty, played, wins, losses, draws, best_streak,
       best_attempts, total_attempts_in_wins, points)
    values (
      v_user, v_item ->> 'game_id', v_item ->> 'difficulty', v_played, v_wins,
      least(greatest(coalesce((v_item ->> 'losses')::int, 0), 0), v_played),
      least(greatest(coalesce((v_item ->> 'draws')::int, 0), 0), v_played),
      least(greatest(coalesce((v_item ->> 'best_streak')::int, 0), 0), v_played),
      case when (v_item ->> 'best_attempts') is null then null
           else least(greatest((v_item ->> 'best_attempts')::int, 1), 100) end,
      least(greatest(coalesce((v_item ->> 'total_attempts_in_wins')::int, 0), 0), v_wins * 100),
      least(greatest(coalesce((v_item ->> 'points')::int, 0), 0), v_played * 75)
    )
    on conflict (user_id, game_id, difficulty) do nothing;
    v_count := v_count + 1;
  end loop;

  return jsonb_build_object('imported', v_count);
end;
$$;

revoke all on function public.import_local_stats(jsonb) from public, anon, authenticated;
grant execute on function public.import_local_stats(jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- 8. Leaderboards. Internal views carry user_id and are NOT exposed.
--    Public views expose only game_id, display_name, points, wins, rank.
--    (Supabase may flag these as "security definer views": that is intentional.)
-- ---------------------------------------------------------------------------
drop view if exists public.leaderboard_top_10;
drop view if exists public.leaderboard;
drop view if exists public.leaderboard_all_time;
drop view if exists public.leaderboard_weekly;
drop view if exists public.lb_all_time_internal;
drop view if exists public.lb_weekly_internal;

create view public.lb_all_time_internal as
with per_game as (
  select user_id, game_id, sum(points)::bigint as points, sum(wins)::bigint as wins
  from public.game_stats where played > 0 group by user_id, game_id
), overall as (
  select user_id, 'overall'::text as game_id, sum(points)::bigint as points, sum(wins)::bigint as wins
  from public.game_stats where played > 0 group by user_id
), combined as (
  select * from per_game union all select * from overall
)
select c.user_id, c.game_id, p.display_name, c.points, c.wins,
       rank() over (partition by c.game_id order by c.points desc, c.wins desc) as rank
from combined c join public.profiles p on p.id = c.user_id;

create view public.lb_weekly_internal as
with per_game as (
  select user_id, game_id, sum(points_awarded)::bigint as points,
         (count(*) filter (where outcome = 'win'))::bigint as wins
  from public.game_results
  where created_at >= date_trunc('week', now())
  group by user_id, game_id
), overall as (
  select user_id, 'overall'::text as game_id, sum(points_awarded)::bigint as points,
         (count(*) filter (where outcome = 'win'))::bigint as wins
  from public.game_results
  where created_at >= date_trunc('week', now())
  group by user_id
), combined as (
  select * from per_game union all select * from overall
)
select c.user_id, c.game_id, p.display_name, c.points, c.wins,
       rank() over (partition by c.game_id order by c.points desc, c.wins desc) as rank
from combined c join public.profiles p on p.id = c.user_id;

create view public.leaderboard_all_time as
  select game_id, display_name, points, wins, rank from public.lb_all_time_internal;
create view public.leaderboard_weekly as
  select game_id, display_name, points, wins, rank from public.lb_weekly_internal;

revoke all on public.lb_all_time_internal, public.lb_weekly_internal from public, anon, authenticated;
revoke all on public.leaderboard_all_time, public.leaderboard_weekly from public, anon, authenticated;
grant select on public.leaderboard_all_time, public.leaderboard_weekly to anon, authenticated;

-- The caller's own rank (used by the leaderboard screen in 7E).
create or replace function public.my_leaderboard_rank(p_period text, p_game_id text default 'overall')
returns table (rank bigint, points bigint, wins bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'auth_required'; end if;
  if p_period = 'weekly' then
    return query select i.rank, i.points, i.wins from public.lb_weekly_internal i
      where i.user_id = auth.uid() and i.game_id = p_game_id;
  elsif p_period = 'all_time' then
    return query select i.rank, i.points, i.wins from public.lb_all_time_internal i
      where i.user_id = auth.uid() and i.game_id = p_game_id;
  else
    raise exception 'invalid_period';
  end if;
end;
$$;

revoke all on function public.my_leaderboard_rank(text, text) from public, anon, authenticated;
grant execute on function public.my_leaderboard_rank(text, text) to authenticated;