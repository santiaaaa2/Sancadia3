import { getBestMove } from '@/engine/ai';
import type { Difficulty } from '@/engine/difficulty';
import type { Player } from '@/engine/types';
import { countMoveCaptures, getLegalMovesFor, seega, type SeegaMove, type SeegaState } from '@/games/seega/rules';

const AI_PROFILES: Record<Difficulty, { depth: number; timeLimitMs: number }> = {
  beginner: { depth: 1, timeLimitMs: 1500 },
  professional: { depth: 3, timeLimitMs: 1500 },
  expert: { depth: 5, timeLimitMs: 1500 },
};

function otherPlayer(player: Player): Player {
  return player === 0 ? 1 : 0;
}

function placementPotential(state: SeegaState, player: Player): number {
  let mobility = 0;
  let exposure = 0;
  for (let square = 0; square < state.board.length; square++) {
    if (state.board[square] !== player) continue;
    const row = Math.floor(square / 5);
    const col = square % 5;
    for (const [rowOffset, colOffset] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]) {
      const neighborRow = row + rowOffset!;
      const neighborCol = col + colOffset!;
      const beyondRow = row + rowOffset! * 2;
      const beyondCol = col + colOffset! * 2;
      if (neighborRow < 0 || neighborRow >= 5 || neighborCol < 0 || neighborCol >= 5) continue;
      const neighbor = neighborRow * 5 + neighborCol;
      if (state.board[neighbor] === null) mobility++;
      if (
        beyondRow >= 0 &&
        beyondRow < 5 &&
        beyondCol >= 0 &&
        beyondCol < 5 &&
        state.board[neighbor] === otherPlayer(player) &&
        state.board[beyondRow * 5 + beyondCol] === otherPlayer(player)
      ) {
        exposure++;
      }
    }
  }
  return mobility * 2 - exposure * 18;
}

function placementScore(state: SeegaState, player: Player): number {
  return placementPotential(state, player) - placementPotential(state, otherPlayer(player));
}

export function evaluate(state: SeegaState, player: Player): number {
  const opponent = otherPlayer(player);
  if (state.phase === 'placement') return placementScore(state, player);

  const material =
    (state.board.filter((owner) => owner === player).length -
      state.board.filter((owner) => owner === opponent).length) *
    200;
  const myMoves = getLegalMovesFor({ ...state, turn: player }, player);
  const opponentMoves = getLegalMovesFor({ ...state, turn: opponent }, opponent);
  const myMobility = myMoves.filter((move) => !('type' in move)).length;
  const opponentMobility = opponentMoves.filter((move) => !('type' in move)).length;
  const myBestCapture = Math.max(
    0,
    ...myMoves.map((move) => countMoveCaptures(state, move, player)),
  );
  const opponentBestCapture = Math.max(
    0,
    ...opponentMoves.map((move) => countMoveCaptures(state, move, opponent)),
  );
  const blockedRisk = (myMobility === 0 ? 100 : 0) - (opponentMobility === 0 ? 100 : 0);

  return (
    material +
    (myMobility - opponentMobility) * 2 +
    (myBestCapture - opponentBestCapture) * 35 -
    blockedRisk
  );
}

function greedyCapture(state: SeegaState): SeegaMove | null {
  const moves = seega.legalMoves(state);
  let best: SeegaMove | null = null;
  let captures = 0;
  for (const move of moves) {
    const count = countMoveCaptures(state, move, seega.currentPlayer(state));
    if (count > captures) {
      captures = count;
      best = move;
    }
  }
  return best;
}

export function chooseMove(state: SeegaState, difficulty: Difficulty): SeegaMove | null {
  if (state.phase === 'placement') {
    const moves = seega.candidateMoves?.(state) ?? seega.legalMoves(state);
    const player = seega.currentPlayer(state);
    let bestScore = -Infinity;
    let bestMove: SeegaMove | null = null;
    for (const move of moves) {
      const next = seega.applyMove(state, move);
      const score = placementScore(next, player);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    return bestMove;
  }

  if (difficulty === 'beginner') {
    const capture = greedyCapture(state);
    if (capture) return capture;
  }
  const profile = AI_PROFILES[difficulty];
  return getBestMove(seega, state, {
    maxDepth: profile.depth,
    timeLimitMs: profile.timeLimitMs,
    evaluate,
  });
}
