import Button from '@/components/Button';
import type { Difficulty } from '@/engine/difficulty';

export type PuzzlePlayerMode = 'solo' | 'two-player';

interface PuzzleSetupOptionsProps {
  difficulty: Difficulty;
  mode: PuzzlePlayerMode;
  onDifficultyChange: (difficulty: Difficulty) => void;
  onModeChange: (mode: PuzzlePlayerMode) => void;
}

export default function PuzzleSetupOptions({
  difficulty,
  mode,
  onDifficultyChange,
  onModeChange,
}: PuzzleSetupOptionsProps) {
  return (
    <>
      <label className="grid gap-1 text-sm font-semibold text-subtle">
        Difficulty
        <select
          aria-label="Difficulty"
          className="min-h-11 rounded-xl border border-border bg-background px-3 text-base text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
          value={difficulty}
          onChange={(event) => onDifficultyChange(event.target.value as Difficulty)}
        >
          <option value="beginner">Beginner</option>
          <option value="professional">Professional</option>
          <option value="expert">Expert</option>
        </select>
      </label>
      <fieldset className="grid gap-2">
        <legend className="text-sm font-semibold text-subtle">Players</legend>
        <div className="grid grid-cols-2 gap-2">
          <Button
            aria-pressed={mode === 'solo'}
            variant={mode === 'solo' ? 'primary' : 'secondary'}
            onClick={() => onModeChange('solo')}
          >
            Solo
          </Button>
          <Button
            aria-pressed={mode === 'two-player'}
            variant={mode === 'two-player' ? 'primary' : 'secondary'}
            onClick={() => onModeChange('two-player')}
          >
            2 Players
          </Button>
        </div>
      </fieldset>
    </>
  );
}
