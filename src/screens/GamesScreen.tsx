import { useState } from 'react';
import ScreenHeader from '@/components/ScreenHeader';
import GameCard from '@/components/GameCard';
import { getGamesForNation, getGamesForRegion } from '@/games/registry';
import { getNation } from '@/games/nations';
import { useSettings } from '@/hooks/useSettings';

export default function GamesScreen() {
  const { settings, updateSettings } = useSettings();
  const [gameGroup, setGameGroup] = useState<'all' | 'chinese' | 'egyptian'>('all');
  const selectedNation = getNation(settings.nation);
  const nationGames = getGamesForNation(settings.nation);
  const filteredGames =
    gameGroup === 'chinese'
      ? getGamesForRegion('chinese', nationGames)
      : gameGroup === 'egyptian'
        ? getGamesForRegion('egyptian')
        : nationGames;
  const groupTitle =
    gameGroup === 'chinese'
      ? 'Traditional Chinese'
      : gameGroup === 'egyptian'
        ? 'Ancient Egypt'
        : null;

  return (
    <>
      <ScreenHeader title="Choose a game" backTo="/" />
      <div className="grid gap-3 pb-4">
        <div className="flex min-h-11 flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">
            {gameGroup === 'egyptian'
              ? 'Games from Ancient Egypt'
              : `Games from ${selectedNation.name}`}
          </h2>
          {settings.nation !== 'all' && (
            <button
              type="button"
              onClick={() => updateSettings({ nation: 'all' })}
              className="min-h-11 shrink-0 rounded-lg px-2 text-sm font-semibold text-primary underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
            >
              Show all nations
            </button>
          )}
          <label className="flex items-center gap-2 text-sm font-semibold">
            Game group
            <select
              aria-label="Game group"
              className="min-h-11 rounded-xl border border-border bg-background px-2"
              value={gameGroup}
              onChange={(event) => {
                if (
                  event.target.value === 'all' ||
                  event.target.value === 'chinese' ||
                  event.target.value === 'egyptian'
                ) {
                  setGameGroup(event.target.value);
                }
              }}
            >
              <option value="all">All traditions</option>
              <option value="chinese">Traditional Chinese</option>
              <option value="egyptian">Ancient Egypt</option>
            </select>
          </label>
        </div>
        {filteredGames.length > 0 ? (
          <>
            {groupTitle && <h3 className="mt-1 text-base font-bold">{groupTitle}</h3>}
            {filteredGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </>
        ) : (
          <div className="grid gap-3">
            <p className="rounded-2xl bg-surface p-4 text-sm text-subtle ring-1 ring-border">
              No games are listed for this group under {selectedNation.name}.
            </p>
            {settings.nation !== 'all' && (
              <button
                type="button"
                onClick={() => updateSettings({ nation: 'all' })}
                className="min-h-11 justify-self-start rounded-lg px-2 text-sm font-semibold text-primary underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
              >
                Show games from all nations
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
