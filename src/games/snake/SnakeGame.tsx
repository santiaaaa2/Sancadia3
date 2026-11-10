import { useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { useSnake, type Direction } from '@/games/snake/useSnake';

export default function SnakeGame() {
  const game = useSnake();
  const { turn, start, playing, over } = game;

  useEffect(() => {
    const keyDown = (event: KeyboardEvent) => {
      const keys: Record<string, Direction> = {
        ArrowUp: 'up',
        w: 'up',
        ArrowDown: 'down',
        s: 'down',
        ArrowLeft: 'left',
        a: 'left',
        ArrowRight: 'right',
        d: 'right',
      };
      const direction = keys[event.key];
      if (direction) {
        event.preventDefault();
        turn(direction);
        if (!playing && !over) start();
      }
    };
    window.addEventListener('keydown', keyDown);
    return () => window.removeEventListener('keydown', keyDown);
  }, [turn, start, playing, over]);
  const cells = Array.from({ length: game.grid * game.grid }, (_, i) => {
    const x = i % game.grid;
    const y = Math.floor(i / game.grid);
    const isHead = game.snake[0]?.x === x && game.snake[0]?.y === y;
    const isBody = game.snake.some((point, index) => index > 0 && point.x === x && point.y === y);
    const isFood = game.food.x === x && game.food.y === y;
    return (
      <span
        key={i}
        className={`aspect-square rounded-[2px] transition-colors duration-100 ${isHead ? 'bg-primary' : isBody ? 'bg-primary/70' : isFood ? 'bg-danger shadow-[0_0_8px_rgb(var(--color-danger)/0.6)]' : 'bg-background'}`}
      />
    );
  });
  return (
    <div className="flex flex-1 flex-col gap-4">
      <Card className="flex items-center justify-between">
        <p className="font-semibold">
          Score <span className="text-primary">{game.score}</span>
        </p>
        <p role="status" aria-live="polite" className="text-sm text-subtle">
          {game.over
            ? 'Game over — try again!'
            : game.playing
              ? 'Use arrow keys or controls.'
              : 'Press Start to play.'}
        </p>
      </Card>
      <Card className="mx-auto w-full max-w-[28rem] p-2 sm:p-4">
        <div
          role="grid"
          aria-label="Snake game board"
          className="grid aspect-square grid-cols-[repeat(18,minmax(0,1fr))] gap-[2px] rounded-xl bg-border p-1"
        >
          {cells}
        </div>
      </Card>
      <div className="grid grid-cols-3 gap-2 sm:mx-auto sm:w-56">
        <span />
        <Button
          variant="secondary"
          aria-label="Move up"
          onClick={() => {
            game.turn('up');
            if (!game.playing && !game.over) game.start();
          }}
        >
          ↑
        </Button>
        <span />
        <Button
          variant="secondary"
          aria-label="Move left"
          onClick={() => {
            game.turn('left');
            if (!game.playing && !game.over) game.start();
          }}
        >
          ←
        </Button>
        <Button
          variant="secondary"
          aria-label="Move down"
          onClick={() => {
            game.turn('down');
            if (!game.playing && !game.over) game.start();
          }}
        >
          ↓
        </Button>
        <Button
          variant="secondary"
          aria-label="Move right"
          onClick={() => {
            game.turn('right');
            if (!game.playing && !game.over) game.start();
          }}
        >
          →
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button onClick={game.start} disabled={game.playing}>
          {game.over ? 'Play again' : game.playing ? 'Playing…' : 'Start'}
        </Button>
        <Button variant="secondary" onClick={game.restart}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Reset
        </Button>
      </div>
    </div>
  );
}
