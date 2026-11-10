import type { GameEngine, Player } from '@/engine/types';

export interface SearchOptions<State> {
  maxDepth: number;
  evaluate?: (state: State, player: Player) => number;
  timeLimitMs?: number;
}

const WIN_SCORE = 1_000_000_000;

class SearchTimeout extends Error {}

interface SearchContext<State> {
  evaluate: SearchOptions<State>['evaluate'];
  deadline: number | null;
  maximizingPlayer: Player;
}

function searchMoves<State, Move>(engine: GameEngine<State, Move>, state: State): Move[] {
  const moves = engine.candidateMoves ? engine.candidateMoves(state) : engine.legalMoves(state);
  return engine.orderMoves ? engine.orderMoves(state, moves) : moves;
}

function search<State, Move>(
  engine: GameEngine<State, Move>,
  state: State,
  depth: number,
  alpha: number,
  beta: number,
  ply: number,
  context: SearchContext<State>,
): number {
  if (context.deadline !== null && Date.now() >= context.deadline) throw new SearchTimeout();

  if (engine.isTerminal(state)) {
    const result = engine.winner(state);
    if (result === null || result === 'draw') return 0;
    const score = WIN_SCORE - ply;
    return result === context.maximizingPlayer ? score : -score;
  }

  const moves = searchMoves(engine, state);
  if (moves.length === 0) {
    if (engine.passTurn) {
      return search(
        engine,
        engine.passTurn(state),
        Math.max(0, depth - 1),
        alpha,
        beta,
        ply + 1,
        context,
      );
    }
    return 0;
  }

  if (depth <= 0) {
    if (!context.evaluate) return 0;
    const player = engine.currentPlayer(state);
    const score = context.evaluate(state, player);
    return player === context.maximizingPlayer ? score : -score;
  }

  const maximizing = engine.currentPlayer(state) === context.maximizingPlayer;
  let best = maximizing ? -Infinity : Infinity;
  for (const move of moves) {
    const next = engine.applyMove(state, move);
    const value = search(engine, next, depth - 1, alpha, beta, ply + 1, context);
    if (maximizing ? value > best : value < best) best = value;
    if (maximizing && best > alpha) alpha = best;
    if (!maximizing && best < beta) beta = best;
    if (alpha >= beta) break;
  }
  return best;
}

function bestMovesAtDepth<State, Move>(
  engine: GameEngine<State, Move>,
  state: State,
  moves: Move[],
  depth: number,
  context: SearchContext<State>,
): Move[] {
  const maximizingPlayer = engine.currentPlayer(state);
  const contextWithPlayer = { ...context, maximizingPlayer };
  let bestValue = -Infinity;
  let bestMoves: Move[] = [];

  for (const move of moves) {
    const next = engine.applyMove(state, move);
    const value = search(engine, next, depth - 1, -Infinity, Infinity, 1, contextWithPlayer);
    if (value > bestValue) {
      bestValue = value;
      bestMoves = [move];
    } else if (value === bestValue) {
      bestMoves.push(move);
    }
  }

  return bestMoves;
}

function pickRandom<Move>(moves: Move[]): Move {
  const index = Math.floor(Math.random() * moves.length);
  const move = moves[index];
  if (move === undefined) {
    throw new Error('Cannot pick a move from an empty list.');
  }
  return move;
}

export function getBestMove<State, Move>(
  engine: GameEngine<State, Move>,
  state: State,
  options: SearchOptions<State>,
): Move | null {
  const moves = searchMoves(engine, state);
  if (moves.length === 0) return null;

  if (options.timeLimitMs === undefined) {
    const context = {
      evaluate: options.evaluate,
      deadline: null,
      maximizingPlayer: engine.currentPlayer(state),
    };
    return pickRandom(bestMovesAtDepth(engine, state, moves, options.maxDepth, context));
  }

  const context = {
    evaluate: options.evaluate,
    deadline: Date.now() + options.timeLimitMs,
    maximizingPlayer: engine.currentPlayer(state),
  };
  const firstMove = moves[0];
  if (firstMove === undefined) return null;

  let best: Move[] = [firstMove];
  for (let depth = 1; depth <= options.maxDepth; depth++) {
    try {
      best = bestMovesAtDepth(engine, state, moves, depth, context);
    } catch (error) {
      if (error instanceof SearchTimeout) break;
      throw error;
    }
    if (Date.now() >= context.deadline) break;
  }
  return pickRandom(best);
}
