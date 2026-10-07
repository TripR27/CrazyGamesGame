import { describe, expect, it } from 'vitest';
import { ab, catalog, economy, floorWith, plain, rich, rng, station } from '../fixtures';
import { num } from '@/shared/numbers';
import { computePayout } from '@/systems/serving/payout';
import { serveCustomer, type ServeDeps } from '@/systems/serving/serve';

function deps(ready: string[], ...orders: Array<[string, string]>) {
  const s = station();
  s.ready.push(...ready);
  const eco = economy();
  const d: ServeDeps = { floor: floorWith(...orders), station: s, economy: eco, catalog, rng: rng() };
  return { d, s, eco };
}

describe('payout', () => {
  it('is the base price times the customer spend multiplier, in whole coins', () => {
    expect(computePayout(ab, plain).eq(10)).toBe(true);
    expect(computePayout(ab, rich).eq(15)).toBe(true);
    expect(computePayout({ ...ab, basePrice: 5 }, rich).eq(8)).toBe(true);
  });

  it('is never less than 1 coin', () => {
    expect(computePayout({ ...ab, basePrice: 0.1 }, plain).eq(1)).toBe(true);
  });
});

describe('serving a customer', () => {
  it('hands over the drink, pays gold, adds reputation and lets the customer stay to drink it', () => {
    const { d, s, eco } = deps(['ab'], ['rich', 'ab']);
    const outcome = serveCustomer(d, 1);
    expect(outcome).toMatchObject({ kind: 'served', event: { id: 1, liked: false, extraReputation: 0 } });
    expect(eco.getState().currencies.gold.eq(15)).toBe(true);
    expect(eco.getState().reputation).toBe(1);
    expect(s.ready).toEqual([]);
    expect(d.floor.customers[0]?.drinkMsLeft).toBeGreaterThan(0);
  });

  it('ignores a click on a customer who is already drinking', () => {
    const { d, s } = deps(['ab', 'ab'], ['plain', 'ab']);
    serveCustomer(d, 1);
    expect(serveCustomer(d, 1)).toEqual({ kind: 'ignored' });
    expect(s.ready).toEqual(['ab']);
  });

  it('reports the seat, the drink, the gold and a line from the served pool', () => {
    const { d } = deps(['ab'], ['plain', 'cde'], ['plain', 'ab']);
    const outcome = serveCustomer(d, 2);
    expect(outcome.kind === 'served' && outcome.event).toMatchObject({
      id: 2, seat: 1, recipeId: 'ab', messageKey: expect.stringMatching(/^feedback\.served\.[1-4]$/),
    });
    expect(outcome.kind === 'served' && outcome.event.gold.eq(num(10))).toBe(true);
  });

  it('uses only the matching drink and leaves the others on the bar', () => {
    const { d, s } = deps(['cde', 'ab', 'cde'], ['plain', 'ab']);
    serveCustomer(d, 1);
    expect(s.ready).toEqual(['cde', 'cde']);
  });

  it('refuses a wrong drink without taking anything', () => {
    const { d, s, eco } = deps(['cde'], ['plain', 'ab']);
    const outcome = serveCustomer(d, 1);
    expect(outcome).toMatchObject({ kind: 'refused', event: { reason: 'wrong-drink', recipeId: 'ab' } });
    expect(outcome.kind === 'refused' && outcome.event.messageKey).toMatch(/^feedback\.wrong\./);
    expect(s.ready).toEqual(['cde']);
    expect(d.floor.customers).toHaveLength(1);
    expect(eco.getState().currencies.gold.eq(0)).toBe(true);
    expect(eco.getState().reputation).toBe(0);
  });

  it('complains when nothing is ready at all', () => {
    const { d } = deps([], ['plain', 'ab']);
    const outcome = serveCustomer(d, 1);
    expect(outcome).toMatchObject({ kind: 'refused', event: { reason: 'nothing-ready' } });
    expect(outcome.kind === 'refused' && outcome.event.messageKey).toMatch(/^feedback\.nothing\./);
  });

  it('ignores a customer who is already gone, and unknown content', () => {
    const { d } = deps(['ab'], ['plain', 'ab']);
    expect(serveCustomer(d, 99)).toEqual({ kind: 'ignored' });
    d.floor.customers[0]!.typeId = 'ghost';
    expect(serveCustomer(d, 1)).toEqual({ kind: 'ignored' });
  });
});
