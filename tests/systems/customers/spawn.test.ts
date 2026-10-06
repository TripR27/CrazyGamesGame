import { describe, expect, it } from 'vitest';
import { createSeededRng } from '@/core/rng';
import { SPAWNING } from '@/data/customers/spawning';
import { dismiss, freeSeats } from '@/systems/customers';
import { nextSpawnDelayMs } from '@/systems/customers/spawn-timing';
import { context, FIRST_DELAY, newFloor, patientCatalog, run } from './helpers';

describe('spawning customers', () => {
  it('brings the first customer after the first delay, not before', () => {
    const floor = newFloor();
    expect(run(floor, context(), FIRST_DELAY - 100)).toEqual([]);
    expect(run(floor, context(), 100)).toEqual([{ kind: 'arrived', id: 1 }]);
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
    run(high, context({ reputation: 60 }), 600_000, createSeededRng(3), patientCatalog);
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
    expect(run(floor, context(), 300, undefined, patientCatalog)).toEqual([{ kind: 'arrived', id: 2 }]);
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
