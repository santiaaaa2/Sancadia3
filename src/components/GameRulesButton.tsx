import { BookOpen } from 'lucide-react';
import ButtonLink from '@/components/ButtonLink';

export default function GameRulesButton({
  gameId,
  gameName,
  className,
}: {
  gameId: string;
  gameName: string;
  className?: string;
}) {
  return (
    <ButtonLink
      to={`/games/${gameId}/rules`}
      variant="secondary"
      aria-label={`How to play ${gameName}`}
      className={className}
    >
      <BookOpen className="h-4 w-4" aria-hidden="true" />
      Rules
    </ButtonLink>
  );
}
