import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { StatsContext, type StatsContextValue } from '@/hooks/statsContext';
import { emptyStats, parseStats, recordGameResult, STATS_STORAGE_KEY } from '@/lib/stats';
import { supabase } from '@/lib/supabase';

function loadStats() {
  try {
    const raw = window.localStorage.getItem(STATS_STORAGE_KEY);
    return raw === null ? emptyStats() : parseStats(JSON.parse(raw));
  } catch {
    return emptyStats();
  }
}

function saveStats(stats: ReturnType<typeof emptyStats>) {
  try {
    window.localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // Keep stats in memory when browser storage is unavailable.
  }
}

export default function StatsProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState(loadStats);
  const statsRef = useRef(stats);

  const recordResult = useCallback((result: Parameters<typeof recordGameResult>[1]) => {
    const recorded = recordGameResult(statsRef.current, result);
    if (recorded.stats === statsRef.current) return 0;
    statsRef.current = recorded.stats;
    saveStats(recorded.stats);
    setStats(recorded.stats);

    if (supabase) {
      void Promise.resolve(
        supabase.rpc('submit_result', {
          p_client_result_id: crypto.randomUUID(),
          p_game_id: result.gameId,
          p_difficulty: result.difficulty ?? 'beginner',
          p_outcome: result.outcome === 'lose' ? 'loss' : result.outcome,
          p_match_mode: result.mode,
          p_attempts: result.attempts ?? null,
          p_hints_used: result.hintsUsed ?? 0,
        }),
      )
        .then(({ error }) => {
          if (error) console.error('Unable to sync game result with Supabase:', error);
        })
        .catch((error: unknown) => {
          console.error('Unable to sync game result with Supabase:', error);
        });
    }

    return recorded.pointsEarned;
  }, []);

  const resetStats = useCallback(() => {
    const empty = emptyStats();
    statsRef.current = empty;
    saveStats(empty);
    setStats(empty);
  }, []);

  const value = useMemo<StatsContextValue>(
    () => ({ stats, recordResult, resetStats }),
    [stats, recordResult, resetStats],
  );

  return <StatsContext.Provider value={value}>{children}</StatsContext.Provider>;
}
