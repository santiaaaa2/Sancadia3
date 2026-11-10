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
import { chooseXiangqiMove, evaluateXiangqi, isXiangqiState } from '@/games/xiangqi/ai';
import { xiangqi, type XiangqiState } from '@/games/xiangqi/rules';
import { chooseMove as chooseSeegaMove, evaluate as evaluateSeega } from '@/games/seega/ai';
import { seega, type SeegaState } from '@/games/seega/rules';

export type WorkerGameId =
  | 'noughts-and-crosses'
  | 'connect-4'
  | 'gomoku'
  | 'reversi'
  | 'checkers'
  | 'latrunculi'
  | 'seega'
  | 'xiangqi'
  | 'go'
  | 'chinesecheckers'
  | 'luzhanqi'
  | 'mahjong';

export interface WorkerAiEntry {
  available: boolean;
  depthCaps: DifficultyCaps;
  initialState: () => unknown;
  validateState: (state: unknown) => boolean;
  evaluate?: (state: unknown, player: Player) => number;
  supportsCancellation: boolean;
  findMove: (
    state: unknown,
    difficulty: Difficulty,
    signal?: AbortSignal,
  ) => unknown | null | Promise<unknown | null>;
  isLegalMove: (state: unknown, move: unknown) => boolean;
}

export type WorkerSearchOverride<State, Move> = (
  state: State,
  difficulty: Difficulty,
  timeLimitMs: number | undefined,
  signal: AbortSignal,
) => Move | null | Promise<Move | null>;

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

function isSeegaState(value: unknown): value is SeegaState {
  if (
    !isRecord(value) ||
    !isPlayer(value.turn) ||
    (value.phase !== 'placement' && value.phase !== 'movement') ||
    !Array.isArray(value.board) ||
    value.board.length !== 25 ||
    !value.board.every(isCell) ||
    !Number.isInteger(value.placementsMade) ||
    !Number.isInteger(value.placementsInTurn) ||
    !Number.isInteger(value.noCaptureMoves) ||
    !Number.isInteger(value.movementMoves) ||
    !Array.isArray(value.history) ||
    !value.history.every((position) => typeof position === 'string') ||
    !isRecord(value.ruleset)
  ) {
    return false;
  }
  const ruleset = value.ruleset;
  const lastPlacementPlayer = value.lastPlacementPlayer;
  const lastMove = value.lastMove;
  return (
    Number.isInteger(ruleset.stonesPerPlayer) &&
    Number(ruleset.stonesPerPlayer) > 0 &&
    Number.isInteger(ruleset.stonesPerTurn) &&
    Number(ruleset.stonesPerTurn) > 0 &&
    (ruleset.firstMover === 'last-placement' || isPlayer(ruleset.firstMover)) &&
    typeof ruleset.blockedRule === 'boolean' &&
    typeof ruleset.centreRestricted === 'boolean' &&
    Number.isInteger(ruleset.noCaptureMoveLimit) &&
    Number(ruleset.noCaptureMoveLimit) > 0 &&
    Number.isInteger(ruleset.repetitionLimit) &&
    Number(ruleset.repetitionLimit) > 0 &&
    (lastPlacementPlayer === null || isPlayer(lastPlacementPlayer)) &&
    (lastMove === null ||
      (isRecord(lastMove) &&
        (('type' in lastMove && lastMove.type === 'blocked-remove' && Number.isInteger(lastMove.at)) ||
          (!('type' in lastMove) &&
            Number.isInteger(lastMove.from) &&
            Array.isArray(lastMove.path) &&
            lastMove.path.every((square) => Number.isInteger(square))))))
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

export function createWorkerAiEntry<State, Move>(
  engine: GameEngine<State, Move>,
  depthCaps: DifficultyCaps,
  validate: (state: unknown) => state is State,
  evaluate?: (state: State, player: Player) => number,
  chooseMove?: (state: State, difficulty: Difficulty) => Move | null,
  searchOverride?: WorkerSearchOverride<State, Move>,
): WorkerAiEntry {
  const evaluateUnknown = evaluate
    ? (state: unknown, player: Player) => (validate(state) ? evaluate(state, player) : 0)
    : undefined;
  return {
    available: true,
    depthCaps,
    initialState: engine.initialState,
    validateState: validate,
    evaluate: evaluateUnknown,
    supportsCancellation: searchOverride !== undefined,
    findMove(state, difficulty, signal) {
      if (!validate(state)) throw new Error(`Invalid state for ${engine.id}`);
      if (searchOverride) {
        return searchOverride(
          state,
          difficulty,
          depthCaps.timeLimitMs,
          signal ?? new AbortController().signal,
        );
      }
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

function comingSoonEntry(gameId: string): WorkerAiEntry {
  const unavailable = () => {
    throw new Error(`The ${gameId} AI is not available yet.`);
  };
  return {
    available: false,
    depthCaps: { maxDepthCap: { beginner: 1, professional: 1, expert: 1 } },
    initialState: unavailable,
    validateState: () => false,
    findMove: unavailable,
    isLegalMove: () => false,
    supportsCancellation: false,
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
const SEEGA_CAPS: DifficultyCaps = {
  maxDepthCap: { beginner: 1, professional: 3, expert: 5 },
  timeLimitMs: 1500,
};
const XIANGQI_CAPS: DifficultyCaps = {
  maxDepthCap: { beginner: 1, professional: 2, expert: 4 },
  timeLimitMs: 1200,
};

export const aiRegistry: Record<WorkerGameId, WorkerAiEntry> = {
  'noughts-and-crosses': createWorkerAiEntry(ticTacToe, TICTACTOE_CAPS, isTicTacToeState),
  'connect-4': createWorkerAiEntry(connect4, CONNECT4_CAPS, isConnect4State, evaluateConnect4),
  gomoku: createWorkerAiEntry(gomoku, GOMOKU_CAPS, isGomokuState, evaluateGomoku),
  reversi: createWorkerAiEntry(reversi, REVERSI_CAPS, isReversiState, evaluateReversi),
  checkers: createWorkerAiEntry(checkers, CHECKERS_CAPS, isCheckersState, evaluateCheckers),
  latrunculi: createWorkerAiEntry(
    latrunculi,
    LATRUNCULI_CAPS,
    isLatrunculiState,
    evaluateLatrunculi,
    chooseLatrunculiMove,
  ),
  seega: createWorkerAiEntry(
    seega,
    SEEGA_CAPS,
    isSeegaState,
    evaluateSeega,
    chooseSeegaMove,
  ),
  xiangqi: createWorkerAiEntry(
    xiangqi,
    XIANGQI_CAPS,
    (state): state is XiangqiState => isXiangqiState(state),
    evaluateXiangqi,
    undefined,
    chooseXiangqiMove,
  ),
  go: comingSoonEntry('Go'),
  chinesecheckers: comingSoonEntry('Chinese Checkers'),
  luzhanqi: comingSoonEntry('Lu Zhan Qi'),
  mahjong: comingSoonEntry('Mahjong'),
};

export function isWorkerGameId(value: string): value is WorkerGameId {
  return Object.prototype.hasOwnProperty.call(aiRegistry, value);
}
