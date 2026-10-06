import { describe, expect, it } from 'vitest';
import { createCharge, readyCustomer, startWantedBrew } from '@/systems/staff';
import { recipes, rng, station } from '../fixtures';

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
