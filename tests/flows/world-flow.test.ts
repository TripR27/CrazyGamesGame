import { describe, expect, it, vi } from 'vitest';
import { newGame } from './helpers';
import { CUSTOMER_SLOTS } from '@/app/layout';
import { SPAWNING } from '@/customers/customer-data';
import type { OfflineReport } from '@/offline/offline';
import { num } from '@/shared/numbers';
import { createInitialState } from '@/shared/state';
import { resolveTarget } from '@/tutorial/tutorial-guide';

const EARLIER = [
  'basics_add', 'basics_finish', 'basics_wait', 'basics_pick', 'basics_serve', 'basics_gold', 'likes_spot', 'likes_done',
  'upgrade_open', 'upgrade_buy', 'upgrade_done', 'seats_buy', 'seats_done',
];

/** The lessons before the book lesson are done, and the player has `reputation`. */
function withReputation(reputation: number, done: string[] = EARLIER) {
  const state = createInitialState(0);
  state.tutorial.completedSteps = [...done];
  state.reputation = reputation;
  return newGame(state);
}

describe('discovering recipes in the real game', () => {
  it('turns a new combination into a known recipe with a "Eureka!", and brews it', () => {
    const game = withReputation(10, [...EARLIER, 'book_open', 'book_read']);
    const discovered = vi.fn();
    game.world.scene.bus.on('recipe:discovered', discovered);
    game.world.scene.actions.clickIngredient('swamp_slime');
    game.world.scene.actions.clickIngredient('glowcap');
    expect(discovered).toHaveBeenCalledWith({ recipeId: 'bog_lantern' });
    expect(game.state.recipesDiscovered).toContain('bog_lantern');
    expect(game.world.scene.station.brewing?.recipeId).toBe('bog_lantern');
  });

  it('puts a new ingredient on the shelf only once it is bought, and then its recipes can be discovered', () => {
    const game = withReputation(10, [...EARLIER, 'book_open', 'book_read']);
    const { actions } = game.world.scene;
    expect(game.world.scene.getShelf()).toEqual(['swamp_slime', 'wild_honey', 'glowcap']);
    actions.clickIngredient('wild_honey');
    actions.clickIngredient('fire_pepper'); // not on the shelf yet: Dragon's Hiccup cannot be discovered
    expect(game.state.recipesDiscovered).not.toContain('dragons_hiccup');
    actions.clickCauldron();
    game.store.update((s) => void (s.currencies.gold = num(100)));
    actions.buyIngredient('fire_pepper');
    expect(game.world.scene.getShelf()).toContain('fire_pepper');
    expect(game.state.currencies.gold.toNumber()).toBe(60);
    actions.clickIngredient('fire_pepper');
    actions.clickIngredient('wild_honey');
    expect(game.state.recipesDiscovered).toContain('dragons_hiccup');
  });

  it('lets the same combination fizzle at the first level', () => {
    const game = withReputation(0);
    game.world.scene.actions.clickIngredient('swamp_slime');
    game.world.scene.actions.clickIngredient('glowcap');
    expect(game.world.scene.station.brewing).toBeNull();
    expect(game.state.recipesDiscovered).not.toContain('bog_lantern');
  });
});

describe('the recipe book hint, played in the real game', () => {
  it('starts at the second level, points at the book, then at the open book', () => {
    const game = withReputation(9);
    expect(game.shown()).toBeNull();
    game.store.update((s) => void (s.reputation = 10));
    expect(game.shown()).toBe('book_open');
    expect(resolveTarget('guide-book', game.guide())).toBe('panel-button');
    game.world.scene.actions.openShop(); // the panel unfolds on the shop tab first
    expect(resolveTarget('guide-book', game.guide())).toBe('tab:recipes');
    game.world.scene.actions.closeShop();
    game.world.scene.actions.openBook();
    expect(game.shown()).toBe('book_read');
    game.tick(7_100);
    expect(game.shown()).toBeNull();
  });

  it('is not skipped, and does not skip earlier lessons, when the player opens the Recipes tab early', () => {
    const game = withReputation(0, ['basics_add', 'basics_finish', 'basics_wait', 'basics_pick', 'basics_serve', 'basics_gold']);
    game.world.scene.actions.openBook();
    game.world.scene.actions.openShop();
    expect(game.state.tutorial.completedSteps).toHaveLength(6);
  });

  it('starts at once after a reload when the level is already reached', () => {
    expect(withReputation(30).shown()).toBe('book_open');
  });
});

const HOUR = 3_600_000;
const STAFFED = { brewer_assistant: 1, waitress: 1 };

function away(hours: number, upgrades: Record<string, number> = STAFFED) {
  const state = createInitialState(0);
  state.upgrades = upgrades;
  const game = newGame(state);
  const reports: OfflineReport[] = [];
  game.world.offline.inbox.subscribe((r) => reports.push(r));
  game.world.offline.handleAway(hours * HOUR);
  return { ...game, reports };
}

describe('coming back after being away', () => {
  it('pays what the hired staff earned and shows the welcome window', () => {
    const { state, reports, saves } = away(1);
    expect(state.currencies.gold.gt(0)).toBe(true);
    expect(state.reputation).toBeGreaterThan(0);
    expect(reports).toHaveLength(1);
    expect(reports[0]?.served).toBeGreaterThan(0);
    expect(saves).toHaveBeenCalled();
  });

  it('earns nothing without staff but still welcomes the player back', () => {
    const { state, reports } = away(1, {});
    expect(state.currencies.gold.toNumber()).toBe(0);
    expect(reports[0]).toMatchObject({ served: 0, hadStaff: false });
  });

  it('stops counting at the two hour limit', () => {
    const two = away(2).state.currencies.gold;
    expect(away(24).state.currencies.gold.eq(two)).toBe(true);
  });

  it('counts a short gap silently: gold, but no welcome window', () => {
    const state = createInitialState(0);
    state.upgrades = STAFFED;
    const game = newGame(state);
    const posted = vi.fn();
    game.world.offline.inbox.subscribe(posted);
    game.world.offline.handleAway(30_000);
    expect(posted).not.toHaveBeenCalled();
    game.world.offline.handleAway(30 * 60_000);
    expect(posted).toHaveBeenCalledTimes(1);
  });

  it('marks the time as counted so the same gap is not paid twice', () => {
    const { state } = away(1);
    expect(state.meta.lastSeenAt).toBeGreaterThan(0);
  });

  it('ignores a gap of zero or less', () => {
    const { state, reports } = away(0);
    expect(state.currencies.gold.toNumber()).toBe(0);
    expect(reports).toEqual([]);
  });
});

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
