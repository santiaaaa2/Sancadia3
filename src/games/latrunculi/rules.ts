import type { GameEngine, Player, Winner } from '@/engine/types';
import {
  detectCaptures,
  getCapturedPieces,
  removeCapturedPieces,
} from '@/games/latrunculi/capture';

export const SIZE = 8;
export const MAX_MOVES = 200;
export const INITIAL_ARMY_SIZE = SIZE * 2;

export type Piece = Player | null;
export type Board = readonly (readonly Piece[])[];
export type Square = readonly [number, number];
export type GameMode = 'two-player' | 'computer';
export type GameStatus = 'active' | 'completed';

export interface VictoryRules {
  noLegalMoves: boolean;
  noPieces: boolean;
  majorityCapture: boolean;
}

export interface LatrunculiMoveRecord {
  readonly player: Player;
  readonly from: Square;
  readonly to: Square;
  readonly captured: readonly Square[];
}

export const DEFAULT_VICTORY_RULES: Readonly<VictoryRules> = {
  noLegalMoves: true,
  noPieces: true,
  majorityCapture: false,
};

export interface LatrunculiState {
  readonly board: Board;
  readonly turn: Player;
  readonly totalMoves: number;
  readonly survivingPieces: readonly [number, number];
  readonly capturedPieces: readonly [number, number];
  readonly moveHistory: readonly LatrunculiMoveRecord[];
  readonly status: GameStatus;
  readonly winner: Winner;
  readonly gameMode: GameMode;
  readonly victoryRules: Readonly<VictoryRules>;
}

export interface LatrunculiMove {
  readonly from: Square;
  readonly to: Square;
}

export function createLatrunculiState(
  gameMode: GameMode = 'two-player',
  victoryRules: Readonly<VictoryRules> = DEFAULT_VICTORY_RULES,
): LatrunculiState {
  const board: Piece[][] = Array.from({ length: SIZE }, () => Array<Piece>(SIZE).fill(null));
  for (let col = 0; col < SIZE; col++) {
    const firstRow = board[0];
    const secondRow = board[1];
    const penultimateRow = board[SIZE - 2];
    const lastRow = board[SIZE - 1];
    if (firstRow) firstRow[col] = 0;
    if (secondRow) secondRow[col] = 0;
    if (penultimateRow) penultimateRow[col] = 1;
    if (lastRow) lastRow[col] = 1;
  }
  return {
    board,
    turn: 0,
    totalMoves: 0,
    survivingPieces: [INITIAL_ARMY_SIZE, INITIAL_ARMY_SIZE],
    capturedPieces: [0, 0],
    moveHistory: [],
    status: 'active',
    winner: null,
    gameMode,
    victoryRules: { ...victoryRules },
  };
}

const DIRECTIONS: readonly Square[] = [
  [-1, 0],
  [0, -1],
  [0, 1],
  [1, 0],
];

function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < SIZE && col >= 0 && col < SIZE;
}

function otherPlayer(player: Player): Player {
  return player === 0 ? 1 : 0;
}

function squareEquals(a: Square, b: Square): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

export function legalMovesFor(state: LatrunculiState): LatrunculiMove[] {
  if (state.status !== 'active' || state.totalMoves >= MAX_MOVES) return [];

  const moves: LatrunculiMove[] = [];
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (state.board[row]?.[col] !== state.turn) continue;
      for (const [dr, dc] of DIRECTIONS) {
        let nextRow = row + dr;
        let nextCol = col + dc;
        while (inBounds(nextRow, nextCol) && state.board[nextRow]?.[nextCol] === null) {
          moves.push({ from: [row, col], to: [nextRow, nextCol] });
          nextRow += dr;
          nextCol += dc;
        }
      }
    }
  }
  return moves;
}

function applyMoveUnchecked(state: LatrunculiState, move: LatrunculiMove): LatrunculiState {
  const board = state.board.map((row) => [...row]);
  const [fromRow, fromCol] = move.from;
  const [toRow, toCol] = move.to;
  const source = board[fromRow];
  const destination = board[toRow];
  if (!source || !destination) throw new Error('Move coordinates are outside the board.');

  source[fromCol] = null;
  destination[toCol] = state.turn;
  const captures = detectCaptures(board, move, state.turn);
  const boardAfterCapture = removeCapturedPieces(board, captures, state.turn);
  const survivingPieces: [number, number] = [...state.survivingPieces];
  survivingPieces[otherPlayer(state.turn)] -= captures.length;
  const capturedPieces: [number, number] = [...state.capturedPieces];
  capturedPieces[state.turn] += captures.length;

  return {
    ...state,
    board: boardAfterCapture,
    turn: otherPlayer(state.turn),
    totalMoves: state.totalMoves + 1,
    survivingPieces,
    capturedPieces,
    moveHistory: [
      ...state.moveHistory,
      { player: state.turn, from: move.from, to: move.to, captured: captures },
    ],
  };
}

function pieceCounts(board: Board): [number, number] {
  const counts: [number, number] = [0, 0];
  for (const row of board) {
    for (const piece of row) {
      if (piece !== null) counts[piece]++;
    }
  }
  return counts;
}

function completed(state: LatrunculiState, winner: Winner): LatrunculiState {
  return { ...state, status: 'completed', winner };
}

function resolveMoveResult(state: LatrunculiState): LatrunculiState {
  const [first, second] = pieceCounts(state.board);
  if (first === 0 && second === 0) return completed(state, 'draw');
  if (state.victoryRules.noPieces && first === 0) return completed(state, 1);
  if (state.victoryRules.noPieces && second === 0) return completed(state, 0);

  if (state.totalMoves >= MAX_MOVES) return completed(state, 'draw');

  if (state.victoryRules.majorityCapture && state.capturedPieces[0] > INITIAL_ARMY_SIZE / 2) {
    return completed(state, 0);
  }
  if (state.victoryRules.majorityCapture && state.capturedPieces[1] > INITIAL_ARMY_SIZE / 2) {
    return completed(state, 1);
  }

  const currentMoves = legalMovesFor(state);
  if (currentMoves.length === 0 && state.victoryRules.noLegalMoves) {
    return completed(state, otherPlayer(state.turn));
  }

  return state;
}

function winnerOf(state: LatrunculiState): Winner {
  if (state.status === 'completed') return state.winner;
  if (state.victoryRules.noPieces) {
    const [first, second] = pieceCounts(state.board);
    if (first === 0 && second === 0) return 'draw';
    if (first === 0) return 1;
    if (second === 0) return 0;
  }
  if (state.totalMoves >= MAX_MOVES) return 'draw';
  if (state.victoryRules.noLegalMoves && legalMovesFor(state).length === 0) {
    return otherPlayer(state.turn);
  }
  return null;
}

export function resignGame(state: LatrunculiState, player: Player = state.turn): LatrunculiState {
  if (state.status !== 'active') throw new Error('A completed game cannot be resigned.');
  if (player !== state.turn) throw new Error('Only the current player can resign.');
  return completed(state, otherPlayer(player));
}

export const latrunculi: GameEngine<LatrunculiState, LatrunculiMove> = {
  id: 'latrunculi',
  initialState: createLatrunculiState,
  currentPlayer: (state) => state.turn,
  legalMoves: legalMovesFor,
  movesEqual: (a, b) => squareEquals(a.from, b.from) && squareEquals(a.to, b.to),
  applyMove: (state, move) => {
    if (state.status !== 'active') throw new Error('Cannot move after the game is complete.');
    if (
      !legalMovesFor(state).some(
        (candidate) =>
          squareEquals(candidate.from, move.from) && squareEquals(candidate.to, move.to),
      )
    ) {
      throw new Error('Illegal Latrunculi move.');
    }
    return resolveMoveResult(applyMoveUnchecked(state, move));
  },
  isTerminal: (state) => winnerOf(state) !== null,
  winner: winnerOf,
  candidateMoves: (state) => {
    const moves = legalMovesFor(state);
    return moves
      .map((move) => ({
        move,
        captures: getCapturedPieces(state.board, move, state.turn).length,
        center: 7 - Math.abs(3.5 - move.to[0]) - Math.abs(3.5 - move.to[1]),
      }))
      .sort((a, b) => b.captures - a.captures || b.center - a.center)
      .slice(0, 24)
      .map(({ move }) => move);
  },
  orderMoves: (state, moves) =>
    [...moves].sort(
      (a, b) =>
        getCapturedPieces(state.board, b, state.turn).length -
          getCapturedPieces(state.board, a, state.turn).length ||
        7 -
          Math.abs(3.5 - b.to[0]) -
          Math.abs(3.5 - b.to[1]) -
          (7 - Math.abs(3.5 - a.to[0]) - Math.abs(3.5 - a.to[1])),
    ),
};
