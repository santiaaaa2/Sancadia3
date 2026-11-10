import { describe, expect, it } from 'vitest';
import { createInitialState, takeTurn } from '@/games/ganzenbord/rules';

function stateAt(position: number, turn = 0, playerCount: 2 | 3 | 4 = 2) {
  const state = createInitialState(playerCount);
  state.positions[turn] = position;
  state.turn = turn;
  return state;
}

describe('Ganzenbord rules', () => {
  it('creates a fresh game for each supported player count', () => {
    expect(createInitialState(4)).toMatchObject({
      playerCount: 4,
      positions: [0, 0, 0, 0],
      waitTurns: [0, 0, 0, 0],
      turn: 0,
      winner: null,
    });
  });

  it('repeats the same die roll for Goose spaces', () => {
    const next = takeTurn(stateAt(3), 6);

    expect(next.positions[0]).toBe(15);
    expect(next.turn).toBe(1);
    expect(next.message).toContain('lands on space 15');
  });

  it('bounces backward when the roll passes the finish', () => {
    const next = takeTurn(stateAt(60), 5);

    expect(next.positions[0]).toBe(61);
    expect(next.winner).toBeNull();
  });

  it('applies special spaces after Goose movement resolves', () => {
    expect(takeTurn(stateAt(0), 6).positions[0]).toBe(12);
    expect(takeTurn(stateAt(13), 6).waitTurns[0]).toBe(1);
    expect(takeTurn(stateAt(25), 6).waitTurns[0]).toBe(2);
    expect(takeTurn(stateAt(36), 6).positions[0]).toBe(39);
    expect(takeTurn(stateAt(46), 6).waitTurns[0]).toBe(2);
    expect(takeTurn(stateAt(52), 6).positions[0]).toBe(0);
  });

  it('uses each missed turn before handing play to the next player', () => {
    const atWell = takeTurn(stateAt(25), 6);
    const playerTwoTurn = takeTurn(atWell, 2);
    const playerOneFirstWait = takeTurn(playerTwoTurn, 3);
    const playerTwoAgain = takeTurn(playerOneFirstWait, 4);
    const playerOneSecondWait = takeTurn(playerTwoAgain, 5);

    expect(playerOneFirstWait.waitTurns[0]).toBe(1);
    expect(playerOneFirstWait.turn).toBe(1);
    expect(playerOneSecondWait.waitTurns[0]).toBe(0);
    expect(playerOneSecondWait.turn).toBe(1);
    expect(playerOneSecondWait.lastRoll).toBeNull();
  });

  it('wins only on an exact finish and ignores turns after winning', () => {
    const winning = takeTurn(stateAt(57), 6);

    expect(winning.winner).toBe(0);
    expect(winning.positions[0]).toBe(63);
    expect(takeTurn(winning, 1)).toBe(winning);
  });

  it('rejects invalid die values', () => {
    expect(() => takeTurn(stateAt(0), 0)).toThrow(RangeError);
    expect(() => takeTurn(stateAt(0), 7)).toThrow(RangeError);
  });
});
