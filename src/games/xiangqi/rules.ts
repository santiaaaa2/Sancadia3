import type { GameEngine, Player, Winner } from '@/engine/types';

export type XiangqiPieceType =
  'general' | 'advisor' | 'elephant' | 'horse' | 'chariot' | 'cannon' | 'soldier';

export interface XiangqiPiece {
  type: XiangqiPieceType;
  player: Player;
}

export interface XiangqiMove {
  from: number;
  to: number;
}

export interface PositionRecord {
  position: string;
  mover: Player | null;
  gaveCheck: boolean;
}

export interface XiangqiState {
  board: Array<XiangqiPiece | null>;
  turn: Player;
  plyCount: number;
  noCapturePlies: number;
  history: PositionRecord[];
  lastMove: XiangqiMove | null;
}

export const BOARD_WIDTH = 9;
export const BOARD_HEIGHT = 10;
export const MAX_PLIES = 400;
export const NO_CAPTURE_DRAW_PLIES = 120;
export const XIANGQI_DEPTH_CAPS = { beginner: 2, professional: 4, expert: 6 } as const;

const PIECE_VALUES: Record<XiangqiPieceType, number> = {
  general: 10_000,
  chariot: 900,
  cannon: 450,
  horse: 400,
  advisor: 200,
  elephant: 200,
  soldier: 100,
};

const ORTHOGONAL = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
] as const;
const DIAGONAL = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
] as const;

export function indexOf(row: number, col: number): number {
  return row * BOARD_WIDTH + col;
}

export function coordinatesOf(index: number): { row: number; col: number } {
  return { row: Math.floor(index / BOARD_WIDTH), col: index % BOARD_WIDTH };
}

function isInside(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_HEIGHT && col >= 0 && col < BOARD_WIDTH;
}

function inPalace(player: Player, row: number, col: number): boolean {
  return col >= 3 && col <= 5 && (player === 0 ? row >= 7 : row <= 2);
}

function positionKey(board: Array<XiangqiPiece | null>, turn: Player): string {
  const pieceCodes: Record<XiangqiPieceType, string> = {
    general: 'g',
    advisor: 'a',
    elephant: 'e',
    horse: 'h',
    chariot: 'r',
    cannon: 'c',
    soldier: 's',
  };
  const pieces = board.map((piece) => {
    if (!piece) return '.';
    const side = piece.player === 0 ? 'r' : 'b';
    return `${side}${pieceCodes[piece.type]}`;
  });
  return `${turn}:${pieces.join(',')}`;
}

function repetitionCount(state: XiangqiState): number {
  const key = positionKey(state.board, state.turn);
  return state.history.filter((entry) => entry.position === key).length;
}

function perpetualChecker(state: XiangqiState): Player | null {
  const matching = state.history
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => entry.position === positionKey(state.board, state.turn));
  if (matching.length < 3) return null;
  const firstRepeat = matching[matching.length - 3]?.index ?? 0;
  for (const player of [0, 1] as const) {
    const checks = state.history.slice(firstRepeat + 1).filter((entry) => entry.mover === player);
    if (checks.length > 0 && checks.every((entry) => entry.gaveCheck)) return player;
  }
  return null;
}

function findGeneral(board: Array<XiangqiPiece | null>, player: Player): number | null {
  const index = board.findIndex((piece) => piece?.player === player && piece.type === 'general');
  return index < 0 ? null : index;
}

function addDestination(
  state: XiangqiState,
  from: number,
  row: number,
  col: number,
  moves: XiangqiMove[],
): boolean {
  if (!isInside(row, col)) return false;
  const to = indexOf(row, col);
  const occupant = state.board[to] ?? null;
  if (occupant?.player === state.board[from]?.player) return false;
  moves.push({ from, to });
  return occupant === null;
}

function pseudoMovesForPiece(state: XiangqiState, from: number): XiangqiMove[] {
  const piece = state.board[from];
  if (!piece) return [];
  const { row, col } = coordinatesOf(from);
  const moves: XiangqiMove[] = [];

  switch (piece.type) {
    case 'general':
      for (const [dr, dc] of ORTHOGONAL) {
        const nextRow = row + dr;
        const nextCol = col + dc;
        if (inPalace(piece.player, nextRow, nextCol)) {
          addDestination(state, from, nextRow, nextCol, moves);
        }
      }
      break;
    case 'advisor':
      for (const [dr, dc] of DIAGONAL) {
        const nextRow = row + dr;
        const nextCol = col + dc;
        if (inPalace(piece.player, nextRow, nextCol)) {
          addDestination(state, from, nextRow, nextCol, moves);
        }
      }
      break;
    case 'elephant':
      for (const [dr, dc] of DIAGONAL) {
        const nextRow = row + 2 * dr;
        const nextCol = col + 2 * dc;
        const eye = state.board[indexOf(row + dr, col + dc)] ?? null;
        const staysOnOwnBank = piece.player === 0 ? nextRow >= 5 : nextRow <= 4;
        if (staysOnOwnBank && eye === null) addDestination(state, from, nextRow, nextCol, moves);
      }
      break;
    case 'horse':
      for (const [dr, dc] of ORTHOGONAL) {
        const legRow = row + dr;
        const legCol = col + dc;
        if ((state.board[indexOf(legRow, legCol)] ?? null) !== null) continue;
        const diagonalSteps: Array<[number, number]> =
          dr === 0
            ? [
                [-1, 0],
                [1, 0],
              ]
            : [
                [0, -1],
                [0, 1],
              ];
        for (const [stepRow, stepCol] of diagonalSteps) {
          addDestination(state, from, row + 2 * dr + stepRow, col + 2 * dc + stepCol, moves);
        }
      }
      break;
    case 'chariot':
      for (const [dr, dc] of ORTHOGONAL) {
        for (let distance = 1; ; distance++) {
          const rowAt = row + dr * distance;
          const colAt = col + dc * distance;
          if (!isInside(rowAt, colAt)) break;
          if (!addDestination(state, from, rowAt, colAt, moves)) break;
        }
      }
      break;
    case 'cannon':
      for (const [dr, dc] of ORTHOGONAL) {
        let screenFound = false;
        for (let distance = 1; ; distance++) {
          const rowAt = row + dr * distance;
          const colAt = col + dc * distance;
          if (!isInside(rowAt, colAt)) break;
          const occupant = state.board[indexOf(rowAt, colAt)] ?? null;
          if (!screenFound) {
            if (occupant === null) moves.push({ from, to: indexOf(rowAt, colAt) });
            else screenFound = true;
          } else if (occupant !== null) {
            if (occupant.player !== piece.player) moves.push({ from, to: indexOf(rowAt, colAt) });
            break;
          }
        }
      }
      break;
    case 'soldier': {
      const forward = piece.player === 0 ? -1 : 1;
      addDestination(state, from, row + forward, col, moves);
      const crossedRiver = piece.player === 0 ? row <= 4 : row >= 5;
      if (crossedRiver) {
        addDestination(state, from, row, col - 1, moves);
        addDestination(state, from, row, col + 1, moves);
      }
      break;
    }
  }

  return moves;
}

export function isInCheck(state: XiangqiState, player: Player): boolean {
  const general = findGeneral(state.board, player);
  if (general === null) return true;
  const enemy: Player = player === 0 ? 1 : 0;
  const enemyGeneral = findGeneral(state.board, enemy);
  if (enemyGeneral !== null) {
    const own = coordinatesOf(general);
    const opposing = coordinatesOf(enemyGeneral);
    if (own.col === opposing.col) {
      const step = own.row < opposing.row ? 1 : -1;
      let blocked = false;
      for (let row = own.row + step; row !== opposing.row; row += step) {
        if (state.board[indexOf(row, own.col)] !== null) {
          blocked = true;
          break;
        }
      }
      if (!blocked) return true;
    }
  }
  return state.board.some(
    (piece, from) =>
      piece?.player === enemy &&
      pseudoMovesForPiece(state, from).some((move) => move.to === general),
  );
}

function legalMovesFor(state: XiangqiState, player: Player): XiangqiMove[] {
  const moves: XiangqiMove[] = [];
  state.board.forEach((piece, from) => {
    if (piece?.player !== player) return;
    for (const move of pseudoMovesForPiece(state, from)) {
      if (state.board[move.to]?.type === 'general') continue;
      const board = [...state.board];
      board[move.to] = board[move.from] ?? null;
      board[move.from] = null;
      if (!isInCheck({ ...state, board }, player)) moves.push(move);
    }
  });
  return moves;
}

export function isLegalMove(state: XiangqiState, move: XiangqiMove): boolean {
  return legalMovesFor(state, state.turn).some(
    (candidate) => candidate.from === move.from && candidate.to === move.to,
  );
}

function isDrawByRule(state: XiangqiState): boolean {
  return (
    state.plyCount >= MAX_PLIES ||
    state.noCapturePlies >= NO_CAPTURE_DRAW_PLIES ||
    repetitionCount(state) >= 3
  );
}

export const xiangqi: GameEngine<XiangqiState, XiangqiMove> = {
  id: 'xiangqi',
  initialState() {
    const board: Array<XiangqiPiece | null> = Array.from(
      { length: BOARD_WIDTH * BOARD_HEIGHT },
      () => null,
    );
    const backRow: XiangqiPieceType[] = [
      'chariot',
      'horse',
      'elephant',
      'advisor',
      'general',
      'advisor',
      'elephant',
      'horse',
      'chariot',
    ];
    for (let col = 0; col < BOARD_WIDTH; col++) {
      board[indexOf(0, col)] = { type: backRow[col]!, player: 1 };
      board[indexOf(9, col)] = { type: backRow[col]!, player: 0 };
      if (col % 2 === 0) {
        board[indexOf(3, col)] = { type: 'soldier', player: 1 };
        board[indexOf(6, col)] = { type: 'soldier', player: 0 };
      }
    }
    board[indexOf(2, 1)] = { type: 'cannon', player: 1 };
    board[indexOf(2, 7)] = { type: 'cannon', player: 1 };
    board[indexOf(7, 1)] = { type: 'cannon', player: 0 };
    board[indexOf(7, 7)] = { type: 'cannon', player: 0 };
    return {
      board,
      turn: 0,
      plyCount: 0,
      noCapturePlies: 0,
      history: [{ position: positionKey(board, 0), mover: null, gaveCheck: false }],
      lastMove: null,
    };
  },
  currentPlayer: (state) => state.turn,
  legalMoves(state) {
    if (isDrawByRule(state)) return [];
    return legalMovesFor(state, state.turn);
  },
  applyMove(state, move) {
    const legal = this.legalMoves(state).some(
      (candidate) => candidate.from === move.from && candidate.to === move.to,
    );
    if (!legal) throw new Error('Illegal Xiangqi move.');
    const board = [...state.board];
    const captured = board[move.to] !== null;
    board[move.to] = board[move.from] ?? null;
    board[move.from] = null;
    const turn: Player = state.turn === 0 ? 1 : 0;
    const nextPosition = positionKey(board, turn);
    const nextState: XiangqiState = {
      board,
      turn,
      plyCount: state.plyCount + 1,
      noCapturePlies: captured ? 0 : state.noCapturePlies + 1,
      history: state.history,
      lastMove: { ...move },
    };
    const gaveCheck = isInCheck(nextState, turn);
    nextState.history = [
      ...state.history,
      { position: nextPosition, mover: state.turn, gaveCheck },
    ];
    return nextState;
  },
  isTerminal(state) {
    return this.winner(state) !== null;
  },
  winner(state): Winner {
    if (repetitionCount(state) >= 3) {
      const checker = perpetualChecker(state);
      return checker === null ? 'draw' : checker === 0 ? 1 : 0;
    }
    if (state.plyCount >= MAX_PLIES || state.noCapturePlies >= NO_CAPTURE_DRAW_PLIES) {
      return 'draw';
    }
    if (findGeneral(state.board, state.turn) === null) return state.turn === 0 ? 1 : 0;
    if (legalMovesFor(state, state.turn).length === 0) return state.turn === 0 ? 1 : 0;
    return null;
  },
  movesEqual: (left, right) => left.from === right.from && left.to === right.to,
  orderMoves(state, moves) {
    return [...moves].sort((a, b) => {
      const score = (move: XiangqiMove) => {
        const attacker = state.board[move.from];
        const victim = state.board[move.to];
        const capture =
          attacker && victim ? PIECE_VALUES[victim.type] - PIECE_VALUES[attacker.type] : 0;
        const next = this.applyMove(state, move);
        return capture * 100 + (isInCheck(next, next.turn) ? 1 : 0);
      };
      return score(b) - score(a);
    });
  },
};

export function pieceValue(type: XiangqiPieceType): number {
  return PIECE_VALUES[type];
}

export function getLegalMovesFor(state: XiangqiState, player: Player): XiangqiMove[] {
  return legalMovesFor(state, player);
}
