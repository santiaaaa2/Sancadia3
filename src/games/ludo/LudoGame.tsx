import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { useLudo } from '@/games/ludo/useLudo';

const playerTones = ['text-primary', 'text-danger', 'text-online-accent', 'text-accent'];
const tokenTones = ['bg-primary', 'bg-danger', 'bg-online-accent', 'bg-accent'];

export default function LudoGame() {
  const game = useLudo();
  const [playerCount, setPlayerCount] = useState(2);
  const [selectedToken, setSelectedToken] = useState<number | null>(null);
  const activeTokens = game.tokens[game.turn] ?? [];
  const selectToken = (index: number) => {
    if (game.dice === null) return;
    const position = activeTokens[index] ?? -1;
    if (position === -1 && game.dice !== 6) return;
    if (position >= 0 && position + game.dice > 57) return;
    game.moveToken(index);
    setSelectedToken(index);
  };
  const restart = () => {
    game.start(playerCount);
    setSelectedToken(null);
  };
  const spaces = Array.from({ length: 52 }, (_, i) => i);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <p role="status" aria-live="polite" className={`font-semibold ${playerTones[game.turn]}`}>
          {game.message}
        </p>
        <label className="flex items-center gap-2 text-sm font-semibold">
          Players
          <select
            aria-label="Number of players"
            className="min-h-11 rounded-xl border border-border bg-background px-2"
            value={playerCount}
            onChange={(event) => {
              const count = Number(event.target.value);
              setPlayerCount(count);
              game.start(count);
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
      <Card className="mx-auto w-full max-w-md">
        <div className="relative mx-auto aspect-square w-full max-w-80 rounded-full border-[10px] border-border bg-background shadow-inner">
          {spaces.map((space) => {
            const angle = (space / 52) * Math.PI * 2 - Math.PI / 2;
            const x = 50 + Math.cos(angle) * 43;
            const y = 50 + Math.sin(angle) * 43;
            const occupants = game.tokens.flatMap((tokens, player) =>
              tokens
                .filter(
                  (position) =>
                    position >= 0 && position < 52 && (player * 13 + position) % 52 === space,
                )
                .map(() => player),
            );
            const startPlayer = [0, 13, 26, 39].indexOf(space);
            return (
              <span
                key={space}
                aria-label={`Track space ${space + 1}${occupants.length ? `, ${occupants.length} token${occupants.length > 1 ? 's' : ''}` : ''}`}
                className={`absolute flex h-[5.5%] w-[5.5%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[8px] font-bold ${startPlayer >= 0 ? `${tokenTones[startPlayer]} ring-2 ring-current` : 'bg-surface text-subtle'}`}
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                {occupants.length
                  ? occupants.map((player, index) => (
                      <span
                        key={`${player}-${index}`}
                        className={`h-2 w-2 rounded-full ${tokenTones[player]}`}
                      />
                    ))
                  : null}
              </span>
            );
          })}
          <div className="absolute inset-[34%] flex flex-col items-center justify-center rounded-full bg-surface text-center">
            <span className="text-3xl" aria-hidden="true">
              {game.dice === null ? '🎲' : game.dice}
            </span>
            <span className="text-xs font-bold">Home</span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {game.tokens.map((tokens, player) => (
            <div
              key={player}
              className={`rounded-xl bg-background p-2 ring-1 ring-border ${player === game.turn ? 'ring-2 ring-primary' : ''}`}
            >
              <p className={`mb-1 text-center text-xs font-bold ${playerTones[player]}`}>
                Player {player + 1}
              </p>
              <div className="flex justify-center gap-1">
                {tokens.map((position, token) => (
                  <button
                    type="button"
                    key={token}
                    disabled={
                      player !== game.turn ||
                      game.dice === null ||
                      (position === -1 && game.dice !== 6) ||
                      (position >= 0 && position + game.dice > 57)
                    }
                    onClick={() => player === game.turn && selectToken(token)}
                    aria-label={`Player ${player + 1} token ${token + 1}, ${position < 0 ? 'in yard' : position === 57 ? 'home' : `progress ${position}`}`}
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black text-white transition-transform hover:scale-110 disabled:opacity-50 ${tokenTones[player]} ${position < 0 ? 'opacity-50' : ''}`}
                  >
                    {position === 57 ? '✓' : position < 0 ? '·' : position}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={game.roll}
          disabled={game.rolling || game.dice !== null || game.winner !== null}
        >
          {game.rolling ? 'Rolling…' : 'Roll die'}
        </Button>
        <Button variant="secondary" onClick={restart}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          New game
        </Button>
      </div>
      {game.winner !== null && (
        <Card
          role="status"
          className="text-center text-lg font-bold"
        >{`Player ${game.winner + 1} wins!`}</Card>
      )}
      {selectedToken !== null && (
        <p className="sr-only" aria-live="polite">
          Token {selectedToken + 1} moved.
        </p>
      )}
    </div>
  );
}
