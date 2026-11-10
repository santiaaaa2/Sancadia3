import { describe, expect, it } from 'vitest';
import { runEngineContract } from '@/engine/testing';
import {
  indexOf,
  isInCheck,
  xiangqi,
  type XiangqiMove,
  type XiangqiPiece,
  type XiangqiState,
} from '@/games/xiangqi/rules';

function stateWithPieces(
  pieces: ReadonlyArray<readonly [number, number, XiangqiPiece['type'], (0 | 1)?]>,
  turn: 0 | 1 = 0,
  blockFacingGenerals = true,
): XiangqiState {
  const initial = xiangqi.initialState();
  const board: Array<XiangqiPiece | null> = Array.from({ length: 90 }, () => null);
  for (const [row, col, type, player] of pieces) {
    board[indexOf(row, col)] = { type, player: player ?? (row >= 5 ? 0 : 1) };
  }
  if (blockFacingGenerals && board[indexOf(5, 4)] === null) {
    board[indexOf(5, 4)] = { type: 'soldier', player: 0 };
  }
  return {
    ...initial,
    board,
    turn,
    history: [{ position: 'position', mover: null, gaveCheck: false }],
  };
}

function includesMove(state: XiangqiState, from: [number, number], to: [number, number]): boolean {
  return xiangqi
    .legalMoves(state)
    .some((move) => move.from === indexOf(...from) && move.to === indexOf(...to));
}

function makeMove(state: XiangqiState, from: [number, number], to: [number, number]) {
  return xiangqi.applyMove(state, { from: indexOf(...from), to: indexOf(...to) });
}

describe('Xiangqi rules', () => {
  it('builds the standard 9-by-10 opening position', () => {
    const state = xiangqi.initialState();
    expect(state.board).toHaveLength(90);
    expect(state.board.filter((piece) => piece?.player === 0)).toHaveLength(16);
    expect(state.board.filter((piece) => piece?.player === 1)).toHaveLength(16);
    expect(xiangqi.legalMoves(state).length).toBeGreaterThan(0);
  });

  it('enforces palace, advisor, elephant-eye, river, and horse-leg movement', () => {
    const generals: ReadonlyArray<readonly [number, number, XiangqiPiece['type']]> = [
      [0, 4, 'general'],
      [9, 4, 'general'],
    ];
    const palace = stateWithPieces([...generals, [9, 3, 'advisor']]);
    expect(includesMove(palace, [9, 3], [8, 4])).toBe(true);
    expect(includesMove(palace, [9, 3], [8, 2])).toBe(false);
    expect(includesMove(palace, [9, 4], [8, 4])).toBe(true);
    expect(includesMove(palace, [9, 4], [9, 2])).toBe(false);

    const elephant = stateWithPieces([...generals, [9, 2, 'elephant']]);
    expect(includesMove(elephant, [9, 2], [7, 0])).toBe(true);
    expect(includesMove(elephant, [9, 2], [5, 4])).toBe(false);
    const blockedElephant = stateWithPieces([...generals, [9, 2, 'elephant'], [8, 3, 'soldier']]);
    expect(includesMove(blockedElephant, [9, 2], [7, 4])).toBe(false);

    const horse = stateWithPieces([...generals, [9, 1, 'horse']]);
    expect(includesMove(horse, [9, 1], [7, 2])).toBe(true);
    expect(includesMove(horse, [9, 1], [8, 3])).toBe(true);
    const hobbledHorse = stateWithPieces([...generals, [9, 1, 'horse'], [8, 1, 'soldier']]);
    expect(includesMove(hobbledHorse, [9, 1], [7, 2])).toBe(false);
  });

  it('enforces soldier movement before and after crossing the river', () => {
    const soldiers = stateWithPieces([
      [0, 4, 'general'],
      [9, 4, 'general'],
      [6, 2, 'soldier'],
    ]);
    expect(includesMove(soldiers, [6, 2], [5, 2])).toBe(true);
    expect(includesMove(soldiers, [6, 2], [6, 1])).toBe(false);
    const crossed = stateWithPieces([
      [0, 4, 'general'],
      [9, 4, 'general'],
      [4, 2, 'soldier', 0],
    ]);
    expect(includesMove(crossed, [4, 2], [4, 1])).toBe(true);
    expect(includesMove(crossed, [4, 2], [5, 2])).toBe(false);
  });

  it('lets cannons move before a screen and capture only after jumping one screen', () => {
    const cannon = stateWithPieces([
      [0, 4, 'general'],
      [9, 4, 'general'],
      [4, 0, 'cannon', 0],
      [4, 2, 'soldier'],
      [4, 3, 'horse'],
      [4, 5, 'chariot', 1],
    ]);
    expect(includesMove(cannon, [4, 0], [4, 1])).toBe(true);
    expect(includesMove(cannon, [4, 0], [4, 3])).toBe(true);
    expect(includesMove(cannon, [4, 0], [4, 5])).toBe(false);
    const oneScreen = stateWithPieces([
      [0, 4, 'general'],
      [9, 4, 'general'],
      [4, 0, 'cannon', 0],
      [4, 2, 'soldier'],
      [4, 5, 'chariot', 1],
    ]);
    expect(includesMove(oneScreen, [4, 0], [4, 5])).toBe(true);
  });

  it('rejects facing generals and moves that expose its own general', () => {
    const facing = stateWithPieces(
      [
        [0, 4, 'general'],
        [9, 4, 'general'],
      ],
      0,
      false,
    );
    expect(isInCheck(facing, 0)).toBe(true);
    expect(xiangqi.legalMoves(facing).length).toBeGreaterThan(0);

    const exposed = stateWithPieces([
      [0, 4, 'general'],
      [9, 4, 'general'],
      [5, 4, 'chariot', 1],
      [7, 4, 'soldier'],
    ]);
    expect(includesMove(exposed, [7, 4], [7, 3])).toBe(false);
  });

  it('applies chariot blocking and capture rules', () => {
    const state = stateWithPieces([
      [0, 4, 'general'],
      [9, 4, 'general'],
      [5, 0, 'chariot'],
      [5, 3, 'soldier', 1],
      [5, 5, 'horse', 1],
    ]);
    expect(includesMove(state, [5, 0], [5, 2])).toBe(true);
    expect(includesMove(state, [5, 0], [5, 3])).toBe(true);
    expect(includesMove(state, [5, 0], [5, 5])).toBe(false);
    const next = makeMove(state, [5, 0], [5, 3]);
    expect(next.board[indexOf(5, 3)]).toEqual({ type: 'chariot', player: 0 });
    expect(next.board[indexOf(5, 0)]).toBeNull();
  });

  it('treats both checkmate and stalemate as a loss for the side to move', () => {
    const stalemate = stateWithPieces(
      [
        [0, 3, 'general', 1],
        [9, 4, 'general', 0],
        [7, 4, 'soldier', 1],
        [7, 2, 'horse', 1],
        [7, 6, 'horse', 1],
      ],
      0,
      false,
    );
    expect(isInCheck(stalemate, 0)).toBe(false);
    expect(xiangqi.legalMoves(stalemate)).toHaveLength(0);
    expect(xiangqi.winner(stalemate)).toBe(1);

    const checkmate = stateWithPieces(
      [
        [0, 3, 'general', 1],
        [9, 4, 'general', 0],
        [8, 4, 'chariot', 1],
        [7, 2, 'horse', 1],
        [7, 6, 'horse', 1],
        [6, 3, 'horse', 1],
      ],
      0,
      false,
    );
    expect(isInCheck(checkmate, 0)).toBe(true);
    expect(xiangqi.legalMoves(checkmate)).toHaveLength(0);
    expect(xiangqi.winner(checkmate)).toBe(1);
  });

  it('draws after a third occurrence unless one player gives perpetual check', () => {
    const initial = xiangqi.initialState();
    const position = initial.history[0]!.position;
    const noChecks = {
      ...initial,
      history: [
        { position, mover: null, gaveCheck: false },
        { position: 'other', mover: 0 as const, gaveCheck: false },
        { position, mover: 1 as const, gaveCheck: false },
        { position: 'other', mover: 0 as const, gaveCheck: false },
        { position, mover: 1 as const, gaveCheck: false },
      ],
    };
    expect(xiangqi.winner(noChecks)).toBe('draw');

    const perpetualCheck = {
      ...noChecks,
      history: noChecks.history.map((entry) =>
        entry.mover === 0 ? { ...entry, gaveCheck: true } : entry,
      ),
    };
    expect(xiangqi.winner(perpetualCheck)).toBe(1);
  });

  it('draws after 60 complete moves without a capture or the hard ply cap', () => {
    const initial = xiangqi.initialState();
    expect(xiangqi.winner({ ...initial, noCapturePlies: 120 })).toBe('draw');
    expect(xiangqi.winner({ ...initial, plyCount: 400 })).toBe('draw');
  });

  it('tracks moves immutably and runs the engine contract', () => {
    const initial = xiangqi.initialState();
    const next = makeMove(initial, [9, 1], [7, 2]);
    expect(initial.board[indexOf(9, 1)]?.type).toBe('horse');
    expect(next.lastMove).toEqual({ from: indexOf(9, 1), to: indexOf(7, 2) });
    expect(() => xiangqi.applyMove(initial, { from: 0, to: 1 } satisfies XiangqiMove)).toThrow(
      'Illegal Xiangqi move',
    );
    runEngineContract(xiangqi);
  }, 120_000);
});
