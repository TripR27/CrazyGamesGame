import { describe, expect, it, vi } from 'vitest';
import { catalog, context, FIRST_DELAY, newFloor, patientCatalog, run } from './customers-helpers';
import { catalog as fixtureCatalog, economy, floorWith, station } from './fixtures';
import { type CustomerDef, VIP_SPAWN } from '@/customers/customer-data';
import { dismiss, publishChange, startCustomerSystem, pickCustomerType, priciestRecipe } from '@/customers/customers';
import { serveCustomer } from '@/serving/serving';
import { createEventBus, type GameEvents } from '@/shared/events';
import { createSeededRng } from '@/shared/random';

function setup(getContext = () => context()) {
  const bus = createEventBus<GameEvents>();
  const floor = newFloor();
  const stop = startCustomerSystem({ floor, bus, rng: createSeededRng(1), catalog, getContext });
  const arrived = vi.fn();
  const left = vi.fn();
  bus.on('customer:arrived', arrived);
  bus.on('customer:left', left);
  const tick = (ms: number): void => {
    for (let t = 0; t < ms; t += 100) bus.emit('tick', { deltaMs: 100 });
  };
  return { bus, floor, stop, arrived, left, tick };
}

describe('customer system on the event bus', () => {
  it('announces arrivals when the game ticks', () => {
    const { arrived, floor, tick } = setup();
    tick(FIRST_DELAY - 100);
    expect(arrived).not.toHaveBeenCalled();
    tick(100);
    expect(arrived).toHaveBeenCalledWith({ id: 1 });
    expect(floor.customers).toHaveLength(1);
  });

  it('announces impatient departures', () => {
    const { left, tick } = setup();
    tick(FIRST_DELAY);
    tick(20_000);
    expect(left).toHaveBeenCalledWith({ id: 1, reason: 'impatient' });
  });

  it('reads the player context fresh on every step', () => {
    let unlocked: string[] = [];
    const { floor, tick } = setup(() => context({ unlockedRecipeIds: unlocked }));
    tick(5_000);
    expect(floor.customers).toEqual([]);
    unlocked = ['r1'];
    tick(100);
    expect(floor.customers).toHaveLength(1);
  });

  it('stops reacting to ticks after the stop function is called', () => {
    const { floor, stop, tick } = setup();
    stop();
    tick(10_000);
    expect(floor.customers).toEqual([]);
  });

  it('publishes a dismissal as a left event (used when serving in step 7)', () => {
    const { bus, floor, left, tick } = setup();
    tick(FIRST_DELAY);
    const change = dismiss(floor, 1, 'served');
    if (change) publishChange(bus, change);
    expect(left).toHaveBeenCalledWith({ id: 1, reason: 'served' });
  });
});

const regular: CustomerDef = { id: 'regular', minLevel: 1, patienceSeconds: 60, spendMultiplier: 1, likes: [] };
const king: CustomerDef = { id: 'king', minLevel: 3, patienceSeconds: 30, spendMultiplier: 3, likes: [], vip: true, reputationBonus: 3 };

describe('VIP customers', () => {
  it('never come before their level', () => {
    const rng = createSeededRng(2);
    const picks = Array.from({ length: 500 }, () => pickCustomerType(rng, [regular, king], 2));
    expect(picks.every((p) => p === regular)).toBe(true);
  });

  it('come now and then once their level is reached', () => {
    const rng = createSeededRng(2);
    const picks = Array.from({ length: 4000 }, () => pickCustomerType(rng, [regular, king], 3));
    const share = picks.filter((p) => p === king).length / picks.length;
    expect(share).toBeGreaterThan(VIP_SPAWN.chance * 0.7);
    expect(share).toBeLessThan(VIP_SPAWN.chance * 1.3);
  });

  it('order the most expensive drink the player knows', () => {
    expect(priciestRecipe(fixtureCatalog.recipes)?.id).toBe('cde');
    expect(priciestRecipe([])).toBeUndefined();
    const vipCatalog = { ...patientCatalog, customerTypes: [{ ...king, minLevel: 1 }] };
    const pricey = { ...catalog.recipes[2]!, basePrice: 99 };
    const floor = newFloor(3);
    run(floor, context({ unlockedRecipeIds: ['r1', 'r2', 'r3'] }), 60_000, undefined, {
      ...vipCatalog,
      recipes: [catalog.recipes[0]!, catalog.recipes[1]!, pricey],
    });
    expect(floor.customers.length).toBeGreaterThan(0);
    expect(floor.customers.every((c) => c.vip && c.recipeId === 'r3')).toBe(true);
  });

  it('pay their price and bring their own reputation bonus', () => {
    const floor = floorWith(['king', 'ab']);
    floor.customers[0]!.vip = true;
    const s = station();
    s.ready.push('ab');
    const eco = economy();
    const deps = { floor, station: s, economy: eco, catalog: { ...fixtureCatalog, customerTypes: [king] }, rng: () => 0.5 };
    const outcome = serveCustomer(deps, 1);
    expect(eco.getState().currencies.gold.toNumber()).toBe(30); // 10 x 3
    expect(eco.getState().reputation).toBe(1 + 3);
    expect(outcome).toMatchObject({ kind: 'served', event: { vip: true, extraReputation: 3 } });
  });
});
