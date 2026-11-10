import { getDifficultySettings, pickAiMove, type Difficulty } from '@/engine/difficulty';
import type { Player } from '@/engine/types';
import {
  latrunculi,
  legalMovesFor,
  type LatrunculiMove,
  type LatrunculiState,
} from '@/games/latrunculi/rules';

const DEPTH_CAPS = {
  maxDepthCap: { beginner: 1, professional: 2, expert: 3 },
  timeLimitMs: 1200,
};

export function evaluate(state: LatrunculiState, player: Player): number {
  const opponent: Player = player === 0 ? 1 : 0;
  let material = 0;
  let position = 0;
  for (let row = 0; row < state.board.length; row++) {
    for (let col = 0; col < (state.board[row]?.length ?? 0); col++) {
      const piece = state.board[row]?.[col];
      if (piece === null || piece === undefined) continue;
      const sign = piece === player ? 1 : -1;
      material += sign * 100;
      position += sign * (7 - Math.abs(3.5 - row) - Math.abs(3.5 - col));
    }
  }
  const myMoves = legalMovesFor({ ...state, turn: player }).length;
  const opponentMoves = legalMovesFor({ ...state, turn: opponent }).length;
  return material + position * 2 + (myMoves - opponentMoves) * 0.25;
}

export function chooseMove(state: LatrunculiState, difficulty: Difficulty): LatrunculiMove | null {
  return pickAiMove(latrunculi, state, getDifficultySettings(difficulty, DEPTH_CAPS), evaluate);
}
