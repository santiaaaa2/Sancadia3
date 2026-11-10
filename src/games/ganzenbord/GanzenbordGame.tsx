import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import Button from '@/components/Button';
import Card from '@/components/Card';
import {
  BOARD_SIZE,
  createInitialState,
  GOOSE_SPACES,
  isPlayerCount,
  takeTurn,
} from '@/games/ganzenbord/rules';

const PLAYER_COLORS = ['bg-primary', 'bg-danger', 'bg-online-accent', 'bg-accent'];
const PLAYER_TEXT_COLORS = ['text-primary', 'text-danger', 'text-online-accent', 'text-accent'];
const SPACE_LABELS: Record<number, string> = {
  6: 'Bridge: move to 12',
  19: 'Inn: miss one turn',
  31: 'Well: miss two turns',
  42: 'Maze: return to 39',
  52: 'Prison: miss two turns',
  58: 'Death: return to start',
};

export default function GanzenbordGame() {
  const [state, setState] = useState(() => createInitialState());
  const { playerCount, positions, waitTurns, turn, lastRoll, winner, message } = state;

  const startNewGame = (count = playerCount) => {
    if (isPlayerCount(count)) setState(createInitialState(count));
  };

  const rollDie = () => {
    const roll = Math.floor(Math.random() * 6) + 1;
    setState((current) => takeTurn(current, roll));
  };

  const boardSpaces = Array.from({ length: BOARD_SIZE + 1 }, (_, index) => {
    const row = Math.floor(index / 8);
    const offset = index % 8;
    const column = row % 2 === 0 ? offset : 7 - offset;
    return { number: index, row, column };
  });

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <p role="status" aria-live="polite" className={`font-semibold ${PLAYER_TEXT_COLORS[turn]}`}>
          {winner === null ? message : `Player ${winner + 1} wins!`}
        </p>
        <label className="flex items-center gap-2 text-sm font-semibold">
          Players
          <select
            aria-label="Number of players"
            className="min-h-11 rounded-xl border border-border bg-background px-2"
            value={playerCount}
            disabled={winner !== null}
            onChange={(event) => {
              const count = Number(event.target.value);
              if (isPlayerCount(count)) startNewGame(count);
            }}
          >
            {[2, 3, 4].map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
        </label>
      </Card>

      <Card>
        <div
          role="grid"
          aria-label="Ganzenbord board"
          className="mx-auto grid aspect-square w-full max-w-xl grid-cols-8 grid-rows-8 gap-1"
        >
          {boardSpaces.map(({ number, row, column }) => {
            const occupants = positions.flatMap((position, player) =>
              position === number ? [player] : [],
            );
            const specialLabel =
              number === 0
                ? 'Start'
                : number === BOARD_SIZE
                  ? 'Finish'
                  : (SPACE_LABELS[number] ??
                    (GOOSE_SPACES.has(number) ? 'Goose: move forward again' : undefined));

            return (
              <div
                key={number}
                role="gridcell"
                aria-label={`Space ${number}${specialLabel ? `, ${specialLabel}` : ''}${occupants.length ? `, Player ${occupants.map((player) => player + 1).join(' and ')}` : ''}`}
                className={`flex min-w-0 flex-col items-center justify-center rounded-lg border border-border p-0.5 text-center text-xs ${specialLabel ? 'bg-primary/10 font-bold' : 'bg-background'}`}
                style={{ gridRow: row + 1, gridColumn: column + 1 }}
              >
                <span>{number === 0 ? 'Start' : number}</span>
                {specialLabel && number !== 0 && number !== BOARD_SIZE && (
                  <span className="hidden text-[9px] leading-tight text-subtle sm:block">
                    {GOOSE_SPACES.has(number) ? 'Goose' : specialLabel.split(':')[0]}
                  </span>
                )}
                <span className="mt-0.5 flex min-h-2 flex-wrap justify-center gap-0.5">
                  {occupants.map((player) => (
                    <span
                      key={player}
                      aria-hidden="true"
                      className={`h-2 w-2 rounded-full ${PLAYER_COLORS[player]}`}
                    />
                  ))}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Button onClick={rollDie} disabled={winner !== null}>
          Roll die{lastRoll === null ? '' : ` · Last: ${lastRoll}`}
        </Button>
        <Button variant="secondary" onClick={() => startNewGame()}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          New game
        </Button>
      </div>

      <Card>
        <h2 className="mb-3 font-bold">Players</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {positions.map((position, player) => (
            <div
              key={player}
              className={`rounded-xl bg-background p-3 text-center ring-1 ring-border ${player === turn && winner === null ? 'ring-2 ring-primary' : ''}`}
            >
              <p className={`font-bold ${PLAYER_TEXT_COLORS[player]}`}>Player {player + 1}</p>
              <p className="mt-1 text-sm text-subtle">
                {position === 0 ? 'Start' : `Space ${position}`}
                {(waitTurns[player] ?? 0) > 0 && ` · ${waitTurns[player]} turn(s) waiting`}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
