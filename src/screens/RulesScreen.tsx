import { Navigate, useNavigate, useParams } from 'react-router-dom';
import Button from '@/components/Button';
import ButtonLink from '@/components/ButtonLink';
import ScreenHeader from '@/components/ScreenHeader';
import { games } from '@/games/registry';
import { getRulesContent } from '@/games/rulesContent';

function ConnectFourDirections() {
  return (
    <figure className="grid justify-items-center gap-2 rounded-2xl bg-surface p-4 ring-1 ring-border">
      <svg
        aria-labelledby="connect-four-directions-title connect-four-directions-description"
        className="h-28 w-full max-w-56 text-primary"
        role="img"
        viewBox="0 0 160 100"
      >
        <title id="connect-four-directions-title">Four ways to connect four</title>
        <desc id="connect-four-directions-description">
          Lines can run horizontally, vertically, diagonally up, or diagonally down.
        </desc>
        <defs>
          <marker
            id="connect-four-arrow"
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L6,3 L0,6" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </marker>
        </defs>
        <g fill="none" markerEnd="url(#connect-four-arrow)" stroke="currentColor" strokeWidth="3">
          <path d="M15 50 H145" />
          <path d="M80 90 V10" />
          <path d="M20 85 L140 15" />
          <path d="M20 15 L140 85" />
        </g>
      </svg>
      <figcaption className="text-center text-sm text-foreground">
        Four in a row can be horizontal, vertical, or diagonal in either direction.
      </figcaption>
    </figure>
  );
}

export default function RulesScreen() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const game = games.find((item) => item.id === gameId);
  const rules = gameId ? getRulesContent(gameId) : undefined;

  if (!game || !rules) return <Navigate to="/games" replace />;

  const comingSoon = game.status === 'coming-soon';

  return (
    <>
      <ScreenHeader title={`${rules.title} Rules`} backTo="/games" />
      <div className="grid gap-4 pb-6">
        <section aria-labelledby="rules-goal" className="grid gap-2">
          <h2 id="rules-goal" className="text-lg font-bold">
            Goal
          </h2>
          <p className="text-base leading-relaxed text-foreground">{rules.goal}</p>
        </section>
        <section aria-labelledby="rules-setup" className="grid gap-2">
          <h2 id="rules-setup" className="text-lg font-bold">
            Setup
          </h2>
          <p className="text-base leading-relaxed text-foreground">{rules.setup}</p>
        </section>
        <section aria-labelledby="rules-how-to-play" className="grid gap-2">
          <h2 id="rules-how-to-play" className="text-lg font-bold">
            How to play
          </h2>
          <ol className="list-decimal space-y-2 pl-6 text-base leading-relaxed text-foreground">
            {rules.howToPlay.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
        {game.id === 'connect-4' && <ConnectFourDirections />}
        <section aria-labelledby="rules-winning" className="grid gap-2">
          <h2 id="rules-winning" className="text-lg font-bold">
            Winning
          </h2>
          <p className="text-base leading-relaxed text-foreground">{rules.winning}</p>
        </section>
        <section aria-labelledby="rules-special" className="grid gap-2">
          <h2 id="rules-special" className="text-lg font-bold">
            Special rules
          </h2>
          <ul className="list-disc space-y-2 pl-6 text-base leading-relaxed text-foreground">
            {rules.specialRules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="rules-difficulty" className="grid gap-2">
          <h2 id="rules-difficulty" className="text-lg font-bold">
            Difficulty notes
          </h2>
          <dl className="grid gap-2">
            {(
              [
                ['beginner', 'Beginner'],
                ['professional', 'Professional'],
                ['expert', 'Expert'],
              ] as const
            ).map(([level, label]) => (
              <div key={level} className="rounded-xl bg-surface p-3 ring-1 ring-border">
                <dt className="font-semibold">{label}</dt>
                <dd className="mt-1 text-base leading-relaxed text-subtle">
                  {rules.difficultyNotes[level]}
                </dd>
              </div>
            ))}
          </dl>
        </section>
        <section aria-labelledby="rules-tips" className="grid gap-2">
          <h2 id="rules-tips" className="text-lg font-bold">
            Tips
          </h2>
          <ul className="list-disc space-y-2 pl-6 text-base leading-relaxed text-foreground">
            {rules.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </section>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <ButtonLink to="/games" variant="secondary">
            Back to games
          </ButtonLink>
          {comingSoon ? (
            <Button
              disabled
              aria-describedby="rules-play-coming-soon"
              className="flex-wrap px-2 text-sm leading-tight"
            >
              <span>Play</span>
              <span id="rules-play-coming-soon" className="text-sm">
                Coming soon
              </span>
            </Button>
          ) : (
            <Button onClick={() => navigate(`/games/${game.id}`)}>Play</Button>
          )}
        </div>
      </div>
    </>
  );
}
