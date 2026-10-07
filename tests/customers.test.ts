import { describe, expect, it } from 'vitest';
import { catalog, context, FIRST_DELAY, newFloor, run, patientCatalog } from './customers-helpers';
import { type CustomerDef, SPAWNING } from '@/customers/customer-data';
import { startDrinking, waitingCustomers, dismiss, findCustomer, advancePatience, freeSeats, nextSpawnDelayMs } from '@/customers/customers';
import { createSeededRng } from '@/shared/random';

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
  const fan: CustomerDef = { id: 'fan', minLevel: 1, patienceSeconds: 1, spendMultiplier: 1, likes: ['luck'] };
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

function floorWithOneCustomer() {
  const floor = newFloor();
  run(floor, context(), FIRST_DELAY);
  return floor;
}

describe('customer patience', () => {
  it('runs down with time', () => {
    const floor = floorWithOneCustomer();
    advancePatience(floor, 5_000);
    expect(floor.customers[0]?.patienceMs).toBe(15_000);
  });

  it('makes a customer leave impatient when it reaches zero, and not earlier', () => {
    const floor = floorWithOneCustomer();
    expect(advancePatience(floor, 19_900)).toEqual([]);
    expect(advancePatience(floor, 100)).toEqual([{ kind: 'left', id: 1, reason: 'impatient' }]);
    expect(floor.customers).toEqual([]);
  });

  it('only removes the customers who ran out, not the others', () => {
    const floor = newFloor();
    run(floor, context(), 60_000, undefined, {
      customerTypes: [{ id: 'x', minLevel: 1, patienceSeconds: 1000, spendMultiplier: 1, likes: [] }],
      recipes: [],
    });
    expect(floor.customers).toEqual([]); // no recipes in this catalog, so nobody came
    run(floor, context(), 60_000);
    const before = floor.customers.length;
    expect(before).toBeGreaterThan(1);
    const first = floor.customers[0];
    if (first) first.patienceMs = 50;
    const changes = advancePatience(floor, 100);
    expect(changes).toHaveLength(1);
    expect(floor.customers).toHaveLength(before - 1);
  });
});

describe('frozen patience', () => {
  it('stops patience from running down while frozen, and continues afterwards', () => {
    const floor = floorWithOneCustomer();
    run(floor, context({ freezePatience: true, maxCustomers: 1 }), 120_000);
    expect(floor.customers).toHaveLength(1);
    expect(floor.customers[0]?.patienceMs).toBe(floor.customers[0]?.patienceMaxMs);

    run(floor, context({ maxCustomers: 1 }), 5_000);
    expect(floor.customers[0]?.patienceMs).toBe(15_000);
  });
});

describe('dismiss', () => {
  it('removes a served customer and reports why they left', () => {
    const floor = floorWithOneCustomer();
    expect(dismiss(floor, 1, 'served')).toEqual({ kind: 'left', id: 1, reason: 'served' });
    expect(findCustomer(floor, 1)).toBeUndefined();
  });

  it('ignores customers who are not there', () => {
    const floor = floorWithOneCustomer();
    expect(dismiss(floor, 99, 'served')).toBeUndefined();
    expect(floor.customers).toHaveLength(1);
  });
});

describe('spawning customers', () => {
  it('brings the first customer after the first delay, not before', () => {
    const floor = newFloor();
    expect(run(floor, context(), FIRST_DELAY - 100)).toEqual([]);
    expect(run(floor, context(), 100)).toEqual([{ kind: 'arrived', id: 1, liked: false, vip: false }]);
  });

  it('gives the newcomer a free seat, the type patience and a known recipe', () => {
    const floor = newFloor();
    run(floor, context(), FIRST_DELAY);
    const [customer] = floor.customers;
    expect(customer?.typeId).toBe('plain');
    expect(customer?.patienceMs).toBe(20_000);
    expect(['r1', 'r2']).toContain(customer?.recipeId);
    expect(customer?.seat).toBeGreaterThanOrEqual(0);
    expect(customer?.seat).toBeLessThan(7);
  });

  it('only orders recipes the player has discovered', () => {
    const floor = newFloor(50);
    run(floor, context({ unlockedRecipeIds: ['r3'] }), 300_000, createSeededRng(7), patientCatalog);
    expect(floor.customers.length).toBeGreaterThan(5);
    expect(new Set(floor.customers.map((c) => c.recipeId))).toEqual(new Set(['r3']));
  });

  it('never has more customers than the context allows, and fills up again when the limit is lifted', () => {
    const floor = newFloor();
    run(floor, context({ maxCustomers: 1 }), 120_000, undefined, patientCatalog);
    expect(floor.customers).toHaveLength(1);
    run(floor, context(), 60_000, undefined, patientCatalog);
    expect(floor.customers.length).toBeGreaterThan(1);
  });

  it('spawns nobody while no recipe is known, then starts as soon as one is', () => {
    const floor = newFloor();
    expect(run(floor, context({ unlockedRecipeIds: [] }), 20_000)).toEqual([]);
    expect(run(floor, context(), 100)).toHaveLength(1);
  });

  it('keeps higher-reputation customer types away until the reputation is there', () => {
    const low = newFloor(100);
    run(low, context({ reputation: 0 }), 600_000, createSeededRng(3), patientCatalog);
    expect(new Set(low.customers.map((c) => c.typeId))).toEqual(new Set(['plain']));

    const high = newFloor(100);
    run(high, context({ reputation: 120 }), 600_000, createSeededRng(3), patientCatalog);
    expect(new Set(high.customers.map((c) => c.typeId))).toEqual(new Set(['plain', 'fancy', 'royal']));
  });

  it('never seats two customers on the same seat and never exceeds capacity', () => {
    const floor = newFloor(3);
    run(floor, context({ reputation: 100 }), 120_000, createSeededRng(5), patientCatalog);
    expect(floor.customers).toHaveLength(3);
    expect(new Set(floor.customers.map((c) => c.seat)).size).toBe(3);
    expect(freeSeats(floor)).toEqual([]);
  });

  it('does not refill a freed seat at once: the next customer needs the refill delay to walk in', () => {
    const floor = newFloor(1);
    run(floor, context(), 30_000, undefined, patientCatalog);
    const first = floor.customers[0];
    expect(floor.customers).toHaveLength(1);
    dismiss(floor, first?.id ?? -1, 'served');
    expect(run(floor, context(), SPAWNING.refillDelayMs - 200, undefined, patientCatalog)).toEqual([]);
    expect(run(floor, context(), 300, undefined, patientCatalog)).toEqual([{ kind: 'arrived', id: 2, liked: false, vip: false }]);
  });

  it('seats at most as many customers as the player has seats', () => {
    const floor = newFloor(7);
    run(floor, context({ maxCustomers: 1 }), 300_000, undefined, patientCatalog);
    expect(floor.customers).toHaveLength(1);
    run(floor, context({ maxCustomers: 3 }), 300_000, undefined, patientCatalog);
    expect(floor.customers).toHaveLength(3);
  });
});

describe('spawn timing', () => {
  const middle = (): number => 0.5;

  it('uses the base interval with no reputation and a neutral roll', () => {
    expect(nextSpawnDelayMs(0, middle)).toBe(SPAWNING.baseIntervalMs);
  });

  it('shortens with reputation but never below the minimum interval', () => {
    expect(nextSpawnDelayMs(10, middle)).toBeLessThan(nextSpawnDelayMs(0, middle));
    expect(nextSpawnDelayMs(10_000, middle)).toBe(SPAWNING.minIntervalMs);
  });

  it('stays within the jitter range around the interval', () => {
    expect(nextSpawnDelayMs(0, () => 0)).toBeCloseTo(SPAWNING.baseIntervalMs * (1 - SPAWNING.jitter), 5);
    expect(nextSpawnDelayMs(0, () => 0.999999)).toBeLessThanOrEqual(SPAWNING.baseIntervalMs * (1 + SPAWNING.jitter));
  });
});
