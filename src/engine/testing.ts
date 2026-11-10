import { expect } from 'vitest';
import type { GameEngine } from '@/engine/types';

const RANDOM_GAMES = 200;
const MAX_PLAYOUT_TURNS = 10_000;

function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

function randomIndex(length: number): number {
  const index = Math.floor(Math.random() * length);
  if (index >= length) {
    throw new Error('Random move selection returned an invalid index.');
  }
  return index;
}

export function runEngineContract<State, Move>(engine: GameEngine<State, Move>): void {
  const initialState = engine.initialState();
  const initialMoves = engine.legalMoves(initialState);

  expect(
    engine.isTerminal(initialState),
    `${engine.id}: initial state should not be terminal`,
  ).toBe(false);
  expect(
    initialMoves.length > 0 || engine.passTurn !== undefined,
    `${engine.id}: initial state must have a legal move or pass`,
  ).toBe(true);
  expect(engine.winner(initialState), `${engine.id}: non-terminal winner`).toBeNull();

  const frozenInitialState = deepFreeze(initialState);
  for (const move of initialMoves) {
    expect(
      () => engine.applyMove(frozenInitialState, move),
      `${engine.id}: applyMove`,
    ).not.toThrow();
  }

  for (let game = 0; game < RANDOM_GAMES; game++) {
    let state = engine.initialState();
    let turns = 0;

    while (!engine.isTerminal(state) && turns < MAX_PLAYOUT_TURNS) {
      expect(engine.winner(state), `${engine.id}: non-terminal winner`).toBeNull();
      const moves = engine.legalMoves(state);

      if (moves.length === 0) {
        expect(
          engine.passTurn,
          `${engine.id}: non-terminal state has no move or pass`,
        ).toBeDefined();
        if (!engine.passTurn) break;
        state = engine.passTurn(deepFreeze(state));
      } else {
        const move = moves[randomIndex(moves.length)];
        if (move === undefined) {
          throw new Error(`${engine.id}: random move selection returned no move.`);
        }
        const input = deepFreeze(state);
        state = engine.applyMove(input, move);
      }

      turns++;
    }

    expect(
      engine.isTerminal(state),
      `${engine.id}: random game ${game + 1} did not terminate within ${MAX_PLAYOUT_TURNS} turns`,
    ).toBe(true);
    expect(engine.winner(state), `${engine.id}: terminal winner`).not.toBeNull();
  }
}
