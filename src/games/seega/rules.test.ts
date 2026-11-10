import { describe, expect, it } from 'vitest';
import { runEngineContract } from '@/engine/testing';
import {
  BOARD_CELLS,
  CENTRE_SQUARE,
  DEFAULT_SEEGA_RULESET,
  createInitialSeegaState,
  getLegalMovesFor,
  seega,
  type SeegaState,
} from '@/games/seega/rules';

function movementState(
  pieces: ReadonlyArray<readonly [number, 0 | 1]>,
  overrides: Partial<SeegaState> = {},
): SeegaState {
  const board: (0 | 1 | null)[] = Array.from({ length: BOARD_CELLS }, () => null);
  for (const [square, player] of pieces) board[square] = player;
  return {
    ...createInitialSeegaState(),
    board,
    phase: 'movement',
    placementsMade: 24,
    history: [],
    ...overrides,
  };
}

function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

describe('Seega rules', () => {
  it('alternates after each pair of placements and keeps the centre empty', () => {
    const initial = seega.initialState();
    expect(seega.legalMoves(initial)).not.toContainEqual({ from: CENTRE_SQUARE, path: [] });

    const first = seega.applyMove(initial, { from: 0, path: [] });
    expect(first.turn).toBe(0);
    expect(first.placementsInTurn).toBe(1);
    expect(first.board[0]).toBe(0);
    expect(first.board[CENTRE_SQUARE]).toBeNull();

    const second = seega.applyMove(first, { from: 1, path: [] });
    expect(second.turn).toBe(1);
    expect(second.placementsInTurn).toBe(0);
    expect(second.board[1]).toBe(0);
  });

  it('starts movement with the player who placed the last stone', () => {
    let state = seega.initialState();
    while (state.phase === 'placement') {
      const move = seega.legalMoves(state)[0];
      if (!move) throw new Error('Expected an available placement.');
      state = seega.applyMove(state, move);
    }

    expect(state.lastPlacementPlayer).toBe(1);
    expect(state.turn).toBe(1);

    const configured = { ...DEFAULT_SEEGA_RULESET, firstMover: 0 as const };
    let firstPlayerState = createInitialSeegaState(configured);
    while (firstPlayerState.phase === 'placement') {
      const move = seega.legalMoves(firstPlayerState)[0];
      if (!move) throw new Error('Expected an available placement.');
      firstPlayerState = seega.applyMove(firstPlayerState, move);
    }
    expect(firstPlayerState.turn).toBe(0);
  });

  it('moves orthogonally and captures a single sandwiched stone', () => {
    const state = movementState([
      [11, 0],
      [13, 1],
      [14, 0],
    ]);
    const move = { from: 11, path: [12] };
    expect(seega.legalMoves(state)).toContainEqual(move);

    const next = seega.applyMove(state, move);
    expect(next.board[12]).toBe(0);
    expect(next.board[13]).toBeNull();
    expect(next.noCaptureMoves).toBe(0);
    expect(next.turn).toBe(1);
  });

  it('captures on two axes and permits a chained capture as one move', () => {
    const doubleCapture = movementState([
      [11, 0],
      [7, 1],
      [2, 0],
      [13, 1],
      [14, 0],
    ]);
    const doubleMove = { from: 11, path: [12] };
    expect(seega.applyMove(doubleCapture, doubleMove).board[7]).toBeNull();
    expect(seega.applyMove(doubleCapture, doubleMove).board[13]).toBeNull();

    const chain = movementState([
      [11, 0],
      [13, 1],
      [14, 0],
      [6, 1],
      [5, 0],
    ]);
    const chainMove = { from: 11, path: [12, 7] };
    expect(seega.legalMoves(chain)).toContainEqual(chainMove);
    const next = seega.applyMove(chain, chainMove);
    expect(next.board[13]).toBeNull();
    expect(next.board[6]).toBeNull();
    expect(next.board[7]).toBe(0);
    expect(next.movementMoves).toBe(1);
  });

  it('does not capture against a wall or diagonally', () => {
    const wall = movementState([
      [5, 0],
      [1, 1],
    ]);
    const wallMove = { from: 5, path: [0] };
    expect(seega.applyMove(wall, wallMove).board[1]).toBe(1);

    const diagonal = movementState([
      [11, 0],
      [6, 1],
      [1, 0],
    ]);
    const diagonalMove = { from: 11, path: [12] };
    expect(seega.applyMove(diagonal, diagonalMove).board[6]).toBe(1);
  });

  it('uses the blocked-stone removal rule to free a move', () => {
    const state = movementState([
      [12, 0],
      [7, 1],
      [17, 1],
      [11, 1],
      [13, 1],
    ]);
    expect(
      getLegalMovesFor(state, 0).every((move) => 'type' in move && move.type === 'blocked-remove'),
    ).toBe(true);
    expect(seega.currentPlayer(state)).toBe(1);
    expect(seega.legalMoves(state)).toContainEqual({ type: 'blocked-remove', at: 7 });

    const next = seega.applyMove(state, { type: 'blocked-remove', at: 7 });
    expect(next.board[7]).toBeNull();
    expect(next.turn).toBe(0);
    expect(seega.currentPlayer(next)).toBe(0);
    expect(seega.legalMoves(next).length).toBeGreaterThan(0);
  });

  it('draws after the no-capture limit and on threefold repetition', () => {
    const movable = movementState(
      [
        [0, 0],
        [24, 1],
      ],
      { noCaptureMoves: 49 },
    );
    const move = seega.legalMoves(movable)[0];
    if (!move) throw new Error('Expected an available movement.');
    const noCaptureDraw = seega.applyMove(movable, move);
    expect(noCaptureDraw.noCaptureMoves).toBe(50);
    expect(seega.winner(noCaptureDraw)).toBe('draw');

    const repeatedBase = movementState([
      [0, 0],
      [24, 1],
    ]);
    const position = `movement:${repeatedBase.turn}:${repeatedBase.board
      .map((player) => (player === null ? '.' : player))
      .join('')}`;
    const repeated = { ...repeatedBase, history: [position, position, position] };
    expect(seega.winner(repeated)).toBe('draw');
  });

  it('declares a draw when neither side can move and the blocked rule is disabled', () => {
    const board = Array.from({ length: BOARD_CELLS }, (_, square) => (square === 24 ? 1 : 0));
    const state = movementState([], {
      board,
      ruleset: { ...DEFAULT_SEEGA_RULESET, blockedRule: false },
    });
    expect(seega.legalMoves(state)).toEqual([]);
    expect(seega.winner(state)).toBe('draw');
  });

  it('does not mutate the source state when applying a move', () => {
    const state = deepFreeze(
      movementState([
        [11, 0],
        [13, 1],
        [14, 0],
      ]),
    );
    const next = seega.applyMove(state, { from: 11, path: [12] });
    expect(state.board[11]).toBe(0);
    expect(state.board[12]).toBeNull();
    expect(state.board[13]).toBe(1);
    expect(next.board[11]).toBeNull();
    expect(next.board[12]).toBe(0);
    expect(next.board[13]).toBeNull();
  });

  it('satisfies the shared engine contract', () => {
    runEngineContract(seega);
  }, 30_000);
});
