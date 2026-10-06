import { describe, expect, it } from 'vitest';
import { createSeededRng } from '@/core/rng';
import type { CustomerDef } from '@/data/customers';
import { startDrinking, waitingCustomers } from '@/systems/customers';
import { catalog, context, FIRST_DELAY, newFloor, run } from './helpers';

function seatedAndServed(drinkMs: number) {
  const floor = newFloor(1);
  run(floor, context(), FIRST_DELAY);
  const customer = floor.customers[0];
  if (customer !== undefined) startDrinking(customer, drinkMs);
  return { floor, customer };
}

describe('drinking customers', () => {
  it('stay in their seat until the drink is finished, then leave happy', () => {
    const { floor } = seatedAndServed(3_000);
    expect(run(floor, context(), 2_900)).toEqual([]);
    expect(floor.customers).toHaveLength(1);
    expect(run(floor, context(), 100)).toEqual([{ kind: 'left', id: 1, reason: 'served' }]);
  });

  it('are no longer waiting, and do not lose patience', () => {
    const { floor, customer } = seatedAndServed(60_000);
    run(floor, context(), 30_000);
    expect(waitingCustomers(floor)).toEqual([]);
    expect(customer?.patienceMs).toBe(customer?.patienceMaxMs);
  });

  it('keep drinking while a lesson freezes patience, so the only seat frees up', () => {
    const { floor } = seatedAndServed(3_000);
    run(floor, context({ freezePatience: true, maxCustomers: 1 }), 3_000);
    expect(floor.customers.every((c) => c.id !== 1)).toBe(true);
  });
});

describe('customer preferences when ordering', () => {
  const fan: CustomerDef = { id: 'fan', minReputation: 0, patienceSeconds: 1, spendMultiplier: 1, likes: ['luck'] };
  const speedy = { ...catalog.recipes[1]!, id: 'speedy', effect: 'speed' as const };
  const prefCatalog = { customerTypes: [fan], recipes: [catalog.recipes[0]!, speedy] };

  it('mark a liked order, and liked drinks are ordered about twice as often', () => {
    const floor = newFloor(1);
    const changes = run(floor, context({ unlockedRecipeIds: ['r1', 'speedy'] }), 3_000_000, createSeededRng(3), prefCatalog);
    const arrivals = changes.filter((c) => c.kind === 'arrived');
    const liked = arrivals.filter((c) => c.kind === 'arrived' && c.liked).length / arrivals.length;
    expect(arrivals.length).toBeGreaterThan(100);
    expect(liked).toBeGreaterThan(0.58);
    expect(liked).toBeLessThan(0.75);
  });
});
