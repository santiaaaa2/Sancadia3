import type { Player } from '@/engine/types';
import type { Board, LatrunculiMove, Square } from '@/games/latrunculi/rules';

const DIRECTIONS: readonly Square[] = [
  [-1, 0],
  [0, -1],
  [0, 1],
  [1, 0],
];

function inBounds(board: Board, row: number, col: number): boolean {
  return row >= 0 && row < board.length && col >= 0 && col < (board[row]?.length ?? 0);
}

function otherPlayer(player: Player): Player {
  return player === 0 ? 1 : 0;
}

function isValidMove(board: Board, move: LatrunculiMove, player: Player): boolean {
  const [fromRow, fromCol] = move.from;
  const [toRow, toCol] = move.to;
  if (
    !inBounds(board, fromRow, fromCol) ||
    !inBounds(board, toRow, toCol) ||
    board[fromRow]?.[fromCol] !== player ||
    board[toRow]?.[toCol] !== null ||
    (fromRow !== toRow && fromCol !== toCol)
  ) {
    return false;
  }

  const rowStep = Math.sign(toRow - fromRow);
  const colStep = Math.sign(toCol - fromCol);
  if (rowStep === 0 && colStep === 0) return false;

  for (let row = fromRow + rowStep, col = fromCol + colStep; row !== toRow || col !== toCol;) {
    if (board[row]?.[col] !== null) return false;
    row += rowStep;
    col += colStep;
  }
  return true;
}

function moveOnCopy(board: Board, move: LatrunculiMove, player: Player): Board {
  const movedBoard = board.map((row) => [...row]);
  const [fromRow, fromCol] = move.from;
  const [toRow, toCol] = move.to;
  const sourceRow = movedBoard[fromRow];
  const destinationRow = movedBoard[toRow];
  if (!sourceRow || !destinationRow) return movedBoard;
  sourceRow[fromCol] = null;
  destinationRow[toCol] = player;
  return movedBoard;
}

/** Finds orthogonal sandwich captures around the destination on a board after movement. */
export function detectCaptures(board: Board, move: LatrunculiMove, player: Player): Square[] {
  const captures: Square[] = [];
  for (const [rowStep, colStep] of DIRECTIONS) {
    const enemyRow = move.to[0] + rowStep;
    const enemyCol = move.to[1] + colStep;
    const allyRow = enemyRow + rowStep;
    const allyCol = enemyCol + colStep;
    if (
      inBounds(board, enemyRow, enemyCol) &&
      inBounds(board, allyRow, allyCol) &&
      board[enemyRow]?.[enemyCol] === otherPlayer(player) &&
      board[allyRow]?.[allyCol] === player
    ) {
      captures.push([enemyRow, enemyCol]);
    }
  }
  return captures;
}

/** Removes one piece from a copied board. */
export function capturePiece(board: Board, square: Square, player: Player): Board {
  const [row, col] = square;
  if (!inBounds(board, row, col) || board[row]?.[col] !== otherPlayer(player)) {
    throw new Error('Cannot capture a friendly piece or an empty or out-of-bounds square.');
  }
  const nextBoard = board.map((cells) => [...cells]);
  const targetRow = nextBoard[row];
  if (!targetRow) throw new Error(`Invalid capture row: ${row}`);
  targetRow[col] = null;
  return nextBoard;
}

/** Removes all listed pieces, leaving the input board unchanged. */
export function removeCapturedPieces(
  board: Board,
  captures: readonly Square[],
  player: Player,
): Board {
  return captures.reduce((nextBoard, square) => capturePiece(nextBoard, square, player), board);
}

/** Returns the pieces that would be captured by a valid move without changing the board. */
export function getCapturedPieces(board: Board, move: LatrunculiMove, player: Player): Square[] {
  if (!isValidMove(board, move, player)) return [];
  return detectCaptures(moveOnCopy(board, move, player), move, player);
}
