import { describe, expect, it } from 'vitest';
import { calculatePoints, calculatePuzzlePoints } from '@/lib/points';
import { games } from '@/games/registry';

describe('calculatePoints', () => {
  it('awards difficulty-based win points', () => {
    expect(calculatePoints('win', 'beginner')).toBe(10);
    expect(calculatePoints('win', 'professional')).toBe(20);
    expect(calculatePoints('win', 'expert')).toBe(40);
  });

  it('adds a capped five-points-per-win streak bonus', () => {
    expect(calculatePoints('win', 'beginner', 1)).toBe(15);
    expect(calculatePoints('win', 'beginner', 10)).toBe(35);
  });

  it('awards fixed points for draws and losses', () => {
    expect(calculatePoints('draw', 'expert', 8)).toBe(5);
    expect(calculatePoints('lose', 'expert', 8)).toBe(1);
  });

  it('applies the shared points rules to every registered game', () => {
    for (const game of games) {
      expect(calculatePoints('win', 'beginner'), game.id).toBe(10);
      expect(calculatePoints('draw', 'beginner'), game.id).toBe(5);
      expect(calculatePoints('lose', 'beginner'), game.id).toBe(1);
    }
  });

  it('breaks down puzzle points and applies hint costs without zero-point wins', () => {
    expect(
      calculatePuzzlePoints({
        outcome: 'win',
        difficulty: 'beginner',
        attempts: 1,
        maxAttempts: 10,
        hintsUsed: 1,
        winStreak: 1,
      }),
    ).toEqual({ base: 10, efficiency: 10, streak: 5, hintCost: 5, total: 20 });
    expect(
      calculatePuzzlePoints({
        outcome: 'win',
        difficulty: 'beginner',
        attempts: 10,
        maxAttempts: 10,
        hintsUsed: 5,
      }).total,
    ).toBe(1);
    expect(
      calculatePuzzlePoints({
        outcome: 'lose',
        difficulty: 'expert',
        attempts: 5,
        maxAttempts: 5,
      }).total,
    ).toBe(1);
  });
});
