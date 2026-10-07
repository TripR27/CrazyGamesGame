import { SERVING } from '@/serving/effects';
import { describe, expect, it, vi } from 'vitest';
import { ab, catalog, economy, floorWith, plain, rich, rng, station } from './fixtures';
import type { CustomerDef } from '@/customers/customer-data';
import { computePayout, serveCustomer, type ServeDeps, serveAndPublish } from '@/serving/serving';
import type { Effect } from '@/shared/content';
import { createEventBus, type GameEvents } from '@/shared/events';
import { num } from '@/shared/numbers';
import type { Rng } from '@/shared/random';

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

/** One customer of type `fan` (who likes `likes`) waits for a 10-gold drink with `effect`, which is ready. */
function setup(effect: Effect, likes: Effect[], rng: Rng = () => 0.5) {
  const drink = { ...ab, effect };
  const fan: CustomerDef = { id: 'fan', minLevel: 1, patienceSeconds: 60, spendMultiplier: 1, likes };
  const floor = floorWith(['fan', 'ab']);
  floor.customers[0]!.liked = likes.includes(effect);
  const s = station();
  s.ready.push('ab');
  const eco = economy();
  const deps: ServeDeps = { floor, station: s, economy: eco, catalog: { customerTypes: [fan], recipes: [drink] }, rng };
  return { deps, eco };
}

function serveOnce(effect: Effect, likes: Effect[], rng?: Rng) {
  const { deps, eco } = setup(effect, likes, rng);
  const outcome = serveCustomer(deps, 1);
  const gold = eco.getState().currencies.gold.toNumber();
  return { outcome, gold, reputation: eco.getState().reputation, drinkMs: deps.floor.customers[0]?.drinkMsLeft };
}

describe('serving with drink effects', () => {
  it('strength: the customer pays more, double when liked', () => {
    expect(serveOnce('strength', []).gold).toBe(13); // 10 x 1.25, rounded
    expect(serveOnce('strength', ['strength']).gold).toBe(15);
  });

  it('speed: the customer finishes the drink sooner, much sooner when liked', () => {
    expect(serveOnce('charm', []).drinkMs).toBe(SERVING.drinkMs);
    expect(serveOnce('speed', []).drinkMs).toBeCloseTo(SERVING.drinkMs * 0.6);
    expect(serveOnce('speed', ['speed']).drinkMs).toBeCloseTo(SERVING.drinkMs * 0.2);
  });

  it('luck: a tip by chance, more often when liked', () => {
    const tipped = serveOnce('luck', [], () => 0.1);
    expect(tipped.gold).toBe(15);
    expect(tipped.outcome.kind === 'served' && tipped.outcome.event.tip.toNumber()).toBe(5);
    expect(serveOnce('luck', [], () => 0.4).gold).toBe(10); // 25% chance missed
    expect(serveOnce('luck', ['luck'], () => 0.4).gold).toBe(15); // 50% chance hit
  });

  it('charm: extra reputation, double when liked', () => {
    expect(serveOnce('charm', []).reputation).toBe(SERVING.reputationPerServe + 1);
    const liked = serveOnce('charm', ['charm']);
    expect(liked.reputation).toBe(SERVING.reputationPerServe + 2);
    expect(liked.outcome).toMatchObject({ kind: 'served', event: { extraReputation: 2, liked: true } });
  });

  it('announces a liked drink, so the tutorial can follow it', () => {
    const bus = createEventBus<GameEvents>();
    const likedServed = vi.fn();
    bus.on('likes:served', likedServed);
    serveAndPublish({ ...setup('strength', []).deps, bus }, 1);
    expect(likedServed).not.toHaveBeenCalled();
    serveAndPublish({ ...setup('charm', ['charm']).deps, bus }, 1);
    expect(likedServed).toHaveBeenCalledWith({ id: 1 });
  });
});
