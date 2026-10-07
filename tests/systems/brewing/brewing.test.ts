import { describe, expect, it, vi } from 'vitest';
import { recipes, rng, station } from '../fixtures';
import { createEventBus, type GameEvents } from '@/shared/events';
import { addIngredient } from '@/systems/brewing/add-ingredient';
import { advanceBrewing, brewProgress } from '@/systems/brewing/advance';
import { emptyCauldron } from '@/systems/brewing/station';
import { startBrewSystem } from '@/systems/brewing/system';

function brewing() {
  const s = station();
  addIngredient(s, 'a', recipes, rng());
  addIngredient(s, 'b', recipes, rng());
  return s;
}

describe('brew timer', () => {
  it('shows progress and keeps the drink in the cauldron until the time is up', () => {
    const s = brewing();
    expect(brewProgress(s)).toBe(0);
    expect(advanceBrewing(s, 500)).toEqual([]);
    expect(brewProgress(s)).toBeCloseTo(0.25, 5);
    expect(s.ready).toEqual([]);
  });

  it('puts the finished drink on the bar and frees the cauldron', () => {
    const s = brewing();
    expect(advanceBrewing(s, 2000)).toEqual([{ kind: 'done', recipeId: 'ab' }]);
    expect(s.ready).toEqual(['ab']);
    expect(s.brewing).toBeNull();
    expect(brewProgress(s)).toBe(0);
  });

  it('does nothing when idle', () => {
    expect(advanceBrewing(station(), 1000)).toEqual([]);
  });

  it('is driven by the game tick and announces the result on the bus', () => {
    const bus = createEventBus<GameEvents>();
    const s = brewing();
    const done = vi.fn();
    bus.on('brew:done', done);
    const stop = startBrewSystem(s, bus);
    for (let t = 0; t < 2000; t += 100) bus.emit('tick', { deltaMs: 100 });
    expect(done).toHaveBeenCalledWith({ recipeId: 'ab' });
    stop();
    s.brewing = { recipeId: 'ab', remainingMs: 100, totalMs: 100 };
    bus.emit('tick', { deltaMs: 100 });
    expect(done).toHaveBeenCalledTimes(1);
  });
});

describe('emptying the cauldron', () => {
  it('throws away the contents, but not while brewing', () => {
    const s = station();
    addIngredient(s, 'c', recipes, rng());
    expect(emptyCauldron(s)).toBe(true);
    expect(s.contents).toEqual([]);
    expect(emptyCauldron(s)).toBe(false);

    const b = brewing();
    expect(emptyCauldron(b)).toBe(false);
    expect(b.brewing).not.toBeNull();
  });
});
