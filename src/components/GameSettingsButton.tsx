import { Settings } from 'lucide-react';
import ButtonLink from '@/components/ButtonLink';

export default function GameSettingsButton({
  gameId,
  className,
}: {
  gameId: string;
  className?: string;
}) {
  return (
    <ButtonLink
      to={`/games/${gameId}/settings`}
      variant="secondary"
      aria-label="Game settings"
      className={className}
    >
      <Settings className="h-4 w-4" aria-hidden="true" />
      Game settings
    </ButtonLink>
  );
}
