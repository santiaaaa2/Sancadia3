import { RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import Button from '@/components/Button';
import Card from '@/components/Card';

const SLOT_VALUES = [2, 3, 4, 1] as const;
const DISCS_PER_ROUND = 30;
const ROUND_COUNT = 3;

function calculateRoundScore(slotCounts: number[]) {
  const setBonus = slotCounts.every((count) => count > 0) ? 20 : 0;
  const valueTotal = slotCounts.reduce(
    (total, count, index) => total + count * (SLOT_VALUES[index] ?? 0),
    0,
  );
  return valueTotal + setBonus;
}

export default function SjoelenGame() {
  const [round, setRound] = useState(0);
  const [slotCounts, setSlotCounts] = useState<number[]>([0, 0, 0, 0]);
  const [shotsTaken, setShotsTaken] = useState(0);
  const [roundScores, setRoundScores] = useState<number[]>([0, 0, 0]);
  const [gameComplete, setGameComplete] = useState(false);

  const currentRoundScore = useMemo(() => calculateRoundScore(slotCounts), [slotCounts]);
  const totalProgressScore = useMemo(
    () => roundScores.reduce((sum, score) => sum + score, 0) + currentRoundScore,
    [currentRoundScore, roundScores],
  );
  const shotsRemaining = DISCS_PER_ROUND - shotsTaken;

  const finishRound = (nextCounts: number[]) => {
    const completedScore = calculateRoundScore(nextCounts);
    setRoundScores((previous) => {
      const next = [...previous];
      const roundIndex = Math.min(round, ROUND_COUNT - 1);
      next[roundIndex] = completedScore;
      return next;
    });

    if (round >= ROUND_COUNT - 1) {
      setGameComplete(true);
      return;
    }

    setRound((current) => current + 1);
    setSlotCounts([0, 0, 0, 0]);
    setShotsTaken(0);
  };

  const resetGame = () => {
    setRound(0);
    setSlotCounts([0, 0, 0, 0]);
    setShotsTaken(0);
    setRoundScores([0, 0, 0]);
    setGameComplete(false);
  };

  const throwDisc = (slotIndex: number) => {
    if (gameComplete || shotsTaken >= DISCS_PER_ROUND) return;

    const nextCounts = [...slotCounts];
    const landsInTarget = Math.random() < 0.78;

    if (landsInTarget) {
      const currentLaneCount = nextCounts[slotIndex] ?? 0;
      nextCounts[slotIndex] = currentLaneCount + 1;
    }

    const nextShotsTaken = shotsTaken + 1;
    setSlotCounts(nextCounts);
    setShotsTaken(nextShotsTaken);

    if (nextShotsTaken >= DISCS_PER_ROUND) {
      finishRound(nextCounts);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Card className="text-center">
        <p role="status" aria-live="polite" className="font-semibold">
          {gameComplete
            ? `Final score: ${roundScores.reduce((sum, score) => sum + score, 0)}`
            : `Round ${round + 1} of ${ROUND_COUNT} · ${shotsRemaining} discs left`}
        </p>
        <p className="mt-1 text-sm text-subtle">
          {gameComplete
            ? 'Three rounds complete. Reset to play again.'
            : `Current round score: ${currentRoundScore} · Total score: ${totalProgressScore}`}
        </p>
      </Card>

      <Card className="mx-auto w-full max-w-xl">
        <div className="mb-3 flex items-center justify-between text-sm font-semibold text-subtle">
          <span>Board</span>
          <span>4 lanes · 30 discs</span>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {SLOT_VALUES.map((value, index) => (
            <div key={value} className="rounded-2xl border border-border bg-background p-3 text-center">
              <div className="mb-2 text-xs font-bold uppercase tracking-wide text-subtle">
                Slot {value}
              </div>
              <div className="mb-3 text-3xl font-black text-primary">{slotCounts[index] ?? 0}</div>
              <div className="text-xs text-subtle">{value} points</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 font-bold">Throw a disc</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SLOT_VALUES.map((value, index) => (
            <Button
              key={value}
              onClick={() => throwDisc(index)}
              disabled={gameComplete || shotsRemaining === 0}
              aria-label={`Throw disc at slot ${value}`}
              className="justify-center text-sm"
            >
              Slot {value}
            </Button>
          ))}
        </div>
      </Card>

      <Card className="space-y-2">
        <h2 className="font-bold">Round totals</h2>
        <div className="grid grid-cols-3 gap-2 text-sm">
          {roundScores.map((score, index) => (
            <div key={index} className="rounded-xl bg-surface p-2 text-center ring-1 ring-border">
              <div className="font-semibold text-subtle">Round {index + 1}</div>
              <div className="mt-1 text-lg font-black text-primary">{score}</div>
            </div>
          ))}
        </div>
      </Card>

      <Button variant="secondary" onClick={resetGame}>
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        New game
      </Button>
    </div>
  );
}
