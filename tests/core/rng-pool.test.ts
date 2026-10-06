import { describe, expect, it, vi } from 'vitest';
import { createPool } from '@/core/pool';
import { createSeededRng, pickRandom, randomIndex } from '@/core/rng';

describe('seeded rng', () => {
  it('repeats the same sequence for the same seed and differs between seeds', () => {
    const a = createSeededRng(42);
    const b = createSeededRng(42);
    const first = [a(), a(), a()];
    expect([b(), b(), b()]).toEqual(first);
    expect(createSeededRng(43)()).not.toBe(first[0]);
  });

  it('stays in [0, 1)', () => {
    const rng = createSeededRng(9);
    for (let i = 0; i < 1000; i++) {
      const n = rng();
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(1);
    }
  });

  it('picks valid indexes, even for a roll just below 1', () => {
    expect(randomIndex(() => 0.999999, 4)).toBe(3);
    expect(randomIndex(() => 0, 4)).toBe(0);
  });

  it('returns undefined when there is nothing to pick', () => {
    expect(pickRandom(createSeededRng(1), [])).toBeUndefined();
    expect(pickRandom(() => 0, ['x', 'y'])).toBe('x');
  });
});

describe('pool', () => {
  it('creates items on demand and reuses released ones', () => {
    const create = vi.fn(() => ({ n: create.mock.calls.length }));
    const pool = createPool({ create });
    const first = pool.acquire();
    pool.acquire();
    expect(create).toHaveBeenCalledTimes(2);

    pool.release(first);
    expect(pool.idleCount()).toBe(1);
    expect(pool.acquire()).toBe(first);
    expect(create).toHaveBeenCalledTimes(2);
  });

  it('resets an item when it is released', () => {
    const reset = vi.fn();
    const pool = createPool({ create: () => ({}), reset });
    const item = pool.acquire();
    pool.release(item);
    expect(reset).toHaveBeenCalledWith(item);
  });
});
