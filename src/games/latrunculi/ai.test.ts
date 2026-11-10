import { describe, expect, it } from 'vitest';
import { chooseMove } from '@/games/latrunculi/ai';
import { latrunculi } from '@/games/latrunculi/rules';

describe('Latrunculi AI', () => {
  it.each(['beginner', 'professional', 'expert'] as const)(
    'returns a legal move at %s difficulty',
    (difficulty) => {
      const state = latrunculi.initialState();
      const move = chooseMove(state, difficulty);
      expect(move).not.toBeNull();
      expect(latrunculi.legalMoves(state)).toContainEqual(move);
    },
  );
});
