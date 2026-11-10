import { describe, expect, it } from 'vitest';
import {
  capturePiece,
  detectCaptures,
  getCapturedPieces,
  removeCapturedPieces,
} from '@/games/latrunculi/capture';
import { latrunculi, SIZE, type LatrunculiMove, type Piece } from '@/games/latrunculi/rules';

function emptyBoard(): Piece[][] {
  return Array.from({ length: SIZE }, () => Array<Piece>(SIZE).fill(null));
}

function movePiece(board: Piece[][], move: LatrunculiMove, player: 0 | 1): Piece[][] {
  const next = board.map((row) => [...row]);
  const [fromRow, fromCol] = move.from;
  const [toRow, toCol] = move.to;
  const sourceRow = next[fromRow];
  const targetRow = next[toRow];
  if (!sourceRow || !targetRow) throw new Error('Invalid test move.');
  sourceRow[fromCol] = null;
  targetRow[toCol] = player;
  return next;
}

describe('LATRUNCULI capture mechanics', () => {
  it('detects a horizontal custodial capture', () => {
    const board = emptyBoard();
    const row = board[3];
    if (row) {
      row[1] = 0;
      row[3] = 1;
      row[4] = 0;
    }
    const move = { from: [3, 1], to: [3, 2] } as const;

    expect(getCapturedPieces(board, move, 0)).toEqual([[3, 3]]);
    expect(detectCaptures(movePiece(board, move, 0), move, 0)).toEqual([[3, 3]]);
  });

  it('detects a vertical custodial capture', () => {
    const board = emptyBoard();
    const sourceRow = board[1];
    const middleRow = board[3];
    const farRow = board[4];
    if (sourceRow) sourceRow[2] = 0;
    if (middleRow) middleRow[2] = 1;
    if (farRow) farRow[2] = 0;
    const move = { from: [1, 2], to: [2, 2] } as const;

    expect(getCapturedPieces(board, move, 0)).toEqual([[3, 2]]);
  });

  it('captures multiple enemies in one move', () => {
    const board = emptyBoard();
    const sourceRow = board[3];
    const above = board[2];
    const below = board[4];
    if (sourceRow) {
      sourceRow[0] = 0;
      sourceRow[4] = 1;
      sourceRow[5] = 0;
    }
    if (above) {
      above[3] = 1;
      const upperAlly = board[1];
      if (upperAlly) upperAlly[3] = 0;
    }
    if (below) {
      below[3] = 1;
      const lowerAlly = board[5];
      if (lowerAlly) lowerAlly[3] = 0;
    }
    const move = { from: [3, 0], to: [3, 3] } as const;

    expect(getCapturedPieces(board, move, 0)).toEqual([
      [2, 3],
      [3, 4],
      [4, 3],
    ]);

    const next = latrunculi.applyMove(
      { ...latrunculi.initialState(), board, survivingPieces: [2, 1] },
      move,
    );
    expect(next.board[2]?.[3]).toBeNull();
    expect(next.board[3]?.[4]).toBeNull();
    expect(next.board[4]?.[3]).toBeNull();
    expect(next.board[3]?.[3]).toBe(0);
  });

  it('does not capture diagonal, unbracketed, or invalid-move pieces', () => {
    const board = emptyBoard();
    const sourceRow = board[2];
    const diagonalRow = board[1];
    if (sourceRow) sourceRow[2] = 0;
    if (diagonalRow) diagonalRow[3] = 1;
    const diagonalMove = { from: [2, 2], to: [2, 3] } as const;

    expect(getCapturedPieces(board, diagonalMove, 0)).toEqual([]);
    expect(getCapturedPieces(board, { from: [2, 2], to: [3, 3] }, 0)).toEqual([]);
    expect(getCapturedPieces(board, { from: [2, 2], to: [2, 2] }, 0)).toEqual([]);
  });

  it('does not treat a board edge as the second capturing piece', () => {
    const board = emptyBoard();
    const top = board[0];
    const source = board[1];
    if (top) {
      top[1] = 0;
      top[2] = 1;
    }
    if (source) source[0] = 0;

    expect(getCapturedPieces(board, { from: [1, 0], to: [0, 0] }, 0)).toEqual([]);
  });

  it('removes one or many captured pieces on a copy of the board', () => {
    const board = emptyBoard();
    const row = board[3];
    if (row) {
      row[2] = 1;
      row[4] = 1;
    }

    const oneRemoved = capturePiece(board, [3, 2], 0);
    const allRemoved = removeCapturedPieces(
      board,
      [
        [3, 2],
        [3, 4],
      ],
      0,
    );

    expect(board[3]?.[2]).toBe(1);
    expect(oneRemoved[3]?.[2]).toBeNull();
    expect(allRemoved[3]?.[2]).toBeNull();
    expect(allRemoved[3]?.[4]).toBeNull();
    expect(() => capturePiece(board, [3, 2], 1)).toThrow();
    expect(() => capturePiece(board, [3, 3], 0)).toThrow();
  });
});
