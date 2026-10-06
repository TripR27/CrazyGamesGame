import { describe, expect, it } from 'vitest';
import { dismiss, findCustomer } from '@/systems/customers';
import { advancePatience } from '@/systems/customers/patience';
import { context, FIRST_DELAY, newFloor, run } from './helpers';

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
      customerTypes: [{ id: 'x', minReputation: 0, patienceSeconds: 1000, spendMultiplier: 1, likes: [] }],
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
