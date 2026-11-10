import { useRef, type TouchEvent } from 'react';
import { RotateCcw } from 'lucide-react';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { use2048, type MoveDirection } from '@/games/2048/use2048';

const tileTone: Record<number, string> = {
  2: 'bg-primary-soft text-primary',
  4: 'bg-primary/20 text-primary',
  8: 'bg-accent/30 text-foreground',
  16: 'bg-accent/50 text-foreground',
  32: 'bg-danger/20 text-foreground',
  64: 'bg-danger/40 text-foreground',
  128: 'bg-primary text-primary-foreground',
  256: 'bg-primary text-primary-foreground',
  512: 'bg-accent text-foreground',
  1024: 'bg-accent text-foreground',
  2048: 'bg-online-accent text-online-accent-foreground',
};
export default function Game2048() {
  const game = use2048();
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const point = event.touches[0];
    if (point) touch.current = { x: point.clientX, y: point.clientY };
  };
  const onTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (!touch.current) return;
    const point = event.changedTouches[0];
    if (!point) return;
    const dx = point.clientX - touch.current.x;
    const dy = point.clientY - touch.current.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) > 24)
      game.move(
        (Math.abs(dx) > Math.abs(dy)
          ? dx > 0
            ? 'right'
            : 'left'
          : dy > 0
            ? 'down'
            : 'up') as MoveDirection,
      );
    touch.current = null;
  };
  return (
    <div className="flex flex-1 flex-col gap-4">
      <Card className="flex items-center justify-between">
        <p className="font-semibold">
          Score <span className="text-primary">{game.score}</span>
        </p>
        <p className="text-sm font-semibold text-subtle">Best {game.best}</p>
      </Card>
      {game.won && (
        <Card role="status" className="text-center font-bold">
          You reached 2048! Keep going or start fresh.
        </Card>
      )}
      <Card className="mx-auto w-full max-w-md p-2 sm:p-4">
        <div
          role="grid"
          aria-label="2048 game board"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className="grid aspect-square grid-cols-4 gap-2 rounded-2xl bg-border p-2 touch-none"
        >
          {game.board.flatMap((row, r) =>
            row.map((value, c) => (
              <div
                role="gridcell"
                key={`${r}-${c}`}
                aria-label={value ? String(value) : 'empty'}
                className={`flex items-center justify-center rounded-xl text-xl font-black transition-all duration-150 sm:text-2xl ${value ? (tileTone[value] ?? 'bg-primary text-primary-foreground') : 'bg-background'}`}
              >
                {value || ''}
              </div>
            )),
          )}
        </div>
      </Card>
      <div className="grid grid-cols-3 gap-2 sm:mx-auto sm:w-56">
        <span />
        <Button variant="secondary" aria-label="Move up" onClick={() => game.move('up')}>
          ↑
        </Button>
        <span />
        <Button variant="secondary" aria-label="Move left" onClick={() => game.move('left')}>
          ←
        </Button>
        <Button variant="secondary" aria-label="Move down" onClick={() => game.move('down')}>
          ↓
        </Button>
        <Button variant="secondary" aria-label="Move right" onClick={() => game.move('right')}>
          →
        </Button>
      </div>
      <Button variant="secondary" onClick={game.restart}>
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        New game
      </Button>
      {game.over && (
        <Card role="status" className="text-center font-bold">
          No more moves — game over.
        </Card>
      )}
    </div>
  );
}
