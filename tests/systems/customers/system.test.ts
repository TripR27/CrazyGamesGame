import { describe, expect, it, vi } from 'vitest';
import { createEventBus } from '@/core/events';
import type { GameEvents } from '@/core/game-events';
import { createSeededRng } from '@/core/rng';
import { dismiss, publishChange, startCustomerSystem } from '@/systems/customers';
import { catalog, context, FIRST_DELAY, newFloor } from './helpers';

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
