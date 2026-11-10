import type { Difficulty } from '@/engine/difficulty';
import { aiRegistry, type WorkerGameId } from '@/games/aiRegistry';

interface WorkerRequest {
  requestId: number;
  gameId: WorkerGameId;
  state: unknown;
  difficulty: Difficulty;
}

interface WorkerResponse {
  requestId: number;
  move?: unknown;
  error?: string;
}

interface PendingRequest {
  requestId: number;
  resolve: (move: unknown | null) => void;
  reject: (error: Error) => void;
  signal?: AbortSignal;
  abortHandler?: () => void;
}

export class AIRequestCancelledError extends Error {
  constructor() {
    super('AI request was cancelled.');
    this.name = 'AIRequestCancelledError';
  }
}

let worker: Worker | null = null;
let nextRequestId = 0;
let pending: PendingRequest | null = null;

function clearPending(request: PendingRequest): void {
  if (request.signal && request.abortHandler) {
    request.signal.removeEventListener('abort', request.abortHandler);
  }
  if (pending === request) pending = null;
}

function cancelPending(): void {
  if (pending) {
    const request = pending;
    clearPending(request);
    request.reject(new AIRequestCancelledError());
  }
  worker?.terminate();
  worker = null;
}

function getWorker(): Worker | null {
  if (worker) return worker;
  if (typeof Worker === 'undefined') return null;
  try {
    worker = new Worker(new URL('./ai.worker.ts', import.meta.url), { type: 'module' });
    worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
      const request = pending;
      if (!request || event.data.requestId !== request.requestId) return;
      clearPending(request);
      if (event.data.error) request.reject(new Error(event.data.error));
      else request.resolve(event.data.move ?? null);
    });
    worker.addEventListener('error', (event) => {
      const request = pending;
      worker?.terminate();
      worker = null;
      if (!request) return;
      clearPending(request);
      request.reject(new Error(event.message || 'AI worker encountered an error.'));
    });
    return worker;
  } catch {
    worker = null;
    return null;
  }
}

export function requestMove<State, Move>(
  gameId: WorkerGameId,
  state: State,
  difficulty: Difficulty,
  signal?: AbortSignal,
): Promise<Move | null> {
  cancelPending();
  if (signal?.aborted) return Promise.reject(new AIRequestCancelledError());

  const entry = aiRegistry[gameId];
  if (!entry || !entry.validateState(state)) {
    return Promise.reject(new Error(`Invalid game state for ${gameId}`));
  }

  const activeWorker = getWorker();
  if (!activeWorker) {
    if (gameId === 'latrunculi') {
      return Promise.reject(new Error('LATRUNCULI requires Web Worker support for AI searches.'));
    }
    try {
      const move = entry.findMove(state, difficulty);
      if (move !== null && !entry.isLegalMove(state, move)) {
        return Promise.reject(new Error(`AI returned an illegal move for ${gameId}`));
      }
      return Promise.resolve(move as Move | null);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  const requestId = ++nextRequestId;
  return new Promise<Move | null>((resolve, reject) => {
    const request: PendingRequest = {
      requestId,
      resolve: (move) => resolve(move as Move | null),
      reject,
      signal,
    };
    if (signal) {
      request.abortHandler = () => {
        if (pending !== request) return;
        cancelPending();
      };
      signal.addEventListener('abort', request.abortHandler, { once: true });
    }
    pending = request;

    const message: WorkerRequest = { requestId, gameId, state, difficulty };
    try {
      activeWorker.postMessage(message);
    } catch (error) {
      clearPending(request);
      activeWorker.terminate();
      worker = null;
      reject(error instanceof Error ? error : new Error('Unable to send the AI request.'));
    }
  });
}

export function cancelAiRequest(): void {
  cancelPending();
}
