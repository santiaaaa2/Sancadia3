import { describe, expect, it } from 'vitest';
import { slide } from '@/games/2048/use2048';

const empty = () => Array.from({ length: 4 }, () => Array(4).fill(0));

describe('2048 tile movement', () => {
  it('merges each pair once and reports points', () => {
    const board = empty();
    board[0] = [2, 2, 2, 2];
    const result = slide(board, 'left');

    expect(result.board[0]).toEqual([4, 4, 0, 0]);
    expect(result.gained).toBe(8);
  });

  it('moves and merges vertically in the chosen direction', () => {
    const board = empty();
    board[0]![0] = 2;
    board[1]![0] = 2;
    const result = slide(board, 'down');

    expect(result.board.map((row) => row[0])).toEqual([0, 0, 0, 4]);
    expect(result.gained).toBe(4);
  });

  it('does not mutate the input board', () => {
    const board = empty();
    board[0] = [2, 0, 2, 0];
    const before = board.map((row) => [...row]);

    slide(board, 'right');

    expect(board).toEqual(before);
  });
});
