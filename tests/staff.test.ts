import { describe, expect, it, vi } from 'vitest';
import { recipes, rng, station, ab, catalog, cde, economy, floorWith } from './fixtures';
import { startBrewSystem, BREWING } from '@/brewing/brewing';
import { waitingCustomers } from '@/customers/customers';
import { createEventBus, type GameEvents } from '@/shared/events';
import { startWantedBrew, readyCustomer, createCharge, startStaff, createStaleWatch } from '@/staff/staff';

describe('a worker pace', () => {
  it('is ready after enough time for one action and spends it', () => {
    const charge = createCharge();
    charge.fill(5000, 0.1);
    expect(charge.ready()).toBe(false);
    charge.fill(5000, 0.1);
    expect(charge.ready()).toBe(true);
    charge.spend();
    expect(charge.ready()).toBe(false);
  });

  it('never saves up more than one action while idle', () => {
    const charge = createCharge();
    charge.fill(1_000_000, 1);
    charge.spend();
    expect(charge.ready()).toBe(false);
  });
});

describe('the brewer assistant', () => {
  it('starts the drink the oldest waiting customer wants', () => {
    const s = station();
    const events = startWantedBrew(s, [{ recipeId: 'cde' }, { recipeId: 'ab' }], recipes, rng());
    expect(events).toEqual([{ kind: 'started', recipeId: 'cde' }]);
    expect(s.brewing?.recipeId).toBe('cde');
  });

  it('skips a drink that already stands on the bar and takes the next one', () => {
    const s = station();
    s.ready.push('cde');
    startWantedBrew(s, [{ recipeId: 'cde' }, { recipeId: 'ab' }], recipes, rng());
    expect(s.brewing?.recipeId).toBe('ab');
  });

  it('does nothing while brewing, with ingredients in the cauldron, with a full bar or without customers', () => {
    const busy = station();
    busy.brewing = { recipeId: 'ab', remainingMs: 1, totalMs: 1 };
    const half = station();
    half.contents = ['a'];
    const full = station(1);
    full.ready.push('ab');
    for (const s of [busy, half, full]) expect(startWantedBrew(s, [{ recipeId: 'cde' }], recipes, rng())).toEqual([]);
    expect(startWantedBrew(station(), [], recipes, rng())).toEqual([]);
    expect(half.contents).toEqual(['a']);
  });
});

describe('the waitress', () => {
  it('picks the oldest customer whose drink is ready', () => {
    const s = station();
    s.ready.push('ab');
    const waiting = [{ id: 1, recipeId: 'cde' }, { id: 2, recipeId: 'ab' }];
    expect(readyCustomer(waiting, s)).toBe(2);
    expect(readyCustomer([{ id: 1, recipeId: 'cde' }], s)).toBeUndefined();
  });
});

function crew(rates: { brew: number; serve: number }, orders: Array<[string, string]>) {
  const bus = createEventBus<GameEvents>();
  const s = station();
  const eco = economy();
  const floor = floorWith(...orders);
  startBrewSystem(s, bus);
  startStaff({
    bus, station: s, floor, rng: rng(), serve: { economy: eco, catalog },
    getKnownRecipes: () => [ab, cde], getRates: () => rates,
  });
  const served = vi.fn();
  bus.on('customer:served', served);
  const run = (ms: number): void => {
    for (let t = 0; t < ms; t += 100) bus.emit('tick', { deltaMs: 100 });
  };
  return { run, served, eco, floor, s };
}

describe('staff at work', () => {
  it('do nothing when nobody is hired', () => {
    const { run, served, s } = crew({ brew: 0, serve: 0 }, [['plain', 'ab']]);
    run(60_000);
    expect(s.brewing).toBeNull();
    expect(s.ready).toEqual([]);
    expect(served).not.toHaveBeenCalled();
  });

  it('brew, serve and earn without the player doing anything', () => {
    const { run, served, eco, floor } = crew({ brew: 0.2, serve: 0.2 }, [['plain', 'ab']]);
    run(30_000);
    expect(served).toHaveBeenCalledTimes(1);
    expect(waitingCustomers(floor)).toEqual([]);
    expect(eco.getState().currencies.gold.toNumber()).toBe(10);
    expect(eco.getState().reputation).toBe(1);
  });

  it('work slower with a lower pace', () => {
    const slow = crew({ brew: 0.02, serve: 0.02 }, [['plain', 'ab']]);
    slow.run(30_000);
    expect(slow.served).not.toHaveBeenCalled();
  });

  it('keep a customer waiting without brewing a drink nobody asked for', () => {
    const { run, s } = crew({ brew: 1, serve: 1 }, []);
    run(10_000);
    expect(s.brewing).toBeNull();
    expect(s.ready).toEqual([]);
  });
});

describe('a stale cauldron', () => {
  it('counts as stale only after the same contents sat there for the limit', () => {
    const watch = createStaleWatch(1000);
    expect(watch.isStale(['a'], 900)).toBe(false);
    expect(watch.isStale(['a'], 100)).toBe(false); // first look at these contents starts the count
    expect(watch.isStale(['a'], 1000)).toBe(true);
  });

  it('starts over when the contents change, and never counts an empty cauldron', () => {
    const watch = createStaleWatch(1000);
    watch.isStale(['a'], 0);
    watch.isStale(['a'], 900);
    expect(watch.isStale(['a', 'b'], 900)).toBe(false);
    expect(watch.isStale([], 5000)).toBe(false);
  });
});

describe('the brewer and a cauldron the player left behind', () => {
  function crew(brew: number) {
    const bus = createEventBus<GameEvents>();
    const s = station();
    s.contents = ['c'];
    const floor = floorWith(['plain', 'ab']);
    startStaff({
      bus, station: s, floor, rng: rng(),
      serve: { economy: economy(), catalog },
      getKnownRecipes: () => [ab],
      getRates: () => ({ brew, serve: 0 }),
    });
    const run = (ms: number): void => {
      for (let t = 0; t < ms; t += 100) bus.emit('tick', { deltaMs: 100 });
    };
    return { s, run };
  }

  it('clears it after a while and gets back to work', () => {
    const { s, run } = crew(1);
    run(BREWING.staleCauldronMs - 1000);
    expect(s.contents).toEqual(['c']);
    run(2000);
    expect(s.brewing?.recipeId).toBe('ab');
  });

  it('is left alone when nobody is hired', () => {
    const { s, run } = crew(0);
    run(BREWING.staleCauldronMs * 2);
    expect(s.contents).toEqual(['c']);
  });
});
