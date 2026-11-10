import type { LucideIcon } from 'lucide-react';
import { Frown, Minus, Trophy } from 'lucide-react';
import Button from '@/components/Button';
import Dialog from '@/components/Dialog';

export type GameOutcome = 'win' | 'lose' | 'draw';

export interface VictoryPresentation {
  title: string;
  subtitle: string;
  winner: string;
  finalPieces: readonly [number, number];
  totalMoves: number;
  armyNames: readonly [string, string];
}

interface GameOverDialogProps {
  open: boolean;
  outcome: GameOutcome;
  headline: string;
  message: string;
  pointsEarned?: number;
  pointsBreakdown?: Array<{ label: string; points: number }>;
  victoryPresentation?: VictoryPresentation;
  playAgainLabel?: string;
  backToMenuLabel?: string;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
  onClose: () => void;
}

const icons: Record<GameOutcome, LucideIcon> = { win: Trophy, lose: Frown, draw: Minus };

const tones: Record<GameOutcome, string> = {
  win: 'bg-primary-soft text-primary',
  lose: 'bg-danger/10 text-danger',
  draw: 'bg-border text-subtle',
};

export default function GameOverDialog({
  open,
  outcome,
  headline,
  message,
  pointsEarned,
  pointsBreakdown,
  victoryPresentation,
  playAgainLabel = 'Play again',
  backToMenuLabel = 'Back to menu',
  onPlayAgain,
  onBackToMenu,
  onClose,
}: GameOverDialogProps) {
  const Icon = icons[outcome];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={victoryPresentation?.title ?? headline}
      description={victoryPresentation?.subtitle ?? message}
      icon={
        <span
          className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
            victoryPresentation ? 'latrunculi-victory-icon' : tones[outcome]
          }`}
        >
          <Icon className="h-7 w-7" aria-hidden="true" />
        </span>
      }
    >
      {victoryPresentation && (
        <section
          aria-label="Final battle result"
          className="latrunculi-victory-details grid gap-2 rounded-xl p-4 text-sm"
        >
          <p>
            <span className="font-semibold">Winner:</span> {victoryPresentation.winner}
          </p>
          {([0, 1] as const).map((player) => (
            <p key={victoryPresentation.armyNames[player]}>
              <span className="font-semibold">
                {victoryPresentation.armyNames[player]} remaining:
              </span>{' '}
              {victoryPresentation.finalPieces[player]}
            </p>
          ))}
          <p>
            <span className="font-semibold">Total moves:</span> {victoryPresentation.totalMoves}
          </p>
        </section>
      )}
      {pointsEarned !== undefined && (
        <div className="mb-4 text-center">
          <p className="text-lg font-bold text-primary">+{pointsEarned} points</p>
          {pointsBreakdown && (
            <ul className="mt-2 space-y-1 text-sm text-subtle">
              {pointsBreakdown.map(({ label, points }) => (
                <li key={label}>
                  {label}: {points > 0 ? '+' : ''}
                  {points}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <div className="grid gap-3">
        <Button onClick={onPlayAgain}>{playAgainLabel}</Button>
        <Button variant="secondary" onClick={onBackToMenu}>
          {backToMenuLabel}
        </Button>
      </div>
    </Dialog>
  );
}
