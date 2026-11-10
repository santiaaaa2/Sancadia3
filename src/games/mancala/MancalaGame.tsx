import { RotateCcw } from 'lucide-react';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { useMancala } from '@/games/mancala/useMancala';

export default function MancalaGame() {
  const game = useMancala();
  const pitButton = (side: 0 | 1, pit: number) => (
    <button
      type="button"
      key={`${side}-${pit}`}
      disabled={game.over || game.player !== side || game.pits[side][pit] === 0}
      onClick={() => game.sow(pit)}
      aria-label={`Player ${side + 1} pit ${pit + 1}, ${game.pits[side][pit]} stones`}
      className={`relative flex aspect-square min-h-11 items-center justify-center rounded-full border-2 font-black transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 ${game.player === side && !game.over ? 'border-primary bg-primary-soft' : 'border-border bg-background'} ${game.lastSown?.side === side && game.lastSown.pit === pit ? 'scale-110 ring-4 ring-primary/30' : ''} disabled:cursor-default disabled:opacity-80`}
    >
      <span>{game.pits[side][pit]}</span>
      <span className="sr-only">stones</span>
    </button>
  );
  return (
    <div className="flex flex-1 flex-col gap-4">
      <Card className="text-center">
        <p role="status" aria-live="polite" className="font-semibold">
          {game.message}
        </p>
        <p className="mt-1 text-sm text-subtle">
          Land your last stone in your store for another turn.
        </p>
      </Card>
      <Card className="mx-auto w-full max-w-xl">
        <div className="grid grid-cols-[3.5rem_1fr_3.5rem] items-center gap-2 sm:grid-cols-[4.5rem_1fr_4.5rem]">
          <div className="flex h-full flex-col items-center justify-center rounded-2xl bg-primary-soft p-2 text-center">
            <span className="text-xs font-semibold text-subtle">Player 2</span>
            <span className="text-2xl font-black">{game.stores[1]}</span>
          </div>
          <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
            {game.pits[1].map((_, i) => pitButton(1, 5 - i))}
            {game.pits[0].map((_, i) => pitButton(0, i))}
          </div>
          <div className="flex h-full flex-col items-center justify-center rounded-2xl bg-accent/15 p-2 text-center">
            <span className="text-xs font-semibold text-subtle">Player 1</span>
            <span className="text-2xl font-black">{game.stores[0]}</span>
          </div>
        </div>
      </Card>
      {game.over && (
        <Card role="status" className="text-center font-bold">
          {game.stores[0] === game.stores[1]
            ? 'Draw game!'
            : `Player ${game.stores[0] > game.stores[1] ? 1 : 2} wins!`}
        </Card>
      )}
      <Button variant="secondary" onClick={game.restart}>
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        New game
      </Button>
    </div>
  );
}
