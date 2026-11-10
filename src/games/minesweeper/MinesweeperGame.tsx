import { useState } from 'react';
import { Flag, RotateCcw } from 'lucide-react';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { useMinesweeper } from '@/games/minesweeper/useMinesweeper';

const numberTones: Record<number, string> = {
  1: 'text-primary',
  2: 'text-online-accent',
  3: 'text-danger',
  4: 'text-accent',
  5: 'text-danger',
  6: 'text-online-accent',
  7: 'text-foreground',
  8: 'text-subtle',
};
export default function MinesweeperGame() {
  const game = useMinesweeper();
  const [flagMode, setFlagMode] = useState(false);
  const revealCell = (row: number, col: number) =>
    flagMode ? game.toggleFlag(row, col) : game.reveal(row, col);
  return (
    <div className="flex flex-1 flex-col gap-4">
      <Card className="flex items-center justify-between gap-2">
        <p className="font-semibold">
          <span aria-label="Mines remaining">{game.mineCount - game.flags}</span> mines
        </p>
        <p role="status" aria-live="polite" className="text-sm font-semibold">
          {game.won
            ? 'You cleared the field!'
            : game.over
              ? 'Boom! Game over.'
              : game.started
                ? `Time ${game.seconds}s`
                : 'Find every safe square.'}
        </p>
        <p className="text-sm font-semibold text-subtle">{game.seconds}s</p>
      </Card>
      <Card className="mx-auto w-full max-w-[25rem] p-2 sm:p-4">
        <div role="grid" aria-label="Minesweeper board" className="grid grid-cols-9 gap-1">
          {game.board.flatMap((line, r) =>
            line.map((cell, c) => (
              <button
                key={`${r}-${c}`}
                type="button"
                role="gridcell"
                aria-label={`Row ${r + 1}, column ${c + 1}${cell.revealed ? (cell.mine ? ', mine' : cell.adjacent ? `, ${cell.adjacent} adjacent mines` : ', empty') : cell.flagged ? ', flagged' : ', hidden'}`}
                onClick={() => revealCell(r, c)}
                onContextMenu={(event) => {
                  event.preventDefault();
                  game.toggleFlag(r, c);
                }}
                disabled={game.over || cell.revealed}
                className={`flex aspect-square min-h-7 items-center justify-center rounded-md text-sm font-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${cell.revealed ? (cell.mine ? 'bg-danger text-white' : 'bg-border/70') : 'bg-primary-soft hover:bg-primary/25'} ${numberTones[cell.adjacent] ?? ''}`}
              >
                {cell.revealed ? (
                  cell.mine ? (
                    '✹'
                  ) : (
                    cell.adjacent || ''
                  )
                ) : cell.flagged ? (
                  <Flag className="h-4 w-4 text-danger" aria-hidden="true" />
                ) : (
                  ''
                )}
              </button>
            )),
          )}
        </div>
      </Card>
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant={flagMode ? 'primary' : 'secondary'}
          aria-pressed={flagMode}
          onClick={() => setFlagMode((value) => !value)}
        >
          <Flag className="h-4 w-4" aria-hidden="true" />
          {flagMode ? 'Flag mode on' : 'Flag mode'}
        </Button>
        <Button variant="secondary" onClick={game.restart}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          New board
        </Button>
      </div>
    </div>
  );
}
