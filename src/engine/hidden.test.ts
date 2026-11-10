import { describe, expect, it } from 'vitest';
import type { HiddenGameEngine, HiddenPlayer } from '@/engine/hidden';
import { runHiddenGameContract } from '@/engine/testing';

interface SixPlayerState {
  turn: HiddenPlayer;
  plies: number;
  lastPlayer: HiddenPlayer | null;
}

const sixPlayerGame: HiddenGameEngine<SixPlayerState, number, SixPlayerState> = {
  id: 'six-player-contract',
  initialState: () => ({ turn: 0, plies: 0, lastPlayer: null }),
  playerCount: () => 6,
  currentPlayer: (state) => state.turn,
  legalMoves: (state) => (state.plies < 12 ? [1] : []),
  applyMove: (state) => ({
    turn: ((state.turn + 1) % 6) as HiddenPlayer,
    plies: state.plies + 1,
    lastPlayer: state.turn,
  }),
  isTerminal: (state) => state.plies === 12,
  winner: (state) => (state.plies === 12 ? state.lastPlayer : null),
  observe: (state) => state,
};

describe('HiddenGameEngine contract', () => {
  it('supports six-player perfect-information games', () => {
    runHiddenGameContract(sixPlayerGame);
  });

  it('allows a game to expose its full public state to every player', () => {
    const state = sixPlayerGame.initialState();
    for (let player = 0; player < 6; player++) {
      expect(sixPlayerGame.observe(state, player as HiddenPlayer)).toBe(state);
    }
  });
});
