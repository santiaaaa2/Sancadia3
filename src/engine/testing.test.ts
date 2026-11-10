import { describe, it } from 'vitest';
import { runEngineContract } from '@/engine/testing';
import { connect4 } from '@/games/connect4/rules';
import { gomoku } from '@/games/gomoku/rules';
import { ticTacToe } from '@/games/tictactoe/rules';

describe('GameEngine contract', () => {
  it('is satisfied by tic-tac-toe', () => {
    runEngineContract(ticTacToe);
  });

  it('is satisfied by Connect 4', () => {
    runEngineContract(connect4);
  });

  it('is satisfied by Gomoku', () => {
    runEngineContract(gomoku);
  }, 60_000);
});
