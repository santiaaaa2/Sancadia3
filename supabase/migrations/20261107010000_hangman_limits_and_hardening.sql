-- Hangman sends attempts = letters guessed (1..26) and maxAttempts = 26 at every difficulty.
update public.puzzle_limits set max_attempts = 26 where game_id = 'hangman';

-- Supabase's auto-RLS helper should not be callable by clients.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end;
$$;
