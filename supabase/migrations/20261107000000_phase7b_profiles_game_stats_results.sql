create extension if not exists "pgcrypto";

-- Existing hand-written profiles table is reused if present; we only add missing pieces and remove
-- the client-facing points field that belongs in the server-authoritative stats table.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists created_at timestamptz default now();
alter table public.profiles add column if not exists updated_at timestamptz default now();

-- Backfill legacy points out of the profile row into game_stats before removing the column.
create table if not exists public.game_stats (
  user_id uuid primary key references auth.users (id) on delete cascade,
  total_points integer not null default 0 check (total_points >= 0),
  last_game_id text,
  updated_at timestamptz not null default now()
);

-- Handle legacy table state safely.
alter table public.profiles add column if not exists total_points integer default 0;
update public.game_stats gs
set total_points = gs.total_points + p.total_points,
    updated_at = now()
from public.profiles p
where gs.user_id = p.id
  and p.total_points is not null;

insert into public.game_stats (user_id, total_points, last_game_id, updated_at)
select p.id, coalesce(p.total_points, 0), null, now()
from public.profiles p
where p.id not in (select user_id from public.game_stats)
  and p.total_points is not null
on conflict (user_id) do nothing;

alter table public.profiles drop column if exists total_points;

create table if not exists public.game_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  game_id text not null,
  result_type text not null check (result_type in ('win', 'loss', 'draw', 'puzzle', 'remote')),
  points integer not null default 0 check (points >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists profiles_display_name_idx
  on public.profiles (lower(display_name));

create index if not exists game_stats_total_points_idx
  on public.game_stats (total_points desc, updated_at desc);

create index if not exists game_results_user_id_idx
  on public.game_results (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.game_stats enable row level security;
alter table public.game_results enable row level security;

create or replace function public.validate_profile_display_name()
returns trigger
language plpgsql
as $$
begin
  if new.display_name is null or btrim(new.display_name) = '' then
    raise exception 'Display name is required.';
  end if;

  if length(btrim(new.display_name)) < 3 or length(btrim(new.display_name)) > 24 then
    raise exception 'Display name must be 3-24 characters long.';
  end if;

  if regexp_match(btrim(new.display_name), '^[A-Za-z0-9][A-Za-z0-9 _-]*$') is null then
    raise exception 'Display name contains invalid characters.';
  end if;

  if exists (
    select 1
    from public.profiles p
    where p.id <> coalesce(new.id, p.id)
      and lower(btrim(p.display_name)) = lower(btrim(new.display_name))
  ) then
    raise exception 'Display name must be unique.';
  end if;

  new.display_name := btrim(new.display_name);
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_display_name_validation on public.profiles;
create trigger profiles_display_name_validation
before insert or update on public.profiles
for each row execute procedure public.validate_profile_display_name();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  v_name := split_part(coalesce(new.email, 'player'), '@', 1);
  if v_name is null or btrim(v_name) = '' then
    v_name := 'Player';
  end if;

  insert into public.profiles (id, display_name)
  values (new.id, v_name)
  on conflict (id) do nothing;

  insert into public.game_stats (user_id, total_points, updated_at)
  values (new.id, 0, now())
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.submit_result(
  p_game_id text,
  p_result_type text,
  p_points integer,
  p_metadata jsonb default '{}'::jsonb
)
returns public.game_results
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_row public.game_results;
begin
  if v_user_id is null then
    raise exception 'Authentication required to submit a result.';
  end if;

  if p_game_id is null or btrim(p_game_id) = '' then
    raise exception 'Game id is required.';
  end if;

  if p_result_type not in ('win', 'loss', 'draw', 'puzzle', 'remote') then
    raise exception 'Result type must be a valid enum value.';
  end if;

  if p_points is null or p_points < 0 then
    raise exception 'Points must be zero or greater.';
  end if;

  insert into public.game_results (user_id, game_id, result_type, points, metadata)
  values (v_user_id, p_game_id, p_result_type, p_points, coalesce(p_metadata, '{}'::jsonb))
  returning * into v_row;

  insert into public.game_stats (user_id, total_points, last_game_id, updated_at)
  values (v_user_id, p_points, p_game_id, now())
  on conflict (user_id)
  do update set
    total_points = public.game_stats.total_points + excluded.total_points,
    last_game_id = excluded.last_game_id,
    updated_at = now();

  return v_row;
end;
$$;

drop view if exists public.leaderboard_top_10;
drop view if exists public.leaderboard;

create or replace view public.leaderboard as
select
  p.display_name,
  gs.total_points,
  gs.updated_at as last_updated
from public.game_stats gs
join public.profiles p on p.id = gs.user_id
order by gs.total_points desc, gs.updated_at desc;

create or replace view public.leaderboard_top_10 as
select display_name, total_points, last_updated
from public.leaderboard
limit 10;

-- Read-only policy for the public leaderboard. No user ids, emails or mutable object ids are exposed.
drop policy if exists "Profiles viewable by everyone" on public.profiles;
drop policy if exists "Game stats viewable by everyone" on public.game_stats;
drop policy if exists "Game results visible to everyone" on public.game_results;

create policy "Profiles viewable by everyone"
on public.profiles
for select
using (true);

create policy "Game stats viewable by everyone"
on public.game_stats
for select
using (true);

create policy "Game results visible to everyone"
on public.game_results
for select
using (true);

-- The browser must never be able to insert or mutate rows directly. All score writes go through the
-- SECURITY DEFINER submit_result function above.
drop policy if exists "No client writes to profiles" on public.profiles;
drop policy if exists "No client updates to profiles" on public.profiles;
drop policy if exists "No client deletes from profiles" on public.profiles;
drop policy if exists "No client writes to game_stats" on public.game_stats;
drop policy if exists "No client updates to game_stats" on public.game_stats;
drop policy if exists "No client deletes from game_stats" on public.game_stats;
drop policy if exists "No client writes to game_results" on public.game_results;
drop policy if exists "No client updates to game_results" on public.game_results;
drop policy if exists "No client deletes from game_results" on public.game_results;

create policy "No client writes to profiles"
on public.profiles
for insert with check (false);
create policy "No client updates to profiles"
on public.profiles
for update using (false) with check (false);
create policy "No client deletes from profiles"
on public.profiles
for delete using (false);

create policy "No client writes to game_stats"
on public.game_stats
for insert with check (false);
create policy "No client updates to game_stats"
on public.game_stats
for update using (false) with check (false);
create policy "No client deletes from game_stats"
on public.game_stats
for delete using (false);

create policy "No client writes to game_results"
on public.game_results
for insert with check (false);
create policy "No client updates to game_results"
on public.game_results
for update using (false) with check (false);
create policy "No client deletes from game_results"
on public.game_results
for delete using (false);

create unique index if not exists profiles_display_name_unique_idx
  on public.profiles (lower(display_name));
