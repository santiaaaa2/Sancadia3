import { expect } from 'vitest';
import type { HiddenGameEngine, HiddenPlayer } from '@/engine/hidden';
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

export function runHiddenGameContract<State, Move, Observation>(
  engine: HiddenGameEngine<State, Move, Observation>,
): void {
  const initialState = engine.initialState();
  const playerCount = engine.playerCount(initialState);

  expect(playerCount, `${engine.id}: player count must be between 2 and 6`).toBeGreaterThanOrEqual(
    2,
  );
  expect(playerCount, `${engine.id}: player count must be between 2 and 6`).toBeLessThanOrEqual(6);
  expect(
    engine.isTerminal(initialState),
    `${engine.id}: initial state should not be terminal`,
  ).toBe(false);
  expect(
    engine.legalMoves(initialState).length,
    `${engine.id}: initial legal moves`,
  ).toBeGreaterThan(0);
  expect(engine.winner(initialState), `${engine.id}: non-terminal winner`).toBeNull();

  for (let player = 0; player < playerCount; player++) {
    const observation = engine.observe(deepFreeze(initialState), player as HiddenPlayer);
    expect(observation, `${engine.id}: player ${player} must receive an observation`).toBeDefined();
  }

  for (const move of engine.legalMoves(initialState)) {
    expect(
      () => engine.applyMove(deepFreeze(initialState), move),
      `${engine.id}: applyMove`,
    ).not.toThrow();
  }

  for (let game = 0; game < RANDOM_GAMES; game++) {
    let state = engine.initialState();
    let plies = 0;
    while (!engine.isTerminal(state) && plies < MAX_PLAYOUT_TURNS) {
      const count = engine.playerCount(state);
      expect(count, `${engine.id}: invalid player count during play`).toBeGreaterThanOrEqual(2);
      expect(count, `${engine.id}: invalid player count during play`).toBeLessThanOrEqual(6);
      const current = engine.currentPlayer(state);
      expect(current, `${engine.id}: current player must be seated`).toBeGreaterThanOrEqual(0);
      expect(current, `${engine.id}: current player must be seated`).toBeLessThan(count);
      expect(engine.winner(state), `${engine.id}: non-terminal winner`).toBeNull();
      const moves = engine.legalMoves(state);
      expect(
        moves.length,
        `${engine.id}: non-terminal state must have a legal move`,
      ).toBeGreaterThan(0);
      const move = moves[randomIndex(moves.length)];
      if (move === undefined) {
        throw new Error(`${engine.id}: random move selection returned no move.`);
      }
      state = engine.applyMove(deepFreeze(state), move);
      plies++;
    }

    expect(
      engine.isTerminal(state),
      `${engine.id}: random game ${game + 1} did not terminate within ${MAX_PLAYOUT_TURNS} plies`,
    ).toBe(true);
    expect(engine.winner(state), `${engine.id}: terminal winner`).not.toBeNull();
  }
}
