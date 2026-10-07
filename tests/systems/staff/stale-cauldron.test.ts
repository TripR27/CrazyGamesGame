import { describe, expect, it } from 'vitest';
import { ab, catalog, economy, floorWith, rng, station } from '../fixtures';
import { BREWING } from '@/data/brewing';
import { createEventBus, type GameEvents } from '@/shared/events';
import { createStaleWatch } from '@/systems/staff/stale-cauldron';
import { startStaff } from '@/systems/staff/system';

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
