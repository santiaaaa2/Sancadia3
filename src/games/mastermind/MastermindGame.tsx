import { useMemo, useState } from 'react';
import CodebreakerGame from '@/games/codebreaker/CodebreakerGame';
import { mastermindConfigs, type MastermindDifficulty } from '@/games/mastermind/config';

const colors = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export default function MastermindGame() {
  const [difficulty, setDifficulty] = useState<MastermindDifficulty>('beginner');
  const config = useMemo(() => {
    const source = mastermindConfigs[difficulty];
    return {
      symbols: source.symbols,
      length: source.length,
      allowRepeats: source.allowRepeats,
      maxAttempts: source.maxAttempts,
    };
  }, [difficulty]);
  const hints = mastermindConfigs[difficulty].hints;

  return (
    <CodebreakerGame
      gameId="mastermind"
      gameName="Mastermind"
      difficulty={difficulty}
      onDifficultyChange={setDifficulty}
      config={config}
      hints={hints}
      symbols={colors}
      showSymbolToggle
    />
  );
}
