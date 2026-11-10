import { RotateCcw } from 'lucide-react';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { useDominoes } from '@/games/dominoes/useDominoes';
import type { DominoSide } from '@/games/dominoes/useDominoes';

function Tile({
  tile,
  onClick,
  label,
}: {
  tile: readonly [number, number];
  onClick?: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      aria-label={label}
      className="flex min-h-11 items-center gap-1 rounded-xl border border-border bg-background px-2 py-1 font-bold shadow-sm transition hover:-translate-y-0.5 disabled:cursor-default disabled:opacity-70"
    >
      <span>{tile[0]}</span>
      <span className="h-6 border-l border-border" />
      <span>{tile[1]}</span>
    </button>
  );
}

export default function DominoesGame() {
  const game = useDominoes();
  const place = (index: number) => {
    const tile = game.hands[0][index];
    if (!tile) return;
    const left = !game.line.length || tile.includes(game.line[0]![0]);
    game.play(index, left ? 'left' : 'right');
  };
  const canDraw =
    game.player === 0 &&
    game.winner === null &&
    game.boneyard.length > 0 &&
    !game.hands[0].some(
      (tile) =>
        !game.line.length ||
        tile.includes(game.line[0]![0]) ||
        tile.includes(game.line[game.line.length - 1]![1]),
    );

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Card className="text-center">
        <p role="status" aria-live="polite" className="font-semibold">
          {game.message}
        </p>
        <p className="mt-1 text-sm text-subtle">
          Your tiles: {game.hands[0].length} · Computer: {game.hands[1].length} · Boneyard:{' '}
          {game.boneyard.length}
        </p>
      </Card>
      <Card className="min-h-28">
        <p className="mb-3 text-sm font-semibold text-subtle">Chain ends</p>
        <div className="flex flex-wrap justify-center gap-2">
          {game.line.length ? (
            game.line.map((tile, index) => (
              <Tile
                key={`${index}-${tile[0]}-${tile[1]}`}
                tile={tile}
                label={`Placed ${tile[0]} and ${tile[1]}`}
              />
            ))
          ) : (
            <p className="text-sm text-subtle">Play any tile to begin.</p>
          )}
        </div>
      </Card>
      <Card>
        <button type="button" aria-label="Play tile" className="sr-only">
          Play tile
        </button>
        <h2 className="mb-3 font-bold">Your hand</h2>
        <div className="flex flex-wrap justify-center gap-2">
          {game.hands[0].map((tile, index) => (
            <Tile
              key={`${index}-${tile[0]}-${tile[1]}`}
              tile={tile}
              label={`Tile ${index + 1}: ${tile[0]} and ${tile[1]}`}
              onClick={() => place(index)}
            />
          ))}
        </div>
        {game.line.length > 0 && game.hands[0].length > 0 && (
          <div className="mt-3 flex justify-center gap-2">
            {(['left', 'right'] as DominoSide[]).map((side) => (
              <span
                key={side}
                className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary"
              >
                Tiles join {side}
              </span>
            ))}
          </div>
        )}
      </Card>
      {canDraw && (
        <Button variant="secondary" onClick={game.draw}>
          Draw tile
        </Button>
      )}
      {game.winner !== null && (
        <Card role="status" className="text-center font-bold">
          {game.winner === 'draw'
            ? 'It’s a draw!'
            : game.winner === 0
              ? 'You win!'
              : 'The computer wins!'}
        </Card>
      )}
      <Button variant="secondary" onClick={game.restart}>
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        New game
      </Button>
    </div>
  );
}
