import type { Difficulty } from '@/engine/difficulty';
import type { Player } from '@/engine/types';
import {
  getLegalMovesFor,
  pieceValue,
  xiangqi,
  type XiangqiMove,
  type XiangqiState,
} from '@/games/xiangqi/rules';

const MATE_SCORE = 100_000;

function isPlayer(value: unknown): value is Player {
  return value === 0 || value === 1;
}

export function isXiangqiState(value: unknown): value is XiangqiState {
  if (typeof value !== 'object' || value === null) return false;
  const state = value as Record<string, unknown>;
  return (
    Array.isArray(state.board) &&
    state.board.length === 90 &&
    state.board.every(
      (piece) =>
        piece === null ||
        (typeof piece === 'object' &&
          piece !== null &&
          ['general', 'advisor', 'elephant', 'horse', 'chariot', 'cannon', 'soldier'].includes(
            (piece as Record<string, unknown>).type as string,
          ) &&
          isPlayer((piece as Record<string, unknown>).player)),
    ) &&
    isPlayer(state.turn) &&
    Number.isInteger(state.plyCount) &&
    Number(state.plyCount) >= 0 &&
    Number(state.plyCount) <= 400 &&
    Number.isInteger(state.noCapturePlies) &&
    Number(state.noCapturePlies) >= 0 &&
    Number(state.noCapturePlies) <= 120 &&
    Array.isArray(state.history) &&
    state.history.length > 0 &&
    state.history.length <= 401 &&
    state.history.every(
      (entry) =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as Record<string, unknown>).position === 'string' &&
        ((entry as Record<string, unknown>).mover === null ||
          isPlayer((entry as Record<string, unknown>).mover)) &&
        typeof (entry as Record<string, unknown>).gaveCheck === 'boolean',
    ) &&
    (state.lastMove === null ||
      (typeof state.lastMove === 'object' &&
        state.lastMove !== null &&
        Number.isInteger((state.lastMove as Record<string, unknown>).from) &&
        Number((state.lastMove as Record<string, unknown>).from) >= 0 &&
        Number((state.lastMove as Record<string, unknown>).from) < 90 &&
        Number.isInteger((state.lastMove as Record<string, unknown>).to) &&
        Number((state.lastMove as Record<string, unknown>).to) >= 0 &&
        Number((state.lastMove as Record<string, unknown>).to) < 90))
  );
}

function evaluateForPlayer(state: XiangqiState, player: Player): number {
  let score = 0;
  for (let index = 0; index < state.board.length; index++) {
    const piece = state.board[index];
    if (!piece) continue;
    const { row, col } = { row: Math.floor(index / 9), col: index % 9 };
    const side = piece.player === player ? 1 : -1;
    let positionBonus = 0;
    if (piece.type === 'soldier') {
      const progress = piece.player === 0 ? 6 - row : row - 3;
      positionBonus = Math.max(0, progress) * 8 + (row >= 4 && row <= 5 ? 12 : 0);
    } else if (piece.type === 'horse' || piece.type === 'cannon') {
      positionBonus = Math.max(0, 4 - Math.abs(4 - col)) * 3;
    }
    score += side * (pieceValue(piece.type) + positionBonus);
  }
  return score;
}

export function evaluateXiangqi(state: XiangqiState, player: Player): number {
  return evaluateForPlayer(state, player);
}

interface SearchContext {
  deadline: number;
  signal: AbortSignal;
  stopped: boolean;
}

function orderedMoves(state: XiangqiState, moves: XiangqiMove[]): XiangqiMove[] {
  return [...moves].sort((a, b) => {
    const victimA = state.board[a.to];
    const attackerA = state.board[a.from];
    const victimB = state.board[b.to];
    const attackerB = state.board[b.from];
    const scoreA =
      victimA && attackerA ? pieceValue(victimA.type) * 10 - pieceValue(attackerA.type) : 0;
    const scoreB =
      victimB && attackerB ? pieceValue(victimB.type) * 10 - pieceValue(attackerB.type) : 0;
    return scoreB - scoreA;
  });
}

function search(
  state: XiangqiState,
  depth: number,
  alpha: number,
  beta: number,
  ply: number,
  context: SearchContext,
): number {
  if (context.signal.aborted || performance.now() >= context.deadline) {
    context.stopped = true;
    return evaluateForPlayer(state, state.turn);
  }
  const winner = xiangqi.winner(state);
  if (winner !== null) {
    return winner === 'draw' ? 0 : winner === state.turn ? MATE_SCORE - ply : -MATE_SCORE + ply;
  }
  if (depth <= 0) return evaluateForPlayer(state, state.turn);

  const moves = orderedMoves(state, getLegalMovesFor(state, state.turn));
  if (moves.length === 0) return -MATE_SCORE + ply;
  let best = -Infinity;
  for (const move of moves) {
    const next = xiangqi.applyMove(state, move);
    const score = -search(next, depth - 1, -beta, -alpha, ply + 1, context);
    if (score > best) best = score;
    if (score > alpha) alpha = score;
    if (alpha >= beta || context.stopped) break;
  }
  return best;
}

const depthByDifficulty: Record<Difficulty, number> = {
  beginner: 1,
  professional: 2,
  expert: 4,
};

function yieldToWorker(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

export async function chooseXiangqiMove(
  state: XiangqiState,
  difficulty: Difficulty,
  timeLimitMs: number | undefined,
  signal: AbortSignal,
): Promise<XiangqiMove | null> {
  const legalMoves = xiangqi.legalMoves(state);
  if (legalMoves.length === 0 || signal.aborted) return null;
  const orderedRoot = orderedMoves(state, legalMoves);
  const context: SearchContext = {
    deadline: performance.now() + (timeLimitMs ?? 1200),
    signal,
    stopped: false,
  };
  let bestMove = orderedRoot[0]!;

  for (let depth = 1; depth <= depthByDifficulty[difficulty]; depth++) {
    let iterationBest = bestMove;
    let iterationScore = -Infinity;
    let alpha = -Infinity;
    for (const move of orderedRoot) {
      if (signal.aborted || performance.now() >= context.deadline) {
        context.stopped = true;
        break;
      }
      const score = -search(
        xiangqi.applyMove(state, move),
        depth - 1,
        -Infinity,
        -alpha,
        1,
        context,
      );
      if (score > iterationScore) {
        iterationScore = score;
        iterationBest = move;
      }
      if (score > alpha) alpha = score;
      if (context.stopped) break;
      await yieldToWorker();
    }
    if (context.stopped) break;
    bestMove = iterationBest;
  }
  return signal.aborted ? null : bestMove;
}
