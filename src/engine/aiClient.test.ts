import { afterEach, describe, expect, it, vi } from 'vitest';
import { AIRequestCancelledError, cancelAiRequest, requestMove } from '@/engine/aiClient';
import { aiRegistry } from '@/games/aiRegistry';
import { ticTacToe, type TicTacToeState } from '@/games/tictactoe/rules';

interface RequestMessage {
  requestId: number;
}

class MockWorker {
  static instances: MockWorker[] = [];
  readonly messages: unknown[] = [];
  terminated = false;
  private readonly listeners = new Map<string, ((event: MessageEvent | ErrorEvent) => void)[]>();

  constructor() {
    MockWorker.instances.push(this);
  }

  addEventListener(type: string, listener: (event: MessageEvent | ErrorEvent) => void) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  postMessage(message: unknown) {
    this.messages.push(message);
  }

  terminate() {
    this.terminated = true;
  }

  send(data: unknown) {
    for (const listener of this.listeners.get('message') ?? []) {
      listener(new MessageEvent('message', { data }));
    }
  }
}

describe('AI worker client', () => {
  afterEach(() => {
    cancelAiRequest();
    MockWorker.instances = [];
    vi.unstubAllGlobals();
  });

  it('creates a worker lazily and returns its response', async () => {
    vi.stubGlobal('Worker', MockWorker);
    const state = ticTacToe.initialState();
    const request = requestMove<TicTacToeState, number>('noughts-and-crosses', state, 'beginner');
    const worker = MockWorker.instances[0];
    expect(worker).toBeDefined();
    if (!worker) {
      throw new Error('Expected a worker to be created.');
    }
    const firstMessage = worker.messages[0];
    expect(firstMessage).toBeDefined();
    if (!firstMessage) {
      throw new Error('Expected a worker request message.');
    }
    const { requestId } = firstMessage as RequestMessage;
    worker.send({ requestId, move: 4 });

    await expect(request).resolves.toBe(4);
    expect(worker.terminated).toBe(false);
  });

  it('cancels work on abort and ignores stale responses after a newer request', async () => {
    vi.stubGlobal('Worker', MockWorker);
    const controller = new AbortController();
    const state = ticTacToe.initialState();
    const stale = requestMove<TicTacToeState, number>(
      'noughts-and-crosses',
      state,
      'beginner',
      controller.signal,
    );
    const oldWorker = MockWorker.instances[0];
    expect(oldWorker).toBeDefined();
    if (!oldWorker) {
      throw new Error('Expected the first worker to be created.');
    }
    const oldFirstMessage = oldWorker.messages[0];
    expect(oldFirstMessage).toBeDefined();
    if (!oldFirstMessage) {
      throw new Error('Expected the first worker request message.');
    }
    const oldId = (oldFirstMessage as RequestMessage).requestId;

    controller.abort();
    await expect(stale).rejects.toBeInstanceOf(AIRequestCancelledError);
    expect(oldWorker.terminated).toBe(true);

    const current = requestMove<TicTacToeState, number>('noughts-and-crosses', state, 'beginner');
    const currentWorker = MockWorker.instances[1];
    expect(currentWorker).toBeDefined();
    if (!currentWorker) {
      throw new Error('Expected the second worker to be created.');
    }
    const currentFirstMessage = currentWorker.messages[0];
    expect(currentFirstMessage).toBeDefined();
    if (!currentFirstMessage) {
      throw new Error('Expected the second worker request message.');
    }
    const currentId = (currentFirstMessage as RequestMessage).requestId;
    oldWorker.send({ requestId: oldId, move: 0 });
    currentWorker.send({ requestId: currentId, move: 4 });
    await expect(current).resolves.toBe(4);
  });

  it('uses the main-thread fallback if Worker construction is unavailable', async () => {
    vi.stubGlobal(
      'Worker',
      class {
        constructor() {
          throw new Error('Workers are blocked');
        }
      },
    );
    const state = ticTacToe.initialState();
    const move = await requestMove<TicTacToeState, number>(
      'noughts-and-crosses',
      state,
      'beginner',
    );
    expect(ticTacToe.legalMoves(state)).toContain(move);
  });

  it('sends cooperative cancellation to searches that support it', async () => {
    vi.stubGlobal('Worker', MockWorker);
    const entry = aiRegistry['noughts-and-crosses'];
    const supportsCancellation = entry.supportsCancellation;
    entry.supportsCancellation = true;
    try {
      const controller = new AbortController();
      const request = requestMove<TicTacToeState, number>(
        'noughts-and-crosses',
        ticTacToe.initialState(),
        'beginner',
        controller.signal,
      );
      const worker = MockWorker.instances[0];
      expect(worker).toBeDefined();
      if (!worker) throw new Error('Expected a worker to be created.');

      controller.abort();
      await expect(request).rejects.toBeInstanceOf(AIRequestCancelledError);
      expect(worker.terminated).toBe(false);
      expect(worker.messages[1]).toMatchObject({ type: 'cancel' });
    } finally {
      entry.supportsCancellation = supportsCancellation;
    }
  });

  it('each registered game produces a legal beginner move', async () => {
    for (const entry of Object.values(aiRegistry).filter((candidate) => candidate.available)) {
      const state = entry.initialState();
      const move = await entry.findMove(state, 'beginner');
      expect(move).not.toBeNull();
      expect(entry.isLegalMove(state, move)).toBe(true);
    }
  });
});
