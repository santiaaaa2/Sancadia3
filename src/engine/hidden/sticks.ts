export function rollSticks(rng: () => number, count = 4): number {
  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError('Stick count must be a non-negative integer.');
  }
  let marked = 0;
  for (let index = 0; index < count; index++) {
    const side = rng();
    if (!Number.isFinite(side) || side < 0 || side >= 1) {
      throw new RangeError('The random source must return a number in [0, 1).');
    }
    if (side < 0.5) marked++;
  }
  return marked;
}

export function stickProbabilities(count = 4): number[] {
  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError('Stick count must be a non-negative integer.');
  }

  let probabilities = [1];
  for (let roll = 0; roll < count; roll++) {
    const next = Array.from({ length: probabilities.length + 1 }, () => 0);
    for (let marked = 0; marked < probabilities.length; marked++) {
      const probability = probabilities[marked]!;
      next[marked] = next[marked]! + probability / 2;
      next[marked + 1] = next[marked + 1]! + probability / 2;
    }
    probabilities = next;
  }
  return probabilities;
}
