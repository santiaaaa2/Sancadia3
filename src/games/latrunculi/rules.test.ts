import { describe, expect, it } from 'vitest';
import { runEngineContract } from '@/engine/testing';
import { getCapturedPieces } from '@/games/latrunculi/capture';
import {
  DEFAULT_VICTORY_RULES,
  MAX_MOVES,
  SIZE,
  createLatrunculiState,
  latrunculi,
  legalMovesFor,
  resignGame,
  type LatrunculiState,
  type Piece,
} from '@/games/latrunculi/rules';

function emptyBoard(): Piece[][] {
  return Array.from({ length: SIZE }, () => Array<Piece>(SIZE).fill(null));
}

function stateWith(
  board: Piece[][],
  turn: 0 | 1 = 0,
  overrides: Partial<LatrunculiState> = {},
): LatrunculiState {
  const survivingPieces: [number, number] = [0, 0];
  for (const row of board) {
    for (const piece of row) {
      if (piece !== null) survivingPieces[piece]++;
    }
  }
  return { ...createLatrunculiState(), board, turn, survivingPieces, ...overrides };
}

function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

describe('Latrunculi rules', () => {
  it('starts with two ranks per army and allows unobstructed orthogonal movement', () => {
    const state = latrunculi.initialState();
    expect(state.board.flat().filter((piece) => piece === 0)).toHaveLength(16);
    expect(state.board.flat().filter((piece) => piece === 1)).toHaveLength(16);
    expect(legalMovesFor(state)).toContainEqual({ from: [1, 0], to: [2, 0] });
    expect(legalMovesFor(state)).toContainEqual({ from: [1, 0], to: [3, 0] });
    expect(legalMovesFor(state)).not.toContainEqual({ from: [1, 0], to: [0, 0] });
    expect(state.victoryRules).toEqual(DEFAULT_VICTORY_RULES);
    expect(state.gameMode).toBe('two-player');
  });

  it('records a move, switches turns, and tracks capture counts and captured squares', () => {
    const board = emptyBoard();
    const row = board[3];
    if (row) {
      row[1] = 0;
      row[3] = 1;
      row[4] = 0;
    }
    const state = stateWith(board);
    expect(getCapturedPieces(state.board, { from: [3, 1], to: [3, 2] }, 0)).toEqual([[3, 3]]);

    const next = latrunculi.applyMove(state, { from: [3, 1], to: [3, 2] });
    expect(next.board[3]).toEqual([null, null, 0, null, 0, null, null, null]);
    expect(next.turn).toBe(1);
    expect(next.totalMoves).toBe(1);
    expect(next.moveHistory).toEqual([{ player: 0, from: [3, 1], to: [3, 2], captured: [[3, 3]] }]);
    expect(next.capturedPieces).toEqual([1, 0]);
    expect(next.survivingPieces).toEqual([2, 0]);
    expect(next.status).toBe('completed');
    expect(next.winner).toBe(0);
  });

  it('does not capture against the board edge or without a complete sandwich', () => {
    const board = emptyBoard();
    const row = board[0];
    const sourceRow = board[1];
    if (row) row[1] = 1;
    if (sourceRow) sourceRow[0] = 0;
    expect(getCapturedPieces(board, { from: [1, 0], to: [0, 0] }, 0)).toEqual([]);
  });

  it('rejects blocked, diagonal, occupied, and out-of-bounds moves without changing state', () => {
    const state = latrunculi.initialState();
    const snapshot = JSON.stringify(state);
    for (const move of [
      { from: [1, 0], to: [1, 1] },
      { from: [1, 0], to: [2, 1] },
      { from: [1, 0], to: [8, 0] },
      { from: [6, 0], to: [5, 0] },
    ] as const) {
      expect(() => latrunculi.applyMove(state, move)).toThrow();
      expect(JSON.stringify(state)).toBe(snapshot);
    }
  });

  it('wins when the opponent loses their last piece', () => {
    const board = emptyBoard();
    const row = board[3];
    if (row) {
      row[1] = 0;
      row[3] = 1;
      row[4] = 0;
    }
    const next = latrunculi.applyMove(stateWith(board), { from: [3, 1], to: [3, 2] });
    expect(next.status).toBe('completed');
    expect(next.winner).toBe(0);
    expect(latrunculi.isTerminal(next)).toBe(true);
    expect(legalMovesFor(next)).toEqual([]);
  });

  it('wins when the opponent has no legal moves', () => {
    const board = emptyBoard();
    const captiveRow = board[3];
    if (captiveRow) {
      captiveRow[2] = 0;
      captiveRow[3] = 1;
      captiveRow[4] = 0;
    }
    const above = board[2];
    const below = board[4];
    if (above) above[3] = 0;
    if (below) below[3] = 0;
    const corner = board[0];
    if (corner) corner[0] = 0;

    const next = latrunculi.applyMove(stateWith(board), { from: [0, 0], to: [0, 1] });
    expect(legalMovesFor({ ...next, status: 'active', winner: null })).toEqual([]);
    expect(next.status).toBe('completed');
    expect(next.winner).toBe(0);
  });

  it('awards a resignation to the opponent and forbids moves after completion', () => {
    const state = createLatrunculiState('computer');
    const resigned = resignGame(state, 0);
    expect(resigned.status).toBe('completed');
    expect(resigned.winner).toBe(1);
    expect(resigned.gameMode).toBe('computer');
    expect(latrunculi.isTerminal(resigned)).toBe(true);
    expect(legalMovesFor(resigned)).toEqual([]);
    expect(() => latrunculi.applyMove(resigned, { from: [1, 0], to: [2, 0] })).toThrow();
    expect(() => resignGame(resigned)).toThrow();
    expect(() => resignGame(state, 1)).toThrow();
  });

  it('does not apply majority-capture victory unless the selected variant enables it', () => {
    const board = latrunculi.initialState().board.map((row) => [...row]);
    const defaultRulesState = {
      ...createLatrunculiState(),
      board,
      survivingPieces: [16, 16] as const,
      capturedPieces: [9, 0] as const,
    };
    const move = { from: [1, 0], to: [2, 0] } as const;
    expect(latrunculi.applyMove(defaultRulesState, move).status).toBe('active');

    const majorityRulesState = {
      ...defaultRulesState,
      victoryRules: { ...DEFAULT_VICTORY_RULES, majorityCapture: true },
    };
    const majorityResult = latrunculi.applyMove(majorityRulesState, move);
    expect(majorityResult.status).toBe('completed');
    expect(majorityResult.winner).toBe(0);
  });

  it('draws at the move limit without awarding capture-majority victory by default', () => {
    const state = { ...latrunculi.initialState(), totalMoves: MAX_MOVES - 1 };
    expect(legalMovesFor(state).length).toBeGreaterThan(0);
    const next = latrunculi.applyMove(state, { from: [1, 0], to: [2, 0] });
    expect(next.totalMoves).toBe(MAX_MOVES);
    expect(next.status).toBe('completed');
    expect(next.winner).toBe('draw');
  });

  it('does not mutate the source board or state', () => {
    const state = deepFreeze(latrunculi.initialState());
    const next = latrunculi.applyMove(state, { from: [1, 0], to: [2, 0] });
    expect(state.board[1]?.[0]).toBe(0);
    expect(state.board[2]?.[0]).toBeNull();
    expect(state.turn).toBe(0);
    expect(state.totalMoves).toBe(0);
    expect(next.board[1]?.[0]).toBeNull();
    expect(next.board[2]?.[0]).toBe(0);
  });

  it('satisfies the shared engine contract', () => {
    runEngineContract(latrunculi);
  }, 20_000);
});
