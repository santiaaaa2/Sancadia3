import { describe, expect, it } from 'vitest';
import { rollSticks, stickProbabilities } from '@/engine/hidden/sticks';

function seededRng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

describe('two-sided stick dice', () => {
  it('uses the injected random source deterministically', () => {
    const first = seededRng(12345);
    const second = seededRng(12345);
    expect(Array.from({ length: 100 }, () => rollSticks(first))).toEqual(
      Array.from({ length: 100 }, () => rollSticks(second)),
    );
    expect(rollSticks(() => 0.1, 4)).toBe(4);
    expect(rollSticks(() => 0.9, 4)).toBe(0);
    expect(rollSticks(() => 0.1, 0)).toBe(0);
  });

  it('returns the binomial distribution for four sticks', () => {
    expect(stickProbabilities()).toEqual([1 / 16, 4 / 16, 6 / 16, 4 / 16, 1 / 16]);
    expect(stickProbabilities(0)).toEqual([1]);
    expect(stickProbabilities(2)).toEqual([1 / 4, 1 / 2, 1 / 4]);
  });

  it('matches the four-stick distribution over a large seeded sample', () => {
    const rng = seededRng(20261110);
    const samples = 160_000;
    const counts = Array.from({ length: 5 }, () => 0);
    for (let sample = 0; sample < samples; sample++) counts[rollSticks(rng)]!++;

    const expected = stickProbabilities();
    for (let marked = 0; marked < counts.length; marked++) {
      expect(counts[marked]! / samples).toBeCloseTo(expected[marked]!, 2);
    }
  });

  it('rejects invalid counts and random-source outputs', () => {
    expect(() => rollSticks(() => 0, -1)).toThrow(RangeError);
    expect(() => stickProbabilities(2.5)).toThrow(RangeError);
    expect(() => rollSticks(() => 1)).toThrow(RangeError);
    expect(() => rollSticks(() => Number.NaN)).toThrow(RangeError);
  });
});
