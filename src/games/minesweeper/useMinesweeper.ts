import { useCallback, useEffect, useState } from 'react';

export interface MineCell {
  mine: boolean;
  adjacent: number;
  revealed: boolean;
  flagged: boolean;
}
interface MinesweeperState {
  board: MineCell[][];
  started: boolean;
  over: boolean;
  won: boolean;
  seconds: number;
  flags: number;
}
const ROWS = 9;
const COLS = 9;
const MINES = 10;

function blankBoard(): MineCell[][] {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({
      mine: false,
      adjacent: 0,
      revealed: false,
      flagged: false,
    })),
  );
}
function makeBoard(safeRow: number, safeCol: number): MineCell[][] {
  const board = blankBoard();
  const candidates: Array<[number, number]> = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (Math.abs(r - safeRow) > 1 || Math.abs(c - safeCol) > 1) candidates.push([r, c]);
  for (let i = 0; i < MINES; i++) {
    const index = Math.floor(Math.random() * candidates.length);
    const [r, c] = candidates.splice(index, 1)[0]!;
    board[r]![c]!.mine = true;
  }
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      if (board[r]![c]!.mine) continue;
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++)
          if (board[r + dr]?.[c + dc]?.mine) board[r]![c]!.adjacent++;
    }
  return board;
}
function initialGame(): MinesweeperState {
  return { board: blankBoard(), started: false, over: false, won: false, seconds: 0, flags: 0 };
}

export function useMinesweeper() {
  const [game, setGame] = useState(initialGame);
  const reveal = useCallback(
    (row: number, col: number) =>
      setGame((state) => {
        if (state.over || state.board[row]?.[col]?.revealed || state.board[row]?.[col]?.flagged)
          return state;
        const board = state.started
          ? state.board.map((line) => line.map((cell) => ({ ...cell })))
          : makeBoard(row, col);
        const first = board[row]![col]!;
        if (first.mine) {
          first.revealed = true;
          return {
            ...state,
            board: board.map((line) =>
              line.map((cell) => (cell.mine ? { ...cell, revealed: true } : cell)),
            ),
            started: true,
            over: true,
          };
        }
        const stack: Array<[number, number]> = [[row, col]];
        while (stack.length) {
          const [r, c] = stack.pop()!;
          const cell = board[r]?.[c];
          if (!cell || cell.revealed || cell.flagged || cell.mine) continue;
          cell.revealed = true;
          if (cell.adjacent === 0)
            for (let dr = -1; dr <= 1; dr++)
              for (let dc = -1; dc <= 1; dc++)
                if (dr !== 0 || dc !== 0) stack.push([r + dr, c + dc]);
        }
        const revealedSafe = board.flat().filter((cell) => cell.revealed && !cell.mine).length;
        const won = revealedSafe === ROWS * COLS - MINES;
        return { ...state, board, started: true, over: won, won };
      }),
    [],
  );
  const toggleFlag = useCallback(
    (row: number, col: number) =>
      setGame((state) => {
        const cell = state.board[row]?.[col];
        if (state.over || !cell || cell.revealed || (!cell.flagged && state.flags >= MINES))
          return state;
        const board = state.board.map((line) => line.map((item) => ({ ...item })));
        board[row]![col]!.flagged = !cell.flagged;
        return { ...state, board, flags: state.flags + (cell.flagged ? -1 : 1) };
      }),
    [],
  );
  useEffect(() => {
    if (!game.started || game.over) return;
    const timer = window.setInterval(
      () => setGame((state) => ({ ...state, seconds: state.seconds + 1 })),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [game.started, game.over]);
  const restart = useCallback(() => setGame(initialGame()), []);
  return { ...game, rows: ROWS, cols: COLS, mineCount: MINES, reveal, toggleFlag, restart };
}
