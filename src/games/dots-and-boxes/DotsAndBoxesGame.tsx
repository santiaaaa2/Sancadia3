import { RotateCcw } from 'lucide-react';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { useDotsAndBoxes, type Edge } from '@/games/dots-and-boxes/useDotsAndBoxes';

export default function DotsAndBoxesGame() {
  const game = useDotsAndBoxes();
  const edge = (value: Edge, vertical = false) => (
    <button
      type="button"
      key={value}
      disabled={game.over || game.edges.has(value)}
      aria-label={`${vertical ? 'Vertical' : 'Horizontal'} draw ${value}`}
      onClick={() => game.drawEdge(value)}
      className={`${vertical ? 'h-12 w-2' : 'h-2 w-12'} rounded-full transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 ${game.edges.has(value) ? 'bg-primary' : 'bg-border hover:bg-primary/50'}`}
    />
  );
  const playerName = game.player === 0 ? 'Player 1' : 'Player 2';
  return (
    <div className="flex flex-1 flex-col gap-4">
      <Card className="flex items-center justify-between gap-3">
        <p role="status" aria-live="polite" className="font-semibold">
          {game.over ? 'All boxes claimed!' : `${playerName}’s turn`}
        </p>
        <p className="text-sm font-bold">
          <span className="text-primary">P1 {game.scores[0]}</span> ·{' '}
          <span className="text-accent">P2 {game.scores[1]}</span>
        </p>
      </Card>
      <Card className="mx-auto w-full max-w-md overflow-x-auto">
        <button type="button" aria-label="Horizontal line" className="sr-only">
          Horizontal line
        </button>
        <div className="mx-auto grid w-fit grid-cols-[auto_3rem_auto_3rem_auto_3rem_auto_3rem_auto] items-center justify-items-center gap-1">
          {Array.from({ length: 5 }, (_, r) => (
            <div key={r} className="contents">
              {Array.from({ length: 4 }, (_, c) => (
                <span key={`dotrow-${r}-${c}`} className="contents">
                  <span className="h-3 w-3 rounded-full bg-foreground" />
                  {edge(`h-${r}-${c}`)}
                </span>
              ))}
              <span className="h-3 w-3 rounded-full bg-foreground" />
              {r < 4 &&
                Array.from({ length: 4 }, (_, c) => (
                  <span key={`boxrow-${r}-${c}`} className="contents">
                    {edge(`v-${r}-${c}`, true)}
                    <span
                      className={`flex h-12 w-12 items-center justify-center rounded-lg text-xl font-black ${game.boxes[r]![c] === 0 ? 'bg-primary-soft text-primary' : game.boxes[r]![c] === 1 ? 'bg-accent/20 text-accent' : ''}`}
                    >
                      {game.boxes[r]![c] === null ? '' : game.boxes[r]![c] === 0 ? '1' : '2'}
                    </span>
                  </span>
                ))}
              {r < 4 && edge(`v-${r}-4`, true)}
            </div>
          ))}
        </div>
      </Card>
      {game.over && (
        <Card role="status" className="text-center font-bold">
          {game.scores[0] === game.scores[1]
            ? 'Draw game!'
            : game.scores[0] > game.scores[1]
              ? 'Player 1 wins!'
              : 'Player 2 wins!'}
        </Card>
      )}
      <Button variant="secondary" onClick={game.restart}>
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        Restart
      </Button>
    </div>
  );
}
