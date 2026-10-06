import { describe, expect, it, vi } from 'vitest';
import { createEventBus } from '@/core/events';
import type { GameEvents } from '@/core/game-events';
import { startBrewSystem } from '@/systems/brewing';
import { waitingCustomers } from '@/systems/customers';
import { startStaff } from '@/systems/staff';
import { ab, catalog, cde, economy, floorWith, rng, station } from '../fixtures';

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
