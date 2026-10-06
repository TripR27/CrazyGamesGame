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
