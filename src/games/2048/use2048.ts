import { useCallback, useEffect, useState } from 'react';

export type MoveDirection = 'left' | 'right' | 'up' | 'down';
export type Board2048 = number[][];
interface Game2048State {
  board: Board2048;
  score: number;
  best: number;
  over: boolean;
  won: boolean;
}

function addTile(board: Board2048): Board2048 {
  const empty: Array<[number, number]> = [];
  board.forEach((row, r) =>
    row.forEach((value, c) => {
      if (!value) empty.push([r, c]);
    }),
  );
  if (!empty.length) return board;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)]!;
  const next = board.map((row) => [...row]);
  const targetRow = next[r];
  if (!targetRow) return board;
  targetRow[c] = Math.random() < 0.9 ? 2 : 4;
  return next;
}
export function slide(
  board: Board2048,
  direction: MoveDirection,
): { board: Board2048; gained: number } {
  let gained = 0;
  const next = board.map((row) => [...row]);
  for (let line = 0; line < 4; line++) {
    const coords: Array<[number, number]> = Array.from({ length: 4 }, (_, i) =>
      direction === 'left'
        ? [line, i]
        : direction === 'right'
          ? [line, 3 - i]
          : direction === 'up'
            ? [i, line]
            : [3 - i, line],
    );
    const values = coords.map(([r, c]) => board[r]?.[c] ?? 0).filter((value) => value !== 0);
    const merged: number[] = [];
    for (let i = 0; i < values.length; i++) {
      if (values[i] === values[i + 1]) {
        const value = (values[i] ?? 0) * 2;
        merged.push(value);
        gained += value;
        i++;
      } else merged.push(values[i] ?? 0);
    }
    coords.forEach(([r, c], i) => {
      const row = next[r];
      if (!row) return;
      row[c] = merged[i] ?? 0;
    });
  }
  return { board: next, gained };
}
function possible(board: Board2048): boolean {
  if (board.some((row) => row.includes(0))) return true;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const current = board[r]?.[c];
      if (current === undefined) continue;
      if ((c < 3 && current === board[r]?.[c + 1]) || (r < 3 && current === board[r + 1]?.[c]))
        return true;
    }
  }
  return false;
}
function createGame(best = 0): Game2048State {
  const empty = Array.from({ length: 4 }, () => Array(4).fill(0));
  return { board: addTile(addTile(empty)), score: 0, best, over: false, won: false };
}

export function use2048() {
  const [game, setGame] = useState(createGame);
  const move = useCallback(
    (direction: MoveDirection) =>
      setGame((state) => {
        if (state.over) return state;
        const result = slide(state.board, direction);
        if (result.board.every((row, r) => row.every((v, c) => v === state.board[r]?.[c])))
          return state;
        const board = addTile(result.board);
        const score = state.score + result.gained;
        return {
          board,
          score,
          best: Math.max(state.best, score),
          over: !possible(board),
          won: state.won || board.some((row) => row.includes(2048)),
        };
      }),
    [],
  );
  const restart = useCallback(() => setGame((state) => createGame(state.best)), []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const map: Record<string, MoveDirection> = {
        ArrowLeft: 'left',
        ArrowRight: 'right',
        ArrowUp: 'up',
        ArrowDown: 'down',
      };
      const direction = map[event.key];
      if (direction) {
        event.preventDefault();
        move(direction);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [move]);
  return { ...game, move, restart };
}
