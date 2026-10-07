/** Source of randomness, returns a number in [0, 1). Injected so tests and the simulator are deterministic. */
export type Rng = () => number;

export const systemRng: Rng = Math.random;

/** Small seeded generator (mulberry32): the same seed always gives the same sequence. */
export function createSeededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Random whole number in [0, count). */
export function randomIndex(rng: Rng, count: number): number {
  return Math.min(count - 1, Math.floor(rng() * count));
}

export function pickRandom<T>(rng: Rng, items: readonly T[]): T | undefined {
  return items.length === 0 ? undefined : items[randomIndex(rng, items.length)];
}

/** Pick an item with a chance in proportion to its weight. Equal weights give the same pick as `pickRandom`. */
export function pickWeighted<T>(rng: Rng, items: readonly T[], weight: (item: T) => number): T | undefined {
  const total = items.reduce((sum, item) => sum + weight(item), 0);
  let roll = rng() * total;
  for (const item of items) {
    roll -= weight(item);
    if (roll < 0) return item;
  }
  return items[items.length - 1];
}
