import { textKey } from '@/shared/content';

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

/**
 * Pools of funny one-liners. A pool `served` with 4 lines means the i18n keys
 * `feedback.served.1` to `feedback.served.4` must exist (the content test checks this).
 */
export type FeedbackPoolId = 'served' | 'wrong' | 'nothing' | 'fizzle' | 'full' | 'busy';

export interface FeedbackPool {
  id: FeedbackPoolId;
  lines: number;
}

export const FEEDBACK_POOLS: readonly FeedbackPool[] = [
  { id: 'served', lines: 4 },
  { id: 'wrong', lines: 4 },
  { id: 'nothing', lines: 4 },
  { id: 'fizzle', lines: 3 },
  { id: 'full', lines: 2 },
  { id: 'busy', lines: 2 },
];

/** Pick a random line from a pool, as an i18n key. Systems choose (so tests can seed it); the UI translates. */
export function feedbackKey(pool: FeedbackPoolId, rng: Rng): string {
  const lines = FEEDBACK_POOLS.find((p) => p.id === pool)?.lines ?? 1;
  const numbers = Array.from({ length: lines }, (_, i) => String(i + 1));
  return textKey('feedback', pool, pickRandom(rng, numbers) ?? '1');
}
