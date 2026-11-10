import { Suspense, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Navigate, useParams } from 'react-router-dom';
import Button from '@/components/Button';
import ButtonLink from '@/components/ButtonLink';
import Card from '@/components/Card';
import ScreenHeader from '@/components/ScreenHeader';
import { gameComponents, games } from '@/games/registry';

export default function GameScreen() {
  const { gameId } = useParams();
  const game = games.find((g) => g.id === gameId);
  const [session, setSession] = useState(0);

  if (game && game.status !== 'available') {
    return <Navigate to="/games" replace />;
  }

  if (!game) {
    return (
      <>
        <ScreenHeader title="Game not found" backTo="/games" />
        <p className="text-subtle">
          We couldn't find that game. Head back to the menu to pick another.
        </p>
      </>
    );
  }

  const GameComponent = gameComponents[game.id];
  if (GameComponent) {
    return (
      <div className="flex flex-1 flex-col">
        {game.id !== 'latrunculi' && <ScreenHeader title={game.name} />}
        <Suspense fallback={<p role="status">Loading game…</p>}>
          <GameComponent />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <ScreenHeader title={game.name} />
      <Card
        key={session}
        className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center animate-fade-in"
      >
        <span className="text-6xl" aria-hidden="true">
          {game.icon}
        </span>
        <p className="text-xl font-bold">Game coming soon</p>
        <p className="text-subtle">{game.description}</p>
      </Card>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <ButtonLink to="/games" variant="secondary">
          Back
        </ButtonLink>
        <Button onClick={() => setSession((s) => s + 1)}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Restart
        </Button>
      </div>
    </div>
  );
}
