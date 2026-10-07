import { describe, expect, it, vi } from 'vitest';
import { newGame, playBasics } from './helpers';
import { SERVING } from '@/brewing/brewing';
import { num } from '@/shared/numbers';
import { createInitialState } from '@/shared/state';
import { resolveTarget } from '@/tutorial/tutorial-guide';

const BASICS = ['basics_add', 'basics_finish', 'basics_wait', 'basics_pick', 'basics_serve', 'basics_gold'];

/** The basics lesson is done; `known` are the recipes the player knows. */
function afterBasics(known?: string[]) {
  const state = createInitialState(0);
  state.tutorial.completedSteps = [...BASICS];
  if (known !== undefined) state.recipesDiscovered = known;
  return newGame(state);
}

describe('the preference hint, played in the real game', () => {
  it('starts at the first liked order, points at that customer, and finishes once they are served', () => {
    const game = afterBasics();
    for (let t = 0; t < 300_000 && game.shown() === null; t += 1_000) game.tick(1_000);
    expect(game.shown()).toBe('likes_spot');
    const fan = game.world.scene.floor.customers.find((c) => c.liked);
    expect(resolveTarget('guide-liked', game.guide())).toBe(`customer:${fan?.id}`);

    playBasics(game); // brew what they ordered and serve them
    expect(game.shown()).toBe('likes_done');
    game.tick(6_100);
    expect(game.shown()).toBeNull();
    expect(game.state.tutorial.completedSteps).toEqual(expect.arrayContaining(['likes_spot', 'likes_done']));
  });

  it('is not skipped when the very first customer of the basics already gets a drink they like', () => {
    const state = createInitialState(0);
    state.recipesDiscovered = ['glowcap_stout']; // a speed drink: the knight likes it
    const game = newGame(state);
    game.tick(3_500);
    playBasics(game);
    expect(game.state.tutorial.completedSteps).not.toContain('likes_spot');
  });

  it('stays hidden while nobody orders a drink they like', () => {
    // The knight likes speed and luck; Slime Sap is a charm drink.
    const game = afterBasics(['slime_sap']);
    game.tick(120_000);
    expect(game.shown()).toBeNull();
    expect(game.world.scene.floor.customers.every((c) => !c.liked)).toBe(true);
  });
});

describe('drinking in the real game', () => {
  it('keeps a served customer in the seat for a while, then frees it for the next one', () => {
    const game = afterBasics(['slime_sap']);
    game.tick(4_000);
    playBasics(game);
    const [drinker] = game.world.scene.floor.customers;
    expect(drinker?.drinkMsLeft).toBeGreaterThan(0);
    game.tick(SERVING.drinkMs + 100);
    expect(game.world.scene.floor.customers.some((c) => c.id === drinker?.id)).toBe(false);
  });
});

const EARLIER = [
  'basics_add', 'basics_finish', 'basics_wait', 'basics_pick', 'basics_serve', 'basics_gold', 'likes_spot', 'likes_done',
  'upgrade_open', 'upgrade_buy', 'upgrade_done', 'seats_buy', 'seats_done', 'book_open', 'book_read', 'ingredient_buy', 'ingredient_done', 'staff_hire', 'staff_done',
];

/** Every lesson before the VIP one is done, and the player has `reputation`. */
function withReputation(reputation: number) {
  const state = createInitialState(0);
  state.tutorial.completedSteps = [...EARLIER];
  state.reputation = reputation;
  return newGame(state);
}

describe('reputation levels in the real game', () => {
  it('only make recipes discoverable: customers keep ordering what the player knows', () => {
    const game = withReputation(40);
    game.tick(120_000);
    expect(game.state.recipesDiscovered).toEqual(['slime_sap', 'glowcap_stout']);
    expect(game.world.scene.floor.customers.every((c) => game.state.recipesDiscovered.includes(c.recipeId))).toBe(true);
  });

  it('announce a new level when serving pushes the reputation over the threshold', () => {
    const game = withReputation(9);
    const levelUps = vi.fn();
    game.world.scene.bus.on('reputation:levelUp', levelUps);
    game.tick(4_000);
    playBasics(game);
    expect(levelUps).toHaveBeenCalledWith({ level: 2 });
  });
});

describe('the VIP hint, played in the real game', () => {
  it('points at the first VIP, who wants the priciest known drink, and finishes once they are served', () => {
    const game = withReputation(40);
    for (let t = 0; t < 1_200_000 && game.shown() === null; t += 1_000) game.tick(1_000);
    expect(game.shown()).toBe('vip_spot');
    const vip = game.world.scene.floor.customers.find((c) => c.vip);
    expect(vip?.recipeId).toBe('glowcap_stout');
    expect(resolveTarget('guide-vip', game.guide())).toBe(`customer:${vip?.id}`);

    playBasics(game); // brew the VIP's drink and serve them
    expect(game.shown()).toBe('vip_done');
    game.tick(4_600);
    expect(game.shown()).toBeNull();
  });
});

const BASICS_LIKES = ['basics_add', 'basics_finish', 'basics_wait', 'basics_pick', 'basics_serve', 'basics_gold', 'likes_spot', 'likes_done'];
const UPGRADE = ['upgrade_open', 'upgrade_buy', 'upgrade_done'];
const SEATS = ['seats_buy', 'seats_done', 'book_open', 'book_read', 'ingredient_buy', 'ingredient_done'];

/** A game with the earlier lessons done and `gold` in the till. */
function afterLessons(gold: number, done: string[] = [...BASICS_LIKES, ...UPGRADE, ...SEATS]) {
  const state = createInitialState(0);
  state.tutorial.completedSteps = done;
  state.currencies.gold = num(gold);
  state.upgrades = { extra_seat: 6 }; // several customers, so the staff have work
  return newGame(state);
}

describe('staff in the real game', () => {
  it('a hired brewer and waitress earn gold while the player does nothing', () => {
    const game = afterLessons(10_000);
    const { actions } = game.world.scene;
    actions.buyUpgrade('brewer_assistant', 1);
    actions.buyUpgrade('waitress', 1);
    const before = game.state.currencies.gold.toNumber();
    game.tick(300_000);
    expect(game.state.currencies.gold.toNumber()).toBeGreaterThan(before);
    expect(game.state.reputation).toBeGreaterThan(0);
  });

  it('earn nothing without staff', () => {
    const game = afterLessons(0);
    game.tick(120_000);
    expect(game.state.currencies.gold.toNumber()).toBe(0);
  });

  it('work faster after training', () => {
    const earned = (levels: number): number => {
      const game = afterLessons(1e9);
      for (const id of ['brewer_assistant', 'waitress']) {
        for (let i = 0; i < levels; i++) game.world.scene.actions.buyUpgrade(id, 1);
      }
      const start = game.state.currencies.gold.toNumber();
      game.tick(600_000);
      return game.state.currencies.gold.toNumber() - start;
    };
    expect(earned(5)).toBeGreaterThan(earned(1));
  });
});

describe('the staff hint, played in the real game', () => {
  it('stays hidden and does not slow the game until a hire is affordable', () => {
    const game = afterLessons(0);
    game.tick(60_000);
    expect(game.shown()).toBeNull();
    expect(game.world.scene.floor.customers.length).toBeGreaterThan(1);
  });

  it('starts when the player can pay for a hire, points at the shop, then at the hire', () => {
    const game = afterLessons(0);
    game.store.update((s) => void (s.currencies.gold = num(100)));
    expect(game.shown()).toBe('staff_hire');
    expect(resolveTarget('guide-staff', game.guide())).toBe('panel-button');

    game.world.scene.actions.openShop();
    expect(resolveTarget('guide-staff', game.guide())).toBe('upgrade:brewer_assistant');
    game.world.scene.actions.closeShop();
    expect(resolveTarget('guide-staff', game.guide())).toBe('panel-button');

    game.world.scene.actions.openShop();
    game.world.scene.actions.buyUpgrade('brewer_assistant', 1);
    expect(game.shown()).toBe('staff_done');
    game.tick(4_600);
    expect(game.shown()).toBeNull();
  });

  it('is not triggered by the first shop upgrade alone', () => {
    const game = afterLessons(0, BASICS_LIKES);
    game.store.update((s) => void (s.currencies.gold = num(20)));
    expect(game.shown()).toBe('upgrade_open');
  });

  it('starts at once after a reload when the player already has the gold', () => {
    expect(afterLessons(500).shown()).toBe('staff_hire');
  });
});
