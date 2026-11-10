import { describe, expect, it } from 'vitest';
import { aiRegistry } from '@/games/aiRegistry';
import { chooseXiangqiMove, evaluateXiangqi, isXiangqiState } from '@/games/xiangqi/ai';
import { xiangqi } from '@/games/xiangqi/rules';

describe('Xiangqi AI', () => {
  it('validates engine states and rejects malformed board data', () => {
    const state = xiangqi.initialState();
    expect(isXiangqiState(state)).toBe(true);
    expect(isXiangqiState({ ...state, board: [] })).toBe(false);
    expect(isXiangqiState({ ...state, turn: 3 })).toBe(false);
  });

  it('evaluates from either player perspective', () => {
    const state = xiangqi.initialState();
    const board = [...state.board];
    board[6 * 9] = null;
    const asymmetric = { ...state, board };
    expect(evaluateXiangqi(asymmetric, 0)).toBe(-evaluateXiangqi(asymmetric, 1));
  });

  it('selects a legal move through the cancellable worker entry', async () => {
    const state = xiangqi.initialState();
    const move = await chooseXiangqiMove(state, 'beginner', 100, new AbortController().signal);
    expect(move).not.toBeNull();
    expect(xiangqi.legalMoves(state)).toContainEqual(move);

    const cancelled = new AbortController();
    cancelled.abort();
    await expect(chooseXiangqiMove(state, 'expert', 100, cancelled.signal)).resolves.toBeNull();

    expect(aiRegistry.xiangqi.available).toBe(true);
    expect(aiRegistry.xiangqi.supportsCancellation).toBe(true);
    expect(aiRegistry.xiangqi.validateState(state)).toBe(true);
  });

  it('yields often enough to observe cancellation during a longer search', async () => {
    const controller = new AbortController();
    const search = chooseXiangqiMove(xiangqi.initialState(), 'expert', 10_000, controller.signal);
    setTimeout(() => controller.abort(), 0);
    await expect(search).resolves.toBeNull();
  });
});
