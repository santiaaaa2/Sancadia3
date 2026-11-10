import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import Button from '@/components/Button';
import Card from '@/components/Card';
import GamePreStart from '@/components/GamePreStart';
import GameSettingsButton from '@/components/GameSettingsButton';
import GameOverDialog from '@/components/GameOverDialog';
import PassDeviceScreen from '@/components/PassDeviceScreen';
import PuzzleSetupOptions, { type PuzzlePlayerMode } from '@/components/PuzzleSetupOptions';
import SecretEntry from '@/components/SecretEntry';
import {
  consistentCandidates,
  generateSecret,
  getValidationError,
  scoreGuess,
} from '@/engine/codebreaker/core';
import type {
  CodebreakerConfig,
  CodebreakerGuess,
  ScoreFeedback,
} from '@/engine/codebreaker/types';
import { useFeedback } from '@/hooks/useFeedback';
import { useStats } from '@/hooks/useStats';
import { calculatePuzzlePoints } from '@/lib/points';
import { useSoloSession } from '@/games/useSoloSession';

type Difficulty = 'beginner' | 'professional' | 'expert';
type PlayerMode = PuzzlePlayerMode;
type Stage = 'secret-entry' | 'handoff' | 'playing';
type HistoryEntry = { guess: CodebreakerGuess; feedback: ScoreFeedback };

interface CodebreakerGameProps {
  gameId: string;
  gameName: string;
  difficulty: Difficulty;
  onDifficultyChange: (difficulty: Difficulty) => void;
  config: CodebreakerConfig;
  hints: number;
  symbols: string[];
  showSymbolToggle?: boolean;
}

function feedbackDescription(feedback: ScoreFeedback): string {
  return `${feedback.exact} exact and ${feedback.misplaced} misplaced`;
}

export default function CodebreakerGame({
  gameId,
  gameName,
  difficulty,
  onDifficultyChange,
  config,
  hints,
  symbols,
  showSymbolToggle = false,
}: CodebreakerGameProps) {
  const { place, win, lose } = useFeedback();
  const { recordResult, stats } = useStats();
  const {
    markAttempt,
    recordResult: recordSessionResult,
    restart: restartSession,
  } = useSoloSession();
  const instanceId = useId();
  const resultNumber = useRef(0);
  const [mode, setMode] = useState<PlayerMode>('solo');
  const [started, setStarted] = useState(false);
  const [stage, setStage] = useState<Stage>('playing');
  const [secret, setSecret] = useState<CodebreakerGuess>([]);
  const [secretEntry, setSecretEntry] = useState('');
  const [guess, setGuess] = useState<Array<number | null>>(() =>
    Array.from({ length: config.length }, () => null),
  );
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [hintedPositions, setHintedPositions] = useState<number[]>([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [notes, setNotes] = useState<Record<number, 'unknown' | 'ruled out' | 'likely'>>({});
  const [message, setMessage] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [outcome, setOutcome] = useState<'win' | 'lose'>('win');
  const [points, setPoints] = useState(0);
  const [pointBreakdown, setPointBreakdown] = useState<Array<{ label: string; points: number }>>(
    [],
  );
  const [showLetters, setShowLetters] = useState(true);

  const candidates = useMemo(() => consistentCandidates(config, history), [config, history]);
  const remainingHints = Math.max(0, hints - hintsUsed);

  const formatSymbol = useCallback(
    (value: number) => (showLetters ? (symbols[value] ?? String(value)) : String(value)),
    [showLetters, symbols],
  );

  const freshSecret = useCallback(() => generateSecret(config), [config]);

  const resetRound = useCallback(() => {
    resultNumber.current += 1;
    restartSession();
    setGuess(Array.from({ length: config.length }, () => null));
    setHistory([]);
    setHintedPositions([]);
    setHintsUsed(0);
    setNotes({});
    setMessage('');
    setDialogOpen(false);
    setPoints(0);
    setPointBreakdown([]);
    if (mode === 'solo') {
      setSecret(freshSecret());
      setStage('playing');
    } else {
      setSecret([]);
      setSecretEntry('');
      setStage('secret-entry');
    }
  }, [config.length, freshSecret, mode, restartSession]);

  useEffect(() => {
    resultNumber.current += 1;
    if (mode === 'solo') {
      setSecret(freshSecret());
      setStage('playing');
    } else {
      setSecret([]);
      setSecretEntry('');
      setStage('secret-entry');
    }
    restartSession();
    setGuess(Array.from({ length: config.length }, () => null));
    setHistory([]);
    setHintedPositions([]);
    setHintsUsed(0);
    setNotes({});
    setMessage('');
    setDialogOpen(false);
  }, [config.length, difficulty, freshSecret, mode, restartSession]);

  const pushSymbol = useCallback((value: number) => {
    setGuess((current) => {
      const index = current.findIndex((entry) => entry === null);
      if (index < 0) return current;
      const next = [...current];
      next[index] = value;
      return next;
    });
  }, []);

  const submitGuess = useCallback(() => {
    const currentGuess = guess.filter((value): value is number => value !== null);
    const error = getValidationError(config, currentGuess);
    if (error) {
      setMessage(error);
      return;
    }
    if (secret.length !== config.length) {
      throw new Error('Cannot score a codebreaker round without a complete secret.');
    }

    const feedback = scoreGuess(secret, currentGuess);
    const nextHistory = [...history, { guess: currentGuess, feedback }];
    const won = feedback.exact === config.length;
    const lost = nextHistory.length >= config.maxAttempts;
    setHistory(nextHistory);
    setGuess(Array.from({ length: config.length }, () => null));
    setMessage(
      mode === 'two-player'
        ? `Player 2: ${feedbackDescription(feedback)}.`
        : gameId === 'bullscows'
          ? `Bulls: ${feedback.exact} · Cows: ${feedback.misplaced}`
          : `Feedback: ${feedbackDescription(feedback)}.`,
    );
    place();
    markAttempt();

    if (!won && !lost) return;

    const nextOutcome = won ? 'win' : 'lose';
    setOutcome(nextOutcome);
    setDialogOpen(true);
    if (won) win();
    else lose();

    if (mode === 'two-player') {
      recordSessionResult(won ? 'won' : 'lost');
      recordResult({
        resultId: `${gameId}:${instanceId}:${resultNumber.current}`,
        gameId,
        mode: 'two-player',
        outcome: nextOutcome,
      });
      return;
    }

    recordSessionResult(won ? 'won' : 'lost', () => {
      const currentStreak = stats.games[gameId]?.puzzle[difficulty].currentWinStreak ?? 0;
      const breakdown = calculatePuzzlePoints({
        outcome: nextOutcome,
        difficulty,
        attempts: nextHistory.length,
        maxAttempts: config.maxAttempts,
        hintsUsed,
        winStreak: won ? currentStreak + 1 : 0,
      });
      setPoints(breakdown.total);
      setPointBreakdown([
        { label: 'Base', points: breakdown.base },
        { label: 'Efficiency bonus', points: breakdown.efficiency },
        { label: 'Streak bonus', points: breakdown.streak },
        { label: 'Hints', points: -breakdown.hintCost },
      ]);
      recordResult({
        resultId: `${gameId}:${instanceId}:${resultNumber.current}`,
        gameId,
        mode: 'puzzle',
        difficulty,
        outcome: nextOutcome,
        attempts: nextHistory.length,
        maxAttempts: config.maxAttempts,
        hintsUsed,
      });
    });
  }, [
    difficulty,
    gameId,
    guess,
    hintsUsed,
    history,
    instanceId,
    lose,
    markAttempt,
    mode,
    place,
    recordResult,
    recordSessionResult,
    secret,
    config,
    stats.games,
    win,
  ]);

  const useHint = () => {
    if (remainingHints < 1) {
      setMessage('No hints remaining.');
      return;
    }
    if (
      !candidates.some((candidate) => candidate.every((value, index) => value === secret[index]))
    ) {
      throw new Error('The active secret is inconsistent with the recorded guess history.');
    }

    const availablePositions = Array.from({ length: config.length }, (_, index) => index).filter(
      (index) => !hintedPositions.includes(index),
    );
    const informativePositions = availablePositions.filter((position) => {
      const values = new Set(candidates.map((candidate) => candidate[position]));
      return values.size > 1;
    });
    const position = (
      informativePositions.length > 0 ? informativePositions : availablePositions
    )[0];
    if (position === undefined) {
      setMessage('No unrevealed positions remain.');
      return;
    }
    const value = secret[position];
    if (value === undefined) throw new Error('Hint position is not present in the secret.');
    setGuess((current) => {
      const next = [...current];
      next[position] = value;
      return next;
    });
    setHintedPositions((current) => [...current, position]);
    setHintsUsed((current) => current + 1);
    setMessage(`Hint: position ${position + 1} is ${formatSymbol(value)}.`);
  };

  const removeLastGuess = useCallback(() => {
    setGuess((current) => {
      const next = [...current];
      let index = next.length - 1;
      while (index >= 0 && next[index] === null) index -= 1;
      if (index >= 0 && !hintedPositions.includes(index)) next[index] = null;
      return next;
    });
  }, [hintedPositions]);

  useEffect(() => {
    if (stage !== 'playing' || dialogOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.closest('input, select, textarea, button'))
        return;
      if (event.key === 'Enter') {
        event.preventDefault();
        submitGuess();
        return;
      }
      if (event.key === 'Backspace') {
        event.preventDefault();
        removeLastGuess();
        return;
      }
      const value = symbols.findIndex((symbol) => symbol.toLowerCase() === event.key.toLowerCase());
      if (value >= 0) pushSymbol(value);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialogOpen, pushSymbol, removeLastGuess, stage, submitGuess, symbols]);

  const confirmSecret = () => {
    if (secretEntry.length !== config.length) {
      setMessage(`Enter exactly ${config.length} symbols.`);
      return;
    }
    const nextSecret = [...secretEntry].map((symbol) => symbols.indexOf(symbol));
    const error = getValidationError(config, nextSecret);
    if (error) {
      setMessage(error);
      return;
    }
    setSecret(nextSecret);
    setSecretEntry('');
    setMessage('');
    setStage('handoff');
  };

  if (!started) {
    const modeSummary = mode === 'solo' ? 'Solo' : '2 Players';
    const difficultySummary = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    return (
      <GamePreStart
        gameId={gameId}
        gameName={gameName}
        description={`${modeSummary} mode. ${difficultySummary} difficulty.`}
        onStart={() => setStarted(true)}
      >
        <PuzzleSetupOptions
          difficulty={difficulty}
          mode={mode}
          onDifficultyChange={onDifficultyChange}
          onModeChange={setMode}
        />
      </GamePreStart>
    );
  }

  if (stage === 'secret-entry') {
    return (
      <SecretEntry
        label={`Player 1 secret (${config.length} symbols)`}
        value={secretEntry}
        onChange={(value) => {
          setSecretEntry(value.slice(0, config.length).toUpperCase());
          setMessage('');
        }}
        maxLength={config.length}
        error={message}
        onConfirm={confirmSecret}
      >
        <div className="flex flex-wrap justify-center gap-2">
          {symbols.slice(0, config.symbols).map((symbol) => (
            <Button
              key={symbol}
              aria-label={`Add secret symbol ${symbol}`}
              variant="secondary"
              onClick={() =>
                setSecretEntry((value) => (value.length < config.length ? value + symbol : value))
              }
            >
              {symbol}
            </Button>
          ))}
          <Button
            aria-label="Remove last secret symbol"
            variant="secondary"
            onClick={() => setSecretEntry((value) => value.slice(0, -1))}
          >
            Undo
          </Button>
        </div>
      </SecretEntry>
    );
  }

  if (stage === 'handoff') {
    return (
      <PassDeviceScreen
        title="Pass the device to Player 2"
        description="Tap when ready. Player 1's secret is hidden."
        onContinue={() => setStage('playing')}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Card className="grid gap-3 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="grid gap-1 text-xs font-semibold text-subtle">
            Difficulty
            <select
              className="min-h-10 rounded border border-border bg-surface px-2 text-sm text-primary"
              value={difficulty}
              onChange={(event) => onDifficultyChange(event.target.value as Difficulty)}
            >
              <option value="beginner">Beginner</option>
              <option value="professional">Professional</option>
              <option value="expert">Expert</option>
            </select>
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              aria-pressed={mode === 'solo'}
              variant={mode === 'solo' ? 'primary' : 'secondary'}
              onClick={() => setMode('solo')}
            >
              Solo
            </Button>
            <Button
              aria-pressed={mode === 'two-player'}
              variant={mode === 'two-player' ? 'primary' : 'secondary'}
              onClick={() => setMode('two-player')}
            >
              2 Players
            </Button>
            {history.length === 0 && <GameSettingsButton gameId={gameId} />}
          </div>
          {showSymbolToggle && (
            <label className="flex items-center gap-2 text-sm text-subtle">
              <input
                type="checkbox"
                checked={showLetters}
                onChange={() => setShowLetters((current) => !current)}
              />
              Letter labels
            </label>
          )}
        </div>

        <div className="flex justify-between text-sm text-subtle">
          <span>
            Attempts: {history.length}/{config.maxAttempts}
          </span>
          {mode === 'solo' && <span>Hints remaining: {remainingHints}</span>}
        </div>

        <div
          aria-label="Current guess"
          className="flex min-h-11 items-center justify-center gap-1.5"
          role="group"
        >
          {guess.map((value, index) => (
            <span
              key={`guess-${index}`}
              aria-label={`Guess position ${index + 1}: ${value === null ? 'empty' : formatSymbol(value)}`}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-sm font-bold text-primary sm:h-10 sm:w-10"
            >
              {value === null ? '·' : formatSymbol(value)}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-1.5">
          {symbols.slice(0, config.symbols).map((symbol, index) => (
            <Button
              key={symbol}
              aria-label={`Add ${gameId === 'bullscows' ? 'digit' : 'colour'} ${symbol}`}
              className="min-h-9 min-w-9 px-2 sm:min-h-10 sm:min-w-10"
              variant="secondary"
              onClick={() => pushSymbol(index)}
            >
              {formatSymbol(index)}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button onClick={submitGuess}>Submit guess</Button>
          <Button variant="secondary" onClick={removeLastGuess}>
            Undo
          </Button>
          {mode === 'solo' && (
            <Button variant="secondary" onClick={useHint}>
              Hint
            </Button>
          )}
          <Button variant="secondary" onClick={resetRound}>
            Restart
          </Button>
        </div>
        {message && (
          <p aria-live="polite" className="text-center text-sm text-subtle">
            {message}
          </p>
        )}
      </Card>

      {gameId === 'bullscows' && (
        <Card className="grid gap-2 p-3">
          <h3 className="text-sm font-bold text-primary">Digit notes</h3>
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
            {symbols.slice(0, 10).map((symbol, index) => {
              const status = notes[index] ?? 'unknown';
              const label =
                status === 'unknown' ? 'Unknown' : status === 'likely' ? 'Likely' : 'Ruled out';
              return (
                <button
                  key={symbol}
                  aria-label={`Digit ${symbol}: ${label}. Change note`}
                  className="min-h-10 rounded-lg border border-border bg-surface text-sm font-semibold text-primary"
                  onClick={() =>
                    setNotes((current) => ({
                      ...current,
                      [index]:
                        status === 'unknown'
                          ? 'ruled out'
                          : status === 'ruled out'
                            ? 'likely'
                            : 'unknown',
                    }))
                  }
                  type="button"
                >
                  {symbol} {status === 'unknown' ? '○' : status === 'likely' ? '✓' : '×'}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-subtle">Each digit shows its note label and shape.</p>
        </Card>
      )}

      <Card className="grid gap-2 p-3">
        <h3 className="text-base font-bold text-primary">Guess history</h3>
        {history.length === 0 ? (
          <p className="text-sm text-subtle">No guesses yet.</p>
        ) : (
          history.map((entry, rowIndex) => (
            <div
              key={`history-${rowIndex}`}
              className="flex items-center justify-between gap-2 border-t border-border pt-2"
            >
              <div className="flex gap-1">
                {entry.guess.map((value, index) => (
                  <span
                    key={`peg-${index}`}
                    aria-label={`Guess ${rowIndex + 1}, position ${index + 1}: ${formatSymbol(value)}`}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-surface text-xs font-bold"
                  >
                    {formatSymbol(value)}
                  </span>
                ))}
              </div>
              <p aria-label={feedbackDescription(entry.feedback)} className="text-xs text-subtle">
                {gameId === 'bullscows'
                  ? `Bulls ${entry.feedback.exact} · Cows ${entry.feedback.misplaced}`
                  : `${entry.feedback.exact} filled · ${entry.feedback.misplaced} rings`}
              </p>
              <div
                aria-label={`Feedback: ${feedbackDescription(entry.feedback)}`}
                className="flex gap-1"
              >
                {Array.from(
                  { length: entry.feedback.exact + entry.feedback.misplaced },
                  (_, index) => (
                    <span
                      key={`feedback-${index}`}
                      aria-label={
                        index < entry.feedback.exact
                          ? 'Exact match: filled dot'
                          : 'Misplaced match: ring'
                      }
                      className={`h-3 w-3 rounded-full border-2 ${
                        index < entry.feedback.exact
                          ? 'border-primary bg-primary'
                          : 'border-warning bg-transparent'
                      }`}
                    />
                  ),
                )}
              </div>
            </div>
          ))
        )}
      </Card>

      <GameOverDialog
        open={dialogOpen}
        outcome={outcome}
        headline={outcome === 'win' ? 'Code cracked' : 'Secret revealed'}
        message={
          outcome === 'win'
            ? `${mode === 'two-player' ? 'Player 2' : 'You'} solved it in ${history.length} attempts.`
            : `The secret was ${secret.map(formatSymbol).join(' ')}.`
        }
        pointsEarned={mode === 'solo' ? points : undefined}
        pointsBreakdown={mode === 'solo' ? pointBreakdown : undefined}
        onPlayAgain={resetRound}
        onBackToMenu={() => setDialogOpen(false)}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
}
