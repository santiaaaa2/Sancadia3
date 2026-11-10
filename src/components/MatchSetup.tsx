import { useState } from 'react';
import { Bot, Users } from 'lucide-react';
import Button from '@/components/Button';
import GamePreStart from '@/components/GamePreStart';
import SegmentedControl from '@/components/SegmentedControl';
import { useSettings } from '@/hooks/useSettings';
import { difficultyOptions } from '@/lib/difficultyOptions';
import type { MatchConfig } from '@/games/matchConfig';
import { games } from '@/games/registry';
import { useParams } from 'react-router-dom';

type Opponent = 'computer' | 'two-player';
type Order = 'first' | 'second';

const opponentOptions = [
  { value: 'computer' as const, label: 'vs Computer' },
  { value: 'two-player' as const, label: '2 Players' },
];

const orderOptions = [
  { value: 'first' as const, label: 'Go first' },
  { value: 'second' as const, label: 'Go second' },
];

export default function MatchSetup({ onStart }: { onStart: (config: MatchConfig) => void }) {
  const { settings } = useSettings();
  const { gameId } = useParams();
  const gameName = games.find((game) => game.id === gameId)?.name;
  const localBattle = gameId === 'latrunculi';
  const localModeLabel = localBattle ? 'LOCAL BATTLE' : '2 Players';
  const gameDifficultyOptions = localBattle
    ? difficultyOptions.map((option) => ({
        ...option,
        label:
          option.value === 'beginner'
            ? 'Recruit'
            : option.value === 'professional'
              ? 'Centurion'
              : 'General',
      }))
    : difficultyOptions;
  const [opponent, setOpponent] = useState<Opponent>('computer');
  const [order, setOrder] = useState<Order>('first');
  const [difficulty, setDifficulty] = useState(settings.difficulty);
  const [onlineMessage, setOnlineMessage] = useState('');

  const start = () => {
    if (opponent === 'two-player') {
      onStart({ mode: 'two-player' });
      return;
    }
    onStart({ mode: 'computer', humanFirst: order === 'first', difficulty });
  };

  const onGoLive = () => setOnlineMessage('Online play coming soon');
  const startDescription =
    opponent === 'computer'
      ? `Vs Computer mode. ${gameDifficultyOptions.find((option) => option.value === difficulty)?.label ?? difficulty} difficulty. You go ${order === 'first' ? 'first' : 'second'}.`
      : localBattle
        ? 'LOCAL BATTLE: Player 1 commands the Red Army and Player 2 commands the Blue Army. Take turns on the same device.'
        : `2 Players mode. Computer difficulty ${difficultyOptions.find((option) => option.value === difficulty)?.label ?? difficulty} is selected but not used in 2 Players mode.`;

  return (
    <GamePreStart
      gameId={gameId}
      gameName={gameName}
      description={startDescription}
      onStart={start}
    >
      <div>
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-subtle">
          <Users className="h-4 w-4" aria-hidden="true" />
          Players
        </p>
        <SegmentedControl
          label="Players"
          options={opponentOptions.map((option) =>
            option.value === 'two-player' ? { ...option, label: localModeLabel } : option,
          )}
          value={opponent}
          onChange={setOpponent}
        />
        <Button
          aria-label="GO LIVE — online play"
          className="mt-3 w-full bg-online-accent text-online-accent-foreground shadow-sm hover:brightness-95"
          onClick={onGoLive}
        >
          GO LIVE
        </Button>
        {onlineMessage && (
          <p role="status" className="mt-2 text-sm text-subtle">
            {onlineMessage}
          </p>
        )}
      </div>

      {opponent === 'computer' && (
        <>
          <div>
            <p className="mb-2 text-sm font-semibold text-subtle">Who goes first</p>
            <SegmentedControl
              label="Who goes first"
              options={orderOptions}
              value={order}
              onChange={setOrder}
            />
          </div>
          <div>
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-subtle">
              <Bot className="h-4 w-4" aria-hidden="true" />
              Computer difficulty
            </p>
            <SegmentedControl
              label="Computer difficulty"
              options={gameDifficultyOptions}
              value={difficulty}
              onChange={setDifficulty}
            />
          </div>
        </>
      )}
    </GamePreStart>
  );
}
