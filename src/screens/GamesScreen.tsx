import ScreenHeader from '@/components/ScreenHeader';
import GameCard from '@/components/GameCard';
import { getGamesForNation } from '@/games/registry';
import { getNation } from '@/games/nations';
import { useSettings } from '@/hooks/useSettings';

export default function GamesScreen() {
  const { settings, updateSettings } = useSettings();
  const selectedNation = getNation(settings.nation);
  const filteredGames = getGamesForNation(settings.nation);

  return (
    <>
      <ScreenHeader title="Choose a game" backTo="/" />
      <div className="grid gap-3 pb-4">
        <div className="flex min-h-11 items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Games from {selectedNation.name}</h2>
          {settings.nation !== 'all' && (
            <button
              type="button"
              onClick={() => updateSettings({ nation: 'all' })}
              className="min-h-11 shrink-0 rounded-lg px-2 text-sm font-semibold text-primary underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
            >
              Show all
            </button>
          )}
        </div>
        {filteredGames.length > 0 ? (
          filteredGames.map((game) => <GameCard key={game.id} game={game} />)
        ) : (
          <p className="rounded-2xl bg-surface p-4 text-sm text-subtle ring-1 ring-border">
            No games are available for {selectedNation.name} yet. Choose another nation or show all
            games.
          </p>
        )}
      </div>
    </>
  );
}
