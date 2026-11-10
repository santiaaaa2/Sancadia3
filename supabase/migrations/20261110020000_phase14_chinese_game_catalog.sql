-- Phase 14 game IDs are allowlisted but remain inactive until their games ship.
insert into public.game_catalog (game_id, kind, active) values
  ('xiangqi', 'versus', false),
  ('go', 'versus', false),
  ('chinesecheckers', 'versus', false),
  ('luzhanqi', 'versus', false),
  ('mahjong', 'versus', false)
on conflict (game_id) do nothing;
