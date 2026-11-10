create table if not exists public.admin_content (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (
    content_type in ('campaign', 'daily_challenge', 'cosmetic_collection', 'premium_product')
  ),
  slug text not null check (
    length(slug) <= 100 and slug ~ '^([a-z0-9]+(-[a-z0-9]+)*)$'
  ),
  title text not null check (length(btrim(title)) between 1 and 120),
  description text not null default '' check (length(description) <= 2000),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (content_type, slug)
);

create index if not exists admin_content_published_type_idx
  on public.admin_content (content_type, updated_at desc)
  where status = 'published';

alter table public.admin_content enable row level security;
revoke all on public.admin_content from anon, authenticated;
grant select on public.admin_content to anon, authenticated;
grant all on public.admin_content to service_role;

drop policy if exists "Published content is readable" on public.admin_content;
create policy "Published content is readable" on public.admin_content
  for select to anon, authenticated using (status = 'published');

drop trigger if exists admin_content_set_updated_at on public.admin_content;
create trigger admin_content_set_updated_at
before update on public.admin_content
for each row execute function public.set_updated_at();

alter table public.game_results
  add column if not exists match_mode text not null default 'computer';

alter table public.game_results
  drop constraint if exists game_results_match_mode_check;
alter table public.game_results
  add constraint game_results_match_mode_check
  check (match_mode in ('computer', 'two-player', 'puzzle'));

update public.game_results r
set match_mode = 'puzzle'
from public.game_catalog c
where c.game_id = r.game_id
  and c.kind = 'puzzle'
  and r.match_mode = 'computer';

insert into public.game_catalog (game_id, kind) values
  ('dots-and-boxes', 'versus'),
  ('mancala', 'versus'),
  ('dominoes', 'versus'),
  ('ludo', 'versus')
on conflict (game_id) do nothing;

create or replace function public.submit_result(
  p_client_result_id uuid,
  p_game_id text,
  p_difficulty text,
  p_outcome text,
  p_match_mode text,
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
  v_existing public.game_results;
  v_result jsonb;
  v_recent integer;
  v_inserted uuid;
begin
  if v_user is null then raise exception 'auth_required'; end if;
  if p_client_result_id is null then raise exception 'invalid_client_result_id'; end if;

  select kind into v_kind
  from public.game_catalog
  where game_id = p_game_id and active;
  if v_kind is null then raise exception 'invalid_game'; end if;

  if p_difficulty is null or p_difficulty not in ('beginner', 'professional', 'expert') then
    raise exception 'invalid_difficulty';
  end if;
  if p_match_mode is null or p_match_mode not in ('computer', 'two-player', 'puzzle') then
    raise exception 'invalid_match_mode';
  end if;
  if (v_kind = 'puzzle' and p_match_mode not in ('puzzle', 'two-player'))
     or (v_kind = 'versus' and p_match_mode = 'puzzle') then
    raise exception 'invalid_match_mode';
  end if;

  v_outcome := case when p_outcome = 'lose' then 'loss' else p_outcome end;
  if v_outcome is null or v_outcome not in ('win', 'loss', 'draw') then
    raise exception 'invalid_outcome';
  end if;

  if p_match_mode = 'two-player' then
    if p_attempts is not null and p_attempts < 1 then
      raise exception 'invalid_attempts';
    end if;
    select * into v_existing
    from public.game_results
    where user_id = v_user and client_result_id = p_client_result_id;
    if found then
      return jsonb_build_object('points_awarded', v_existing.points_awarded, 'duplicate', true);
    end if;

    select count(*) into v_recent from public.game_results
    where user_id = v_user and created_at > now() - interval '1 minute';
    if v_recent >= 30 then raise exception 'rate_limited'; end if;

    insert into public.game_results (
      user_id, client_result_id, game_id, difficulty, outcome, attempts,
      hints_used, points_awarded, match_mode
    ) values (
      v_user, p_client_result_id, p_game_id, p_difficulty, v_outcome, p_attempts,
      0, 0, p_match_mode
    )
    on conflict (user_id, client_result_id) do nothing
    returning id into v_inserted;
    if v_inserted is null then
      select * into v_existing
      from public.game_results
      where user_id = v_user and client_result_id = p_client_result_id;
      return jsonb_build_object('points_awarded', v_existing.points_awarded, 'duplicate', true);
    end if;
    return jsonb_build_object('points_awarded', 0, 'duplicate', false);
  end if;

  v_result := public.submit_result(
    p_client_result_id, p_game_id, p_difficulty, v_outcome, p_attempts, p_hints_used
  );
  update public.game_results
  set match_mode = p_match_mode
  where user_id = v_user and client_result_id = p_client_result_id;
  return v_result;
end;
$$;

revoke all on function public.submit_result(uuid, text, text, text, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.submit_result(uuid, text, text, text, text, integer, integer)
  to authenticated;
revoke all on function public.submit_result(uuid, text, text, text, integer, integer)
  from public, anon, authenticated;

create or replace function public.latrunculi_admin_metrics(window_days integer default 30)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with recent_results as (
    select user_id, created_at, match_mode
    from public.game_results
    where created_at >= now() - make_interval(days => greatest(1, least(window_days, 365)))
  ),
  player_activity as (
    select user_id, count(distinct (created_at at time zone 'UTC')::date) as active_days
    from recent_results
    group by user_id
  )
  select jsonb_build_object(
    'registered_users', (select count(*) from public.profiles),
    'new_registrations', (
      select count(*) from public.profiles
      where created_at >= now() - make_interval(days => greatest(1, least(window_days, 365)))
    ),
    'active_users', (select count(*) from player_activity),
    'returning_players', (select count(*) from player_activity where active_days > 1),
    'games_played', (select count(*) from recent_results),
    'ai_matches', (select count(*) from recent_results where match_mode = 'computer'),
    'multiplayer_matches', (select count(*) from recent_results where match_mode = 'two-player'),
    'daily_challenges_completed', null,
    'campaign_completions', null,
    'window_days', greatest(1, least(window_days, 365))
  );
$$;

revoke all on function public.latrunculi_admin_metrics(integer) from public, anon, authenticated;
grant execute on function public.latrunculi_admin_metrics(integer) to service_role;
