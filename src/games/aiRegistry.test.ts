import { describe, expect, it } from 'vitest';
import type { DifficultyCaps } from '@/engine/difficulty';
import { createWorkerAiEntry } from '@/games/aiRegistry';

interface FakeState {
  turn: 0 | 1;
}

const fakeEngine = {
  id: 'fake-search-override',
  initialState: (): FakeState => ({ turn: 0 }),
  currentPlayer: (state: FakeState) => state.turn,
  legalMoves: () => ['advance'],
  applyMove: (state: FakeState) => ({ turn: (1 - state.turn) as 0 | 1 }),
  isTerminal: () => false,
  winner: () => null,
};

const caps: DifficultyCaps = {
  maxDepthCap: { beginner: 1, professional: 2, expert: 3 },
  timeLimitMs: 1250,
};

describe('worker AI search overrides', () => {
  it('passes difficulty, time limit and an abort signal to a custom search', async () => {
    const state = fakeEngine.initialState();
    const controller = new AbortController();
    const entry = createWorkerAiEntry(
      fakeEngine,
      caps,
      (candidate): candidate is FakeState =>
        typeof candidate === 'object' &&
        candidate !== null &&
        'turn' in candidate &&
        (candidate.turn === 0 || candidate.turn === 1),
      undefined,
      undefined,
      async (received, difficulty, timeLimitMs, signal) => {
        expect(received).toBe(state);
        expect(difficulty).toBe('expert');
        expect(timeLimitMs).toBe(1250);
        expect(signal).toBe(controller.signal);
        return signal.aborted ? null : 'advance';
      },
    );

    expect(entry.supportsCancellation).toBe(true);
    await expect(entry.findMove(state, 'expert', controller.signal)).resolves.toBe('advance');
    controller.abort();
    await expect(entry.findMove(state, 'expert', controller.signal)).resolves.toBeNull();
  });
});
