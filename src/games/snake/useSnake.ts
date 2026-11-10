import { useCallback, useEffect, useRef, useState } from 'react';

export type Direction = 'up' | 'down' | 'left' | 'right';
export interface Point {
  x: number;
  y: number;
}
interface SnakeState {
  snake: Point[];
  food: Point;
  direction: Direction;
  score: number;
  playing: boolean;
  over: boolean;
}
const GRID = 18;
const initialSnake: Point[] = [
  { x: 8, y: 9 },
  { x: 7, y: 9 },
  { x: 6, y: 9 },
];
const opposite: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};
const vector: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

function randomFood(snake: Point[]): Point {
  let point: Point;
  do {
    point = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
  } while (snake.some((segment) => segment.x === point.x && segment.y === point.y));
  return point;
}
function createGame(): SnakeState {
  return {
    snake: initialSnake.map((point) => ({ ...point })),
    food: { x: 12, y: 9 },
    direction: 'right',
    score: 0,
    playing: false,
    over: false,
  };
}

export function useSnake() {
  const [game, setGame] = useState(createGame);
  const directionRef = useRef<Direction>('right');
  const turn = useCallback((direction: Direction) => {
    if (direction !== opposite[directionRef.current]) directionRef.current = direction;
    setGame((state) => ({ ...state, direction }));
  }, []);
  const start = useCallback(() => {
    directionRef.current = 'right';
    setGame((state) =>
      state.over ? { ...createGame(), playing: true } : { ...state, playing: true },
    );
  }, []);
  const restart = useCallback(() => {
    directionRef.current = 'right';
    setGame(createGame());
  }, []);

  useEffect(() => {
    if (!game.playing || game.over) return;
    const timer = window.setInterval(() => {
      setGame((state) => {
        const direction = directionRef.current;
        const delta = vector[direction];
        const head = { x: state.snake[0]!.x + delta.x, y: state.snake[0]!.y + delta.y };
        const ate = head.x === state.food.x && head.y === state.food.y;
        const body = ate ? state.snake : state.snake.slice(0, -1);
        const collision =
          head.x < 0 ||
          head.x >= GRID ||
          head.y < 0 ||
          head.y >= GRID ||
          body.some((point) => point.x === head.x && point.y === head.y);
        if (collision) return { ...state, playing: false, over: true };
        const snake = [head, ...state.snake.slice(0, ate ? undefined : -1)];
        return {
          ...state,
          snake,
          food: ate ? randomFood(snake) : state.food,
          score: state.score + (ate ? 10 : 0),
          direction,
        };
      });
    }, 150);
    return () => window.clearInterval(timer);
  }, [game.playing, game.over]);

  return { ...game, grid: GRID, turn, start, restart };
}
