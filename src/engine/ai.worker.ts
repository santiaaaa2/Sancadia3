import type { Difficulty } from '@/engine/difficulty';
import { aiRegistry, type WorkerGameId } from '@/games/aiRegistry';

interface WorkerSearchRequest {
  type: 'search';
  requestId: number;
  gameId: WorkerGameId;
  state: unknown;
  difficulty: Difficulty;
}

interface WorkerCancelRequest {
  type: 'cancel';
  requestId: number;
}

type WorkerRequest = WorkerSearchRequest | WorkerCancelRequest;

interface WorkerResponse {
  requestId: number;
  move?: unknown;
  error?: string;
}

const activeSearches = new Map<number, AbortController>();

self.addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
  const message = event.data;
  if (message.type === 'cancel') {
    activeSearches.get(message.requestId)?.abort();
    return;
  }

  const { requestId, gameId, state, difficulty } = message;
  let response: WorkerResponse;

  try {
    const entry = aiRegistry[gameId];
    if (!entry || !entry.validateState(state)) throw new Error(`Invalid game state for ${gameId}`);
    const controller = new AbortController();
    activeSearches.set(requestId, controller);
    void (async () => {
      try {
        const move = await entry.findMove(state, difficulty, controller.signal);
        if (controller.signal.aborted) return;
        if (move !== null && !entry.isLegalMove(state, move)) {
          throw new Error(`AI returned an illegal move for ${gameId}`);
        }
        self.postMessage({ requestId, move });
      } catch (error) {
        if (controller.signal.aborted) return;
        const failure: WorkerResponse = {
          requestId,
          error: error instanceof Error ? error.message : 'AI worker failed.',
        };
        self.postMessage(failure);
      } finally {
        activeSearches.delete(requestId);
      }
    })();
    return;
  } catch (error) {
    response = {
      requestId,
      error: error instanceof Error ? error.message : 'AI worker failed.',
    };
  }

  self.postMessage(response);
});
