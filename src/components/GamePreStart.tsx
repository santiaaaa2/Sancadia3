import type { ReactNode } from 'react';
import Button from '@/components/Button';
import Card from '@/components/Card';
import GameRulesButton from '@/components/GameRulesButton';
import GameSettingsButton from '@/components/GameSettingsButton';

interface GamePreStartProps {
  gameId?: string;
  gameName?: string;
  description: string;
  onStart: () => void;
  children: ReactNode;
}

export default function GamePreStart({
  gameId,
  gameName,
  description,
  onStart,
  children,
}: GamePreStartProps) {
  const descriptionId = 'game-start-description';

  return (
    <div className="flex flex-1 flex-col gap-3">
      <Button aria-describedby={descriptionId} className="min-h-11 w-full" onClick={onStart}>
        Start game
      </Button>
      <span id={descriptionId} className="sr-only">
        {description}
      </span>
      <Card data-testid="game-setup-card" className="grid gap-6">
        {children}
      </Card>
      {gameId && gameName && (
        <div className="mt-auto grid grid-cols-2 gap-3">
          <GameRulesButton gameId={gameId} gameName={gameName} className="w-full px-2" />
          <GameSettingsButton gameId={gameId} className="w-full px-2" />
        </div>
      )}
    </div>
  );
}
