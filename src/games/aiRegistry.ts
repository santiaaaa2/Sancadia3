import {
  getDifficultySettings,
  pickAiMove,
  type Difficulty,
  type DifficultyCaps,
} from '@/engine/difficulty';
import type { GameEngine, Player } from '@/engine/types';
import { evaluate as evaluateConnect4 } from '@/games/connect4/ai';
import { connect4, type Connect4State } from '@/games/connect4/rules';
import { evaluate as evaluateGomoku } from '@/games/gomoku/ai';
import { gomoku, type GomokuState } from '@/games/gomoku/rules';
import { evaluate as evaluateCheckers } from '@/games/checkers/ai';
import { checkers, type CheckersState } from '@/games/checkers/rules';
import { evaluate as evaluateReversi } from '@/games/reversi/ai';
import { reversi, type ReversiState } from '@/games/reversi/rules';
import {
  chooseMove as chooseLatrunculiMove,
  evaluate as evaluateLatrunculi,
} from '@/games/latrunculi/ai';
import { latrunculi, MAX_MOVES, type LatrunculiState } from '@/games/latrunculi/rules';
import { ticTacToe, type TicTacToeState } from '@/games/tictactoe/rules';

export type WorkerGameId =
  'noughts-and-crosses' | 'connect-4' | 'gomoku' | 'reversi' | 'checkers' | 'latrunculi';

export interface WorkerAiEntry {
  depthCaps: DifficultyCaps;
  initialState: () => unknown;
  validateState: (state: unknown) => boolean;
  evaluate?: (state: unknown, player: Player) => number;
  findMove: (state: unknown, difficulty: Difficulty) => unknown | null;
  isLegalMove: (state: unknown, move: unknown) => boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isPlayer(value: unknown): value is Player {
  return value === 0 || value === 1;
}

function isCell(value: unknown): boolean {
  return value === null || isPlayer(value);
}

function isCellBoard(value: unknown, size: number, rows = size): boolean {
  return (
    Array.isArray(value) &&
    value.length === rows &&
    value.every((row) => Array.isArray(row) && row.length === size && row.every(isCell))
  );
}

function isTicTacToeState(value: unknown): value is TicTacToeState {
  return (
    isRecord(value) &&
    isPlayer(value.turn) &&
    Array.isArray(value.board) &&
    value.board.length === 9 &&
    value.board.every(isCell)
  );
}

function isConnect4State(value: unknown): value is Connect4State {
  return isRecord(value) && isPlayer(value.turn) && isCellBoard(value.board, 7, 6);
}

function isGomokuState(value: unknown): value is GomokuState {
  return isRecord(value) && isPlayer(value.turn) && isCellBoard(value.board, 15);
}

function isReversiState(value: unknown): value is ReversiState {
  return (
    isRecord(value) &&
    isPlayer(value.turn) &&
    typeof value.passed === 'boolean' &&
    isCellBoard(value.board, 8)
  );
}

function isLatrunculiState(value: unknown): value is LatrunculiState {
  return (
    isRecord(value) &&
    isPlayer(value.turn) &&
    typeof value.totalMoves === 'number' &&
    Number.isInteger(value.totalMoves) &&
    value.totalMoves >= 0 &&
    value.totalMoves <= MAX_MOVES &&
    isCellBoard(value.board, 8) &&
    Array.isArray(value.survivingPieces) &&
    value.survivingPieces.length === 2 &&
    value.survivingPieces.every((count) => Number.isInteger(count) && count >= 0) &&
    Array.isArray(value.capturedPieces) &&
    value.capturedPieces.length === 2 &&
    value.capturedPieces.every((count) => Number.isInteger(count) && count >= 0) &&
    Array.isArray(value.moveHistory) &&
    (value.status === 'active' || value.status === 'completed') &&
    (value.winner === null || isPlayer(value.winner) || value.winner === 'draw') &&
    (value.gameMode === 'two-player' || value.gameMode === 'computer') &&
    isRecord(value.victoryRules) &&
    typeof value.victoryRules.noLegalMoves === 'boolean' &&
    typeof value.victoryRules.noPieces === 'boolean' &&
    typeof value.victoryRules.majorityCapture === 'boolean'
  );
}

function isCheckersState(value: unknown): value is CheckersState {
  if (
    !isRecord(value) ||
    !isPlayer(value.turn) ||
    !Array.isArray(value.board) ||
    value.board.length !== 8
  ) {
    return false;
  }
  const validBoard = value.board.every(
    (row) =>
      Array.isArray(row) &&
      row.length === 8 &&
      row.every(
        (piece) =>
          piece === null ||
          (isRecord(piece) &&
            isPlayer(piece.player) &&
            (piece.type === 'man' || piece.type === 'king')),
      ),
  );
  const continuation = value.mustContinueFrom;
  return (
    validBoard &&
    (continuation === null ||
      (Array.isArray(continuation) &&
        continuation.length === 2 &&
        continuation.every((coordinate) => typeof coordinate === 'number')))
  );
}

function createEntry<State, Move>(
  engine: GameEngine<State, Move>,
  depthCaps: DifficultyCaps,
  validate: (state: unknown) => state is State,
  evaluate?: (state: State, player: Player) => number,
  chooseMove?: (state: State, difficulty: Difficulty) => Move | null,
): WorkerAiEntry {
  const evaluateUnknown = evaluate
    ? (state: unknown, player: Player) => (validate(state) ? evaluate(state, player) : 0)
    : undefined;
  return {
    depthCaps,
    initialState: engine.initialState,
    validateState: validate,
    evaluate: evaluateUnknown,
    findMove(state, difficulty) {
      if (!validate(state)) throw new Error(`Invalid state for ${engine.id}`);
      if (chooseMove) return chooseMove(state, difficulty);
      return pickAiMove(engine, state, getDifficultySettings(difficulty, depthCaps), evaluate);
    },
    isLegalMove(state, candidate) {
      if (!validate(state)) return false;
      return engine
        .legalMoves(state)
        .some(
          (move) =>
            engine.movesEqual?.(move, candidate as Move) ??
            JSON.stringify(move) === JSON.stringify(candidate),
        );
    },
  };
}

const TICTACTOE_CAPS: DifficultyCaps = {
  maxDepthCap: { beginner: 1, professional: 3, expert: Infinity },
};
const CONNECT4_CAPS: DifficultyCaps = {
  maxDepthCap: { beginner: 2, professional: 4, expert: 6 },
  timeLimitMs: 1000,
};
const GOMOKU_CAPS: DifficultyCaps = {
  maxDepthCap: { beginner: 1, professional: 2, expert: 3 },
  timeLimitMs: 1500,
};
const REVERSI_CAPS: DifficultyCaps = {
  maxDepthCap: { beginner: 1, professional: 3, expert: 5 },
  timeLimitMs: 1200,
};
const CHECKERS_CAPS: DifficultyCaps = {
  maxDepthCap: { beginner: 1, professional: 4, expert: 7 },
  timeLimitMs: 1500,
};
const LATRUNCULI_CAPS: DifficultyCaps = {
  maxDepthCap: { beginner: 1, professional: 2, expert: 4 },
  timeLimitMs: 1200,
};

export const aiRegistry: Record<WorkerGameId, WorkerAiEntry> = {
  'noughts-and-crosses': createEntry(ticTacToe, TICTACTOE_CAPS, isTicTacToeState),
  'connect-4': createEntry(connect4, CONNECT4_CAPS, isConnect4State, evaluateConnect4),
  gomoku: createEntry(gomoku, GOMOKU_CAPS, isGomokuState, evaluateGomoku),
  reversi: createEntry(reversi, REVERSI_CAPS, isReversiState, evaluateReversi),
  checkers: createEntry(checkers, CHECKERS_CAPS, isCheckersState, evaluateCheckers),
  latrunculi: createEntry(
    latrunculi,
    LATRUNCULI_CAPS,
    isLatrunculiState,
    evaluateLatrunculi,
    chooseLatrunculiMove,
  ),
};

export function isWorkerGameId(value: string): value is WorkerGameId {
  return Object.prototype.hasOwnProperty.call(aiRegistry, value);
}
