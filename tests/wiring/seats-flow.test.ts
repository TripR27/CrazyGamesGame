import { describe, expect, it } from 'vitest';
import { newGame } from './helpers';
import { SPAWNING } from '@/data/customers/spawning';
import { CUSTOMER_SLOTS } from '@/scene/layout';
import { num } from '@/shared/numbers';
import { createInitialState } from '@/shared/state';
import { resolveTarget } from '@/systems/tutorial/resolve-target';

const DONE = ['basics_add', 'basics_finish', 'basics_wait', 'basics_pick', 'basics_serve', 'basics_gold', 'likes_spot', 'likes_done', 'upgrade_open', 'upgrade_buy', 'upgrade_done'];

const LATER_LESSONS = ['seats_buy', 'seats_done', 'staff_hire', 'staff_done'];

/** The earlier lessons are done (the seat and staff lessons too unless asked), so no hint holds the customers back. */
function afterLessons(gold: number, withSeatLesson = true) {
  const state = createInitialState(0);
  state.tutorial.completedSteps = withSeatLesson ? [...DONE, ...LATER_LESSONS] : [...DONE];
  state.currencies.gold = num(gold);
  return newGame(state);
}

describe('seats', () => {
  it('start at one: a single customer, however long the player waits', () => {
    const game = afterLessons(0);
    game.tick(300_000);
    expect(game.world.scene.floor.customers).toHaveLength(1);
  });

  it('can be bought one by one, and every seat is one more customer at most', () => {
    const game = afterLessons(100_000);
    const { actions, floor } = game.world.scene;
    let most = 0;
    const watch = (ms: number): number => {
      most = 0;
      for (let t = 0; t < ms; t += 1_000) {
        game.tick(1_000);
        most = Math.max(most, floor.customers.length);
      }
      return most;
    };
    expect(watch(300_000)).toBe(1);
    actions.buyUpgrade('extra_seat', 1);
    expect(watch(300_000)).toBe(2);
    actions.buyUpgrade('extra_seat', 'max');
    const crowded = watch(600_000);
    expect(crowded).toBeGreaterThan(2);
    expect(crowded).toBeLessThanOrEqual(CUSTOMER_SLOTS.length);
  });
});

describe('customers come gradually', () => {
  it('bring the first customer after a few seconds, not at once', () => {
    const game = afterLessons(0);
    game.tick(SPAWNING.firstDelayMs - 200);
    expect(game.world.scene.floor.customers).toEqual([]);
    game.tick(300);
    expect(game.world.scene.floor.customers).toHaveLength(1);
  });

  it('wait for the refill delay after a customer leaves, even in a tavern with a free seat', () => {
    const game = afterLessons(0);
    const { floor } = game.world.scene;
    game.tick(20_000); // the customer waits, so the timer sits at the refill delay
    expect(floor.customers).toHaveLength(1);
    floor.customers.length = 0; // the customer leaves
    game.tick(SPAWNING.refillDelayMs - 300);
    expect(floor.customers).toHaveLength(0);
    game.tick(1_000);
    expect(floor.customers).toHaveLength(1);
  });
});

describe('the seat hint, played in the real game', () => {
  it('stays hidden until the player can pay for a seat', () => {
    const game = afterLessons(0, false);
    game.tick(60_000);
    expect(game.shown()).toBeNull();
  });

  it('starts when the player can pay, points at the shop, then at the seat, and finishes', () => {
    const game = afterLessons(0, false);
    game.store.update((s) => void (s.currencies.gold = num(40)));
    expect(game.shown()).toBe('seats_buy');
    expect(resolveTarget('guide-seats', game.guide())).toBe('panel-button');
    game.world.scene.actions.openShop();
    expect(resolveTarget('guide-seats', game.guide())).toBe('upgrade:extra_seat');
    game.world.scene.actions.buyUpgrade('extra_seat', 1);
    expect(game.shown()).toBe('seats_done');
    game.tick(4_600);
    expect(game.shown()).toBeNull();
  });

  it('starts at once after a reload when the player already has the gold', () => {
    expect(afterLessons(500, false).shown()).toBe('seats_buy');
  });
});
