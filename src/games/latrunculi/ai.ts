import { getBestMove } from '@/engine/ai';
import type { Difficulty } from '@/engine/difficulty';
import type { Player } from '@/engine/types';
import { getCapturedPieces } from '@/games/latrunculi/capture';
import {
  latrunculi,
  legalMovesFor,
  type LatrunculiMove,
  type LatrunculiState,
} from '@/games/latrunculi/rules';

const AI_PROFILES: Record<Difficulty, { depth: number; timeLimitMs: number }> = {
  beginner: { depth: 1, timeLimitMs: 150 },
  professional: { depth: 2, timeLimitMs: 500 },
  expert: { depth: 4, timeLimitMs: 1200 },
};

export function evaluate(state: LatrunculiState, player: Player): number {
  const opponent: Player = player === 0 ? 1 : 0;
  let material = 0;
  let position = 0;
  let formations = 0;
  for (let row = 0; row < state.board.length; row++) {
    for (let col = 0; col < (state.board[row]?.length ?? 0); col++) {
      const piece = state.board[row]?.[col];
      if (piece === null || piece === undefined) continue;
      const sign = piece === player ? 1 : -1;
      material += sign * 100;
      position += sign * (7 - Math.abs(3.5 - row) - Math.abs(3.5 - col));

      if (state.board[row]?.[col + 1] === piece) formations += sign;
      if (state.board[row + 1]?.[col] === piece) formations += sign;
    }
  }
  const myMoves = legalMovesFor({ ...state, turn: player });
  const opponentMoves = legalMovesFor({ ...state, turn: opponent });
  let bestMyCapture = 0;
  let bestOpponentCapture = 0;
  const threatenedPieces = new Set<string>();

  for (const move of myMoves) {
    bestMyCapture = Math.max(bestMyCapture, getCapturedPieces(state.board, move, player).length);
  }
  for (const move of opponentMoves) {
    const captures = getCapturedPieces(state.board, move, opponent);
    for (const [row, col] of captures) {
      threatenedPieces.add(`${row},${col}`);
    }
    bestOpponentCapture = Math.max(bestOpponentCapture, captures.length);
  }

  return (
    material +
    position * 2 +
    formations * 3 +
    (myMoves.length - opponentMoves.length) * 0.1 +
    (bestMyCapture - bestOpponentCapture) * 35 -
    threatenedPieces.size * 70
  );
}

export function chooseMove(state: LatrunculiState, difficulty: Difficulty): LatrunculiMove | null {
  const profile = AI_PROFILES[difficulty];
  return getBestMove(latrunculi, state, {
    maxDepth: profile.depth,
    timeLimitMs: profile.timeLimitMs,
    evaluate,
  });
}
