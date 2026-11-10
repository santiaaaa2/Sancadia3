import { Gamepad2, LogIn, Play, Settings, Trophy } from 'lucide-react';
import ButtonLink from '@/components/ButtonLink';
import { usePublishedContent } from '@/hooks/usePublishedContent';

const homeContentTypes = ['campaign', 'daily_challenge'] as const;

export default function HomeScreen() {
  const { content, loading, error } = usePublishedContent(homeContentTypes);
  const campaigns = content.filter((item) => item.content_type === 'campaign');
  const challenges = content.filter((item) => item.content_type === 'daily_challenge');

  return (
    <div className="flex flex-1 flex-col justify-between gap-10 py-8">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-primary text-primary-foreground shadow-xl shadow-primary/20">
          <Gamepad2 className="h-12 w-12" strokeWidth={1.75} aria-hidden="true" />
        </div>
        <h1 className="mt-8 text-4xl font-bold tracking-tight">Sancadia</h1>
        <p className="mt-2 text-lg font-medium text-subtle">Board games you love</p>
      </div>
      <div className="grid gap-3">
        <ButtonLink to="/games" className="h-14 text-lg">
          <Play className="h-5 w-5 fill-current" aria-hidden="true" />
          Play
        </ButtonLink>
        <ButtonLink to="/settings" variant="secondary">
          <Settings className="h-5 w-5" aria-hidden="true" />
          Settings
        </ButtonLink>
        <ButtonLink to="/stats" variant="secondary">
          <Trophy className="h-5 w-5" aria-hidden="true" />
          Stats and points
        </ButtonLink>
        <ButtonLink to="/login" variant="secondary">
          <LogIn className="h-5 w-5" aria-hidden="true" />
          Log in / Sign up
        </ButtonLink>
      </div>
      {(loading || error || campaigns.length > 0 || challenges.length > 0) && (
        <section className="grid gap-3" aria-label="Campaigns and daily challenges">
          {error && (
            <p role="status" className="text-sm text-subtle">
              {error}
            </p>
          )}
          {loading && (
            <p role="status" className="text-sm text-subtle">
              Loading events…
            </p>
          )}
          {challenges.map((challenge) => (
            <article
              key={challenge.id}
              className="rounded-3xl bg-surface p-5 shadow-sm ring-1 ring-border"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-primary">
                Daily challenge
              </p>
              <h2 className="mt-1 font-bold">{challenge.title}</h2>
              {challenge.description && (
                <p className="mt-1 text-sm text-subtle">{challenge.description}</p>
              )}
            </article>
          ))}
          {campaigns.map((campaign) => (
            <article
              key={campaign.id}
              className="rounded-3xl bg-surface p-5 shadow-sm ring-1 ring-border"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-primary">Campaign</p>
              <h2 className="mt-1 font-bold">{campaign.title}</h2>
              {campaign.description && (
                <p className="mt-1 text-sm text-subtle">{campaign.description}</p>
              )}
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
