import { useMemo, useState } from 'react';
import CodebreakerGame from '@/games/codebreaker/CodebreakerGame';
import { bullsCowsConfigs, type BullsCowsDifficulty } from '@/games/bullscows/config';

const digits = Array.from({ length: 10 }, (_, index) => String(index));

export default function BullsCowsGame() {
  const [difficulty, setDifficulty] = useState<BullsCowsDifficulty>('beginner');
  const { hints, length, maxAttempts } = bullsCowsConfigs[difficulty];
  const config = useMemo(
    () => ({ symbols: 10, length, allowRepeats: false, maxAttempts }),
    [length, maxAttempts],
  );

  return (
    <CodebreakerGame
      gameId="bullscows"
      gameName="Bulls and Cows"
      difficulty={difficulty}
      onDifficultyChange={setDifficulty}
      config={config}
      hints={hints}
      symbols={digits}
    />
  );
}
