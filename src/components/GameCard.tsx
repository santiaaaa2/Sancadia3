import { BookOpen } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import ReconstructedRulesBadge from '@/components/ReconstructedRulesBadge';
import type { GameInfo } from '@/games/registry';

interface GameCardProps {
  game: GameInfo;
}

const cardBase =
  'relative flex min-h-[8.5rem] items-start rounded-3xl bg-surface p-4 shadow-sm ring-1 ring-border';

function formatPlayers(min: number, max: number) {
  return min === max ? `${min} players` : `${min}–${max} players`;
}

export default function GameCard({ game }: GameCardProps) {
  const navigate = useNavigate();
  const isAvailable = game.status === 'available';

  const content = (
    <>
      <span
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-3xl"
        aria-hidden="true"
      >
        {game.icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-lg font-bold">{game.name}</span>
          {!isAvailable && (
            <span className="shrink-0 rounded-full bg-border px-2 py-0.5 text-xs font-semibold text-subtle">
              Coming soon
            </span>
          )}
        </span>
        <span className="mt-1 block text-sm text-subtle">{game.description}</span>
        <span className="mt-2 block text-xs font-semibold text-subtle">
          {formatPlayers(game.minPlayers, game.maxPlayers)}
        </span>
      </span>
    </>
  );

  return (
    <article className={`${cardBase} ${isAvailable ? '' : 'cursor-not-allowed'}`}>
      {isAvailable ? (
        <Link
          to={`/games/${game.id}`}
          className="flex min-w-0 flex-1 items-center gap-4 rounded-xl pb-12 pr-2 text-left transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 active:scale-[0.98]"
        >
          {content}
        </Link>
      ) : (
        <div aria-disabled="true" className="flex min-w-0 flex-1 items-center gap-4 pb-12 pr-2">
          {content}
        </div>
      )}
      {game.reconstructionNote && (
        <ReconstructedRulesBadge
          gameName={game.name}
          note={game.reconstructionNote}
          className="absolute bottom-2 left-2"
        />
      )}
      <button
        type="button"
        aria-label={`How to play ${game.name}`}
        onClick={(event) => {
          event.stopPropagation();
          event.preventDefault();
          navigate(`/games/${game.id}/rules`);
        }}
        className="absolute bottom-2 right-2 flex h-11 w-11 items-center justify-center rounded-full bg-background text-foreground ring-1 ring-border transition hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
      >
        <BookOpen className="h-5 w-5" aria-hidden="true" />
      </button>
    </article>
  );
}
