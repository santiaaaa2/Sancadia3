import { describe, expect, it } from 'vitest';
import { chooseMove, evaluate } from '@/games/latrunculi/ai';
import {
  createLatrunculiState,
  latrunculi,
  type LatrunculiState,
  type Piece,
} from '@/games/latrunculi/rules';

function stateWithPieces(pieces: Array<[number, number, Exclude<Piece, null>]>): LatrunculiState {
  const state = createLatrunculiState('computer');
  const board: Piece[][] = Array.from({ length: 8 }, () => Array<Piece>(8).fill(null));
  const counts: [number, number] = [0, 0];
  for (const [row, col, player] of pieces) {
    board[row]![col] = player;
    counts[player]++;
  }
  return { ...state, board, survivingPieces: counts };
}

describe('Latrunculi AI', () => {
  it.each(['beginner', 'professional', 'expert'] as const)(
    'returns a legal move at %s difficulty on the opening board',
    (difficulty) => {
      const state = latrunculi.initialState();
      const move = chooseMove(state, difficulty);
      expect(move).not.toBeNull();
      expect(latrunculi.legalMoves(state)).toContainEqual(move);
    },
  );

  it.each(['beginner', 'professional', 'expert'] as const)(
    '%s prioritizes a winning custodial capture',
    (difficulty) => {
      const state = stateWithPieces([
        [3, 1, 0],
        [3, 3, 1],
        [3, 4, 0],
      ]);
      const before = JSON.stringify(state);

      expect(chooseMove(state, difficulty)).toEqual({ from: [3, 1], to: [3, 2] });
      expect(JSON.stringify(state)).toBe(before);
    },
  );

  it.each(['beginner', 'professional', 'expert'] as const)(
    'chooses only a legal move in a sparse endgame at %s difficulty',
    (difficulty) => {
      const state = stateWithPieces([
        [2, 1, 0],
        [5, 6, 0],
        [2, 6, 1],
        [5, 1, 1],
      ]);
      const move = chooseMove(state, difficulty);

      expect(move).not.toBeNull();
      expect(latrunculi.legalMoves(state)).toContainEqual(move);
    },
  );

  it('values defense against an immediate sandwich capture', () => {
    const threatened = stateWithPieces([
      [3, 3, 0],
      [3, 4, 0],
      [3, 1, 1],
    ]);
    const safe = stateWithPieces([
      [3, 3, 0],
      [3, 4, 0],
      [0, 0, 1],
    ]);

    expect(evaluate(safe, 0)).toBeGreaterThan(evaluate(threatened, 0));
  });
});
