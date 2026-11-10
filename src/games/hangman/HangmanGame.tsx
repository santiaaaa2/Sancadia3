import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import Button from '@/components/Button';
import Card from '@/components/Card';
import GamePreStart from '@/components/GamePreStart';
import GameOverDialog from '@/components/GameOverDialog';
import PassDeviceScreen from '@/components/PassDeviceScreen';
import PuzzleSetupOptions, { type PuzzlePlayerMode } from '@/components/PuzzleSetupOptions';
import SecretEntry from '@/components/SecretEntry';
import type { Difficulty } from '@/engine/difficulty';
import { useFeedback } from '@/hooks/useFeedback';
import { useStats } from '@/hooks/useStats';
import { calculatePuzzlePoints } from '@/lib/points';
import { useSoloSession } from '@/games/useSoloSession';
import { guessLetter, maskedWord, status } from '@/games/hangman/rules';
import { beginnerWords, expertWords, professionalWords } from '@/games/hangman/words';
import { pickHangmanWord } from '@/games/hangman/wordPicker';

type PlayerMode = PuzzlePlayerMode;
type Stage = 'secret-entry' | 'handoff' | 'playing';

const settings: Record<
  Difficulty,
  { maxWrong: number; words: string[]; minLength: number; maxLength: number; hints: number }
> = {
  beginner: { maxWrong: 8, words: beginnerWords, minLength: 4, maxLength: 6, hints: 1 },
  professional: {
    maxWrong: 6,
    words: professionalWords,
    minLength: 6,
    maxLength: 9,
    hints: 1,
  },
  expert: { maxWrong: 5, words: expertWords, minLength: 8, maxLength: 12, hints: 0 },
};

export default function HangmanGame() {
  const { place, win, lose } = useFeedback();
  const { recordResult, stats } = useStats();
  const {
    markAttempt,
    recordResult: recordSessionResult,
    restart: restartSession,
  } = useSoloSession();
  const instanceId = useId();
  const resultNumber = useRef(0);
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');
  const [mode, setMode] = useState<PlayerMode>('solo');
  const [started, setStarted] = useState(false);
  const [stage, setStage] = useState<Stage>('playing');
  const [word, setWord] = useState(() => pickHangmanWord('beginner'));
  const [secretEntry, setSecretEntry] = useState('');
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [outcome, setOutcome] = useState<'win' | 'lose'>('win');
  const [hintsUsed, setHintsUsed] = useState(0);
  const [message, setMessage] = useState('');
  const [points, setPoints] = useState(0);
  const [pointBreakdown, setPointBreakdown] = useState<Array<{ label: string; points: number }>>(
    [],
  );

  const config = settings[difficulty];
  const wrongCount = guessedLetters.filter((letter) => !word.includes(letter)).length;
  const gameState = useMemo(
    () => ({ word, guessedLetters, wrongCount, maxWrong: config.maxWrong }),
    [config.maxWrong, guessedLetters, word, wrongCount],
  );
  const mask = maskedWord(gameState);
  const usedLetters = new Set(guessedLetters);

  const beginNextRound = useCallback(() => {
    resultNumber.current += 1;
    restartSession();
    setGuessedLetters([]);
    setHintsUsed(0);
    setMessage('');
    setShowDialog(false);
    setPoints(0);
    setPointBreakdown([]);
    if (mode === 'solo') {
      setWord(pickHangmanWord(difficulty));
      setStage('playing');
    } else {
      setSecretEntry('');
      setStage('secret-entry');
    }
  }, [difficulty, mode, restartSession]);

  useEffect(() => {
    resultNumber.current += 1;
    restartSession();
    setGuessedLetters([]);
    setHintsUsed(0);
    setMessage('');
    setShowDialog(false);
    setPoints(0);
    setPointBreakdown([]);
    if (mode === 'solo') {
      setWord(pickHangmanWord(difficulty));
      setStage('playing');
    } else {
      setSecretEntry('');
      setStage('secret-entry');
    }
  }, [difficulty, mode, restartSession]);

  const finishRound = useCallback(
    (nextGuesses: string[], result: 'won' | 'lost', roundHintsUsed = hintsUsed) => {
      const nextOutcome = result === 'won' ? 'win' : 'lose';
      setOutcome(nextOutcome);
      setShowDialog(true);
      if (result === 'won') win();
      else lose();

      if (mode === 'two-player') {
        recordSessionResult(result);
        recordResult({
          resultId: `hangman:${instanceId}:${resultNumber.current}`,
          gameId: 'hangman',
          mode: 'two-player',
          outcome: nextOutcome,
        });
        return;
      }

      recordSessionResult(result, () => {
        const currentStreak = stats.games.hangman?.puzzle[difficulty].currentWinStreak ?? 0;
        const breakdown = calculatePuzzlePoints({
          outcome: nextOutcome,
          difficulty,
          attempts: Math.max(1, nextGuesses.length),
          maxAttempts: 26,
          hintsUsed: roundHintsUsed,
          winStreak: result === 'won' ? currentStreak + 1 : 0,
        });
        setPoints(breakdown.total);
        setPointBreakdown([
          { label: 'Base', points: breakdown.base },
          { label: 'Efficiency bonus', points: breakdown.efficiency },
          { label: 'Streak bonus', points: breakdown.streak },
          { label: 'Hints', points: -breakdown.hintCost },
        ]);
        recordResult({
          resultId: `hangman:${instanceId}:${resultNumber.current}`,
          gameId: 'hangman',
          mode: 'puzzle',
          difficulty,
          outcome: nextOutcome,
          attempts: Math.max(1, nextGuesses.length),
          maxAttempts: 26,
          hintsUsed: roundHintsUsed,
        });
      });
    },
    [
      difficulty,
      hintsUsed,
      instanceId,
      lose,
      mode,
      recordResult,
      recordSessionResult,
      stats.games.hangman?.puzzle,
      win,
    ],
  );

  const chooseLetter = useCallback(
    (letter: string, roundHintsUsed = hintsUsed) => {
      const next = guessLetter(gameState, letter);
      if (next.guessedLetters.length === guessedLetters.length) return;
      setGuessedLetters(next.guessedLetters);
      setMessage(`${maskedWord(next)}. ${next.wrongCount} of ${next.maxWrong} wrong guesses.`);
      markAttempt();
      place();
      const nextStatus = status(next);
      if (nextStatus !== 'playing') finishRound(next.guessedLetters, nextStatus, roundHintsUsed);
    },
    [finishRound, gameState, guessedLetters.length, hintsUsed, markAttempt, place],
  );

  useEffect(() => {
    if (stage !== 'playing' || showDialog) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLElement &&
        event.target.closest('input, select, textarea, button')
      ) {
        return;
      }
      if (/^[a-z]$/i.test(event.key)) chooseLetter(event.key);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [chooseLetter, showDialog, stage]);

  const confirmSecret = () => {
    const normalized = secretEntry.trim().toLowerCase();
    if (!/^[a-z]+$/.test(normalized)) {
      setMessage('Use letters a-z only.');
      return;
    }
    if (normalized.length < config.minLength || normalized.length > config.maxLength) {
      setMessage(`Use a word from ${config.minLength} to ${config.maxLength} letters.`);
      return;
    }
    setWord(normalized);
    setSecretEntry('');
    setMessage('');
    setStage('handoff');
  };

  const revealLetter = () => {
    if (hintsUsed >= config.hints) {
      setMessage('No reveals available at this difficulty.');
      return;
    }
    const hidden = [...new Set(word.split('').filter((letter) => !usedLetters.has(letter)))];
    const letter = hidden[0];
    if (!letter) {
      setMessage('No hidden letters remain.');
      return;
    }
    const nextHintsUsed = hintsUsed + 1;
    setHintsUsed(nextHintsUsed);
    chooseLetter(letter, nextHintsUsed);
  };

  if (!started) {
    const modeSummary = mode === 'solo' ? 'Solo' : '2 Players';
    const difficultySummary = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    return (
      <GamePreStart
        gameId="hangman"
        gameName="Hangman"
        description={`${modeSummary} mode. ${difficultySummary} difficulty.`}
        onStart={() => setStarted(true)}
      >
        <PuzzleSetupOptions
          difficulty={difficulty}
          mode={mode}
          onDifficultyChange={setDifficulty}
          onModeChange={setMode}
        />
      </GamePreStart>
    );
  }

  if (stage === 'secret-entry') {
    return (
      <SecretEntry
        label="Player 1 secret word"
        value={secretEntry}
        onChange={(value) => {
          setSecretEntry(value);
          setMessage('');
        }}
        maxLength={config.maxLength}
        error={message}
        onConfirm={confirmSecret}
      />
    );
  }

  if (stage === 'handoff') {
    return (
      <PassDeviceScreen
        title="Pass the device to Player 2"
        description="Tap when ready. Player 1's word is hidden."
        onContinue={() => setStage('playing')}
      />
    );
  }

  const drawingStage = Math.ceil((wrongCount * 10) / config.maxWrong);
  const letters = Array.from({ length: 26 }, (_, index) => String.fromCharCode(97 + index));

  return (
    <div className="flex flex-col gap-3">
      <Card className="grid gap-3 p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="grid gap-1 text-xs font-semibold text-subtle">
            Difficulty
            <select
              className="min-h-10 rounded border border-border bg-surface px-2 text-sm text-primary"
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value as Difficulty)}
            >
              <option value="beginner">Beginner</option>
              <option value="professional">Professional</option>
              <option value="expert">Expert</option>
            </select>
          </label>
          <div className="flex gap-2">
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
          </div>
          <span className="text-sm text-subtle">
            Wrong: {wrongCount}/{config.maxWrong}
          </span>
        </div>

        <svg
          aria-label={`Hangman drawing, ${wrongCount} of ${config.maxWrong} wrong guesses`}
          className="mx-auto h-40 w-full max-w-[280px]"
          role="img"
          viewBox="0 0 220 220"
        >
          <g stroke="currentColor" strokeWidth="6" strokeLinecap="round" className="text-primary">
            {drawingStage >= 1 && <line x1="30" y1="180" x2="180" y2="180" />}
            {drawingStage >= 2 && <line x1="50" y1="180" x2="50" y2="30" />}
            {drawingStage >= 3 && <line x1="50" y1="30" x2="130" y2="30" />}
            {drawingStage >= 4 && <line x1="130" y1="30" x2="130" y2="50" />}
            {drawingStage >= 5 && <circle cx="130" cy="70" r="20" />}
            {drawingStage >= 6 && <line x1="130" y1="90" x2="130" y2="130" />}
            {drawingStage >= 7 && <line x1="130" y1="100" x2="100" y2="120" />}
            {drawingStage >= 8 && <line x1="130" y1="100" x2="160" y2="120" />}
            {drawingStage >= 9 && <line x1="130" y1="130" x2="110" y2="165" />}
            {drawingStage >= 10 && <line x1="130" y1="130" x2="150" y2="165" />}
          </g>
        </svg>

        <div
          aria-label={`Masked word: ${mask}`}
          className="flex min-h-10 flex-wrap justify-center gap-1"
          role="group"
        >
          {word.split('').map((letter, index) => (
            <span
              key={`slot-${index}`}
              className="flex h-9 min-w-7 items-center justify-center border-b-2 border-primary px-1 text-xl font-bold text-primary"
            >
              {usedLetters.has(letter) ? letter.toUpperCase() : '_'}
            </span>
          ))}
        </div>
        <p aria-live="polite" className="sr-only">
          {message || `${mask}. ${wrongCount} of ${config.maxWrong} wrong guesses.`}
        </p>

        <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-9">
          {letters.map((letter) => {
            const used = usedLetters.has(letter);
            const correct = word.includes(letter);
            return (
              <Button
                key={letter}
                aria-label={`${letter.toUpperCase()}${used ? (correct ? ', correct' : ', incorrect') : ''}`}
                className="min-h-9 min-w-0 px-1"
                disabled={used}
                variant={used ? 'secondary' : 'primary'}
                onClick={() => chooseLetter(letter)}
              >
                {letter.toUpperCase()}
                {used && <span aria-hidden="true">{correct ? ' ✓' : ' ×'}</span>}
              </Button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button disabled={config.hints === 0 || hintsUsed >= config.hints} onClick={revealLetter}>
            Reveal a letter ({Math.max(0, config.hints - hintsUsed)})
          </Button>
          <Button variant="secondary" onClick={beginNextRound}>
            Restart
          </Button>
        </div>
        {message && <p className="text-center text-sm text-subtle">{message}</p>}
      </Card>

      <GameOverDialog
        open={showDialog}
        outcome={outcome}
        headline={outcome === 'win' ? 'You solved it!' : 'Word revealed'}
        message={outcome === 'win' ? `The word was ${word}.` : `The hidden word was ${word}.`}
        pointsEarned={mode === 'solo' ? points : undefined}
        pointsBreakdown={mode === 'solo' ? pointBreakdown : undefined}
        onPlayAgain={beginNextRound}
        onBackToMenu={() => setShowDialog(false)}
        onClose={() => setShowDialog(false)}
      />
    </div>
  );
}
