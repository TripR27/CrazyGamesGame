import { describe, expect, it } from 'vitest';
import { num } from '@/core/numbers';
import { addIngredient, createStation } from '@/systems/brewing';
import { serveCustomer } from '@/systems/serving';
import { ab, catalog, economy, floorWith, rng } from '../fixtures';

describe('brew speed', () => {
  it('shortens the brew time by the speed factor', () => {
    const normal = createStation(3);
    const fast = createStation(3, 2);
    for (const s of [normal, fast]) {
      addIngredient(s, 'a', [ab], rng());
      addIngredient(s, 'b', [ab], rng());
    }
    expect(normal.brewing?.totalMs).toBe(2000);
    expect(fast.brewing?.totalMs).toBe(1000);
  });
});

describe('sell price', () => {
  function serveWith(multiplier: number): number {
    const station = createStation(3);
    station.ready.push('ab');
    const eco = economy();
    serveCustomer(
      { floor: floorWith(['plain', 'ab']), station, economy: eco, catalog, rng: rng(), getSellMultiplier: () => num(multiplier) },
      1,
    );
    return eco.getState().currencies.gold.toNumber();
  }

  it('multiplies what a served drink pays', () => {
    expect(serveWith(1)).toBe(10);
    expect(serveWith(1.5)).toBe(15);
  });

  it('still pays at least one coin', () => {
    expect(serveWith(0.001)).toBe(1);
  });
});
