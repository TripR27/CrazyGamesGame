import { describe, expect, it, vi } from 'vitest';
import { recipes, rng, station, ab, catalog, cde, economy, floorWith } from './fixtures';
import { startBrewSystem } from '@/brewing/brewing';
import { waitingCustomers } from '@/customers/customers';
import { createEventBus, type GameEvents } from '@/shared/events';
import { advanceKettle, barClogged, createCharge, createKettle, readyCustomer, STAFF, startKettle, startStaff, unwantedSlot, wantedRecipe } from '@/staff/staff';

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
  it('starts, in their own kettle, the drink the oldest waiting customer wants', () => {
    const s = station();
    const kettle = createKettle();
    expect(startKettle(kettle, s, [{ recipeId: 'cde' }, { recipeId: 'ab' }], recipes)?.id).toBe('cde');
    expect(kettle.brewing?.recipeId).toBe('cde');
    expect(s.brewing).toBeNull();
  });

  it('skips an order a drink on the bar or in a cauldron already answers, one drink per order', () => {
    const s = station();
    s.ready.push('cde');
    expect(wantedRecipe([{ recipeId: 'cde' }, { recipeId: 'ab' }], s.ready, recipes)?.id).toBe('ab');
    expect(wantedRecipe([{ recipeId: 'cde' }, { recipeId: 'cde' }], ['cde'], recipes)?.id).toBe('cde');
    s.brewing = { recipeId: 'ab', remainingMs: 1, totalMs: 1 };
    expect(startKettle(createKettle(), s, [{ recipeId: 'cde' }, { recipeId: 'ab' }], recipes)).toBeUndefined();
  });

  it('works next to the player: ingredients in the cauldron or a brew there do not stop the kettle', () => {
    const s = station();
    s.contents = ['a'];
    expect(startKettle(createKettle(), s, [{ recipeId: 'cde' }], recipes)?.id).toBe('cde');
    expect(s.contents).toEqual(['a']);
  });

  it('waits while the kettle is busy, the bar has no room (keeping one for the player), or nobody waits', () => {
    const busy = createKettle();
    busy.brewing = { recipeId: 'ab', remainingMs: 1, totalMs: 1 };
    expect(startKettle(busy, station(), [{ recipeId: 'cde' }], recipes)).toBeUndefined();
    const full = station(1);
    full.ready.push('ab');
    expect(startKettle(createKettle(), full, [{ recipeId: 'cde' }], recipes)).toBeUndefined();
    const playerBrewing = station(1);
    playerBrewing.brewing = { recipeId: 'ab', remainingMs: 1, totalMs: 1 };
    expect(startKettle(createKettle(), playerBrewing, [{ recipeId: 'cde' }], recipes)).toBeUndefined();
    expect(startKettle(createKettle(), station(), [], recipes)).toBeUndefined();
  });

  it('puts a finished drink on the bar, or keeps it in the kettle until there is room', () => {
    const s = station(1);
    const kettle = createKettle();
    startKettle(kettle, s, [{ recipeId: 'ab' }], recipes);
    s.ready.push('cde');
    expect(advanceKettle(kettle, s, 5000)).toBeUndefined();
    expect(kettle.done).toBe('ab');
    s.ready.pop();
    expect(advanceKettle(kettle, s, 100)).toBe('ab');
    expect(s.ready).toEqual(['ab']);
    expect(kettle).toEqual({ brewing: null, done: null });
  });
});

describe('a clogged bar', () => {
  it('finds the oldest drink no waiting customer wants', () => {
    expect(unwantedSlot(['ab', 'cde', 'ab'], [{ recipeId: 'ab' }, { recipeId: 'cde' }])).toBe(2);
    expect(unwantedSlot(['ab'], [{ recipeId: 'ab' }])).toBe(-1);
    expect(unwantedSlot(['cde', 'ab'], [{ recipeId: 'ab' }])).toBe(0);
  });

  it('is full and holds a drink nobody wants', () => {
    const s = station(2);
    s.ready.push('ab', 'cde');
    expect(barClogged(s, [{ recipeId: 'ab' }])).toBe(true);
    expect(barClogged(s, [{ recipeId: 'ab' }, { recipeId: 'cde' }])).toBe(false);
    s.ready.pop();
    expect(barClogged(s, [])).toBe(false);
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

function crew(rates: { brew: number; serve: number }, orders: Array<[string, string]>, capacity = 3) {
  const bus = createEventBus<GameEvents>();
  const s = station(capacity);
  const kettle = createKettle();
  const eco = economy();
  const floor = floorWith(...orders);
  startBrewSystem(s, bus);
  startStaff({
    bus, station: s, kettle, floor, rng: rng(), serve: { economy: eco, catalog },
    getKnownRecipes: () => [ab, cde], getRates: () => rates,
  });
  const served = vi.fn();
  const discarded = vi.fn();
  bus.on('customer:served', served);
  bus.on('drink:discarded', discarded);
  const run = (ms: number): void => {
    for (let t = 0; t < ms; t += 100) bus.emit('tick', { deltaMs: 100 });
  };
  return { run, served, discarded, eco, floor, s, kettle };
}

describe('staff at work', () => {
  it('do nothing when nobody is hired', () => {
    const { run, served, s, kettle } = crew({ brew: 0, serve: 0 }, [['plain', 'ab']]);
    run(60_000);
    expect(kettle.brewing).toBeNull();
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
    const { run, s, kettle } = crew({ brew: 1, serve: 1 }, []);
    run(10_000);
    expect(kettle.brewing).toBeNull();
    expect(s.ready).toEqual([]);
  });

  it(`tip away the oldest drink nobody wants once the bar was clogged for ${STAFF.clearAfterMs / 1000} s`, () => {
    const { run, s, discarded } = crew({ brew: 0, serve: 0.1 }, [['plain', 'ab']], 2);
    s.ready.push('cde', 'cde');
    run(STAFF.clearAfterMs - 1000);
    expect(s.ready).toEqual(['cde', 'cde']);
    run(1100);
    expect(s.ready).toEqual(['cde']);
    expect(discarded).toHaveBeenCalledWith(expect.objectContaining({ recipeId: 'cde', by: 'staff' }));
  });

  it('leave a clogged bar alone when nobody is hired', () => {
    const { run, s } = crew({ brew: 0, serve: 0 }, [['plain', 'ab']], 2);
    s.ready.push('cde', 'cde');
    run(STAFF.clearAfterMs * 2);
    expect(s.ready).toEqual(['cde', 'cde']);
  });
});
