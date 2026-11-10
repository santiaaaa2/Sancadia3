import { afterEach, describe, expect, it, vi } from 'vitest';
import { getBestMove } from '@/engine/ai';
import type { GameEngine, Player } from '@/engine/types';

interface TreeNode {
  children: Record<string, string>;
  player?: Player;
  winner?: Player | 'draw';
}

interface TreeState {
  id: string;
  player: Player;
}

function makeTreeEngine(tree: Record<string, TreeNode>): GameEngine<TreeState, string> {
  const getNode = (stateId: string): TreeNode => {
    const node = tree[stateId];
    if (!node) {
      throw new Error(`Unknown node: ${stateId}`);
    }
    return node;
  };

  return {
    id: 'tree',
    initialState: () => ({ id: 'root', player: 0 }),
    currentPlayer: (state) => state.player,
    legalMoves: (state) => Object.keys(getNode(state.id).children),
    applyMove: (state, move) => {
      const nextId = getNode(state.id).children[move];
      if (nextId === undefined) {
        throw new Error(`Unknown child for move "${move}" in state ${state.id}`);
      }
      return {
        id: nextId,
        player: getNode(nextId).player ?? (state.player === 0 ? 1 : 0),
      };
    },
    isTerminal: (state) => getNode(state.id).winner !== undefined,
    winner: (state) => getNode(state.id).winner ?? null,
  };
}

function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

describe('getBestMove', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('takes an immediate win over a draw or a loss', () => {
    const engine = makeTreeEngine({
      root: { children: { loss: 'lost', draw: 'drawn', win: 'won' } },
      lost: { children: {}, winner: 1 },
      drawn: { children: {}, winner: 'draw' },
      won: { children: {}, winner: 0 },
    });
    expect(getBestMove(engine, engine.initialState(), { maxDepth: Infinity })).toBe('win');
  });

  it('prefers a draw over a loss', () => {
    const engine = makeTreeEngine({
      root: { children: { loss: 'lost', draw: 'drawn' } },
      lost: { children: {}, winner: 1 },
      drawn: { children: {}, winner: 'draw' },
    });
    expect(getBestMove(engine, engine.initialState(), { maxDepth: Infinity })).toBe('draw');
  });

  it('prefers a faster win over a slower forced win', () => {
    const engine = makeTreeEngine({
      root: { children: { slow: 'middle', fast: 'won' } },
      middle: { children: { next: 'slowWin' } },
      slowWin: { children: {}, winner: 0 },
      won: { children: {}, winner: 0 },
    });
    expect(getBestMove(engine, engine.initialState(), { maxDepth: Infinity })).toBe('fast');
  });

  it('avoids a move that lets the opponent win', () => {
    const engine = makeTreeEngine({
      root: { children: { blunder: 'oppWins', safe: 'open' } },
      oppWins: { children: { next: 'loss' } },
      loss: { children: {}, winner: 1 },
      open: { children: { next: 'draw' } },
      draw: { children: {}, winner: 'draw' },
    });
    expect(getBestMove(engine, engine.initialState(), { maxDepth: Infinity })).toBe('safe');
  });

  it('keeps maximizing when the same player gets another turn', () => {
    const engine = makeTreeEngine({
      root: { children: { extraTurn: 'extraTurn', draw: 'drawn' } },
      extraTurn: { children: { win: 'won', lose: 'lost' }, player: 0 },
      won: { children: {}, player: 0, winner: 0 },
      lost: { children: {}, player: 0, winner: 1 },
      drawn: { children: {}, winner: 'draw' },
    });

    expect(getBestMove(engine, engine.initialState(), { maxDepth: Infinity })).toBe('extraTurn');
  });

  it('picks randomly among equally good moves', () => {
    const engine = makeTreeEngine({
      root: { children: { a: 'wonA', b: 'wonB' } },
      wonA: { children: {}, winner: 0 },
      wonB: { children: {}, winner: 0 },
    });

    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(getBestMove(engine, engine.initialState(), { maxDepth: Infinity })).toBe('a');

    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    expect(getBestMove(engine, engine.initialState(), { maxDepth: Infinity })).toBe('b');
  });

  it('uses the evaluate function at the depth limit', () => {
    const engine = makeTreeEngine({
      root: { children: { a: 'x', b: 'y' } },
      x: { children: { next: 'leafX' } },
      y: { children: { next: 'leafY' } },
      leafX: { children: {}, winner: 'draw' },
      leafY: { children: {}, winner: 'draw' },
    });
    const evaluate = (state: TreeState) => (state.id === 'x' ? -1 : 1);
    expect(getBestMove(engine, engine.initialState(), { maxDepth: 1, evaluate })).toBe('a');
  });

  it('returns null when there are no legal moves', () => {
    const engine = makeTreeEngine({
      root: { children: {}, winner: 'draw' },
    });
    expect(getBestMove(engine, engine.initialState(), { maxDepth: Infinity })).toBeNull();
  });

  it('never mutates the state it is given', () => {
    const engine = makeTreeEngine({
      root: { children: { a: 'wonA', b: 'drawn' } },
      wonA: { children: {}, winner: 0 },
      drawn: { children: {}, winner: 'draw' },
    });
    const state = deepFreeze(engine.initialState());
    expect(getBestMove(engine, state, { maxDepth: Infinity })).toBe('a');
  });
});

describe('getBestMove options', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const deepTree: Record<string, TreeNode> = {
    root: { children: { a: 'x', b: 'y' } },
    x: { children: { win: 'xWin' } },
    xWin: { children: {}, winner: 0 },
    y: { children: {} },
  };
  const deepEvaluate = (state: TreeState) => (state.id === 'x' ? 5 : -5);

  it('uses orderMoves before searching without changing the answer', () => {
    const engine = makeTreeEngine({
      root: { children: { loss: 'lost', draw: 'drawn', win: 'won' } },
      lost: { children: {}, winner: 1 },
      drawn: { children: {}, winner: 'draw' },
      won: { children: {}, winner: 0 },
    });
    let ordered = false;
    const ordering: GameEngine<TreeState, string> = {
      ...engine,
      orderMoves: (_state, moves) => {
        ordered = true;
        return [...moves].reverse();
      },
    };
    expect(getBestMove(ordering, ordering.initialState(), { maxDepth: Infinity })).toBe('win');
    expect(ordered).toBe(true);
  });

  it('searches only candidateMoves when they are provided', () => {
    const engine = makeTreeEngine({
      root: { children: { a: 'lost', b: 'won' } },
      lost: { children: {}, winner: 1 },
      won: { children: {}, winner: 0 },
    });
    const pruned: GameEngine<TreeState, string> = {
      ...engine,
      candidateMoves: () => ['a'],
    };
    expect(getBestMove(pruned, pruned.initialState(), { maxDepth: Infinity })).toBe('a');
  });

  it('returns the answer of the deepest completed depth when time runs out', () => {
    const engine = makeTreeEngine(deepTree);
    let calls = 0;
    vi.spyOn(Date, 'now').mockImplementation(() => (++calls > 5 ? 1000 : 0));
    expect(
      getBestMove(engine, engine.initialState(), {
        maxDepth: 2,
        evaluate: deepEvaluate,
        timeLimitMs: 100,
      }),
    ).toBe('b');
  });

  it('finds the deeper answer when there is time to reach it', () => {
    const engine = makeTreeEngine(deepTree);
    expect(
      getBestMove(engine, engine.initialState(), {
        maxDepth: 2,
        evaluate: deepEvaluate,
        timeLimitMs: 60_000,
      }),
    ).toBe('a');
  });

  it('falls back to the first ordered move when no depth completes', () => {
    const engine = makeTreeEngine(deepTree);
    expect(getBestMove(engine, engine.initialState(), { maxDepth: 2, timeLimitMs: 0 })).toBe('a');
  });

  it('searches through a forced pass to find the following move', () => {
    const tree: Record<string, TreeNode> = {
      root: { children: { draw: 'drawn', advance: 'blocked' } },
      drawn: { children: {}, winner: 'draw' },
      blocked: { children: {} },
      ready: { children: { win: 'won' } },
      won: { children: {}, winner: 0 },
    };
    const base = makeTreeEngine(tree);
    const getNode = (stateId: string): TreeNode => {
      const node = tree[stateId];
      if (!node) {
        throw new Error(`Unknown state: ${stateId}`);
      }
      return node;
    };
    const engine: GameEngine<TreeState, string> = {
      ...base,
      legalMoves: (state) =>
        state.id === 'blocked' ? [] : Object.keys(getNode(state.id).children),
      passTurn: (state) => ({ id: 'ready', player: state.player === 0 ? 1 : 0 }),
      applyMove: (state, move) => {
        const nextId = getNode(state.id).children[move];
        if (nextId === undefined) {
          throw new Error(`Unknown child for move "${move}" in state ${state.id}`);
        }
        return {
          id: nextId,
          player: state.player === 0 ? 1 : 0,
        };
      },
    };
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(getBestMove(engine, engine.initialState(), { maxDepth: 3 })).toBe('advance');
  });
});
