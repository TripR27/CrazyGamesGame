import { describe, expect, it, vi } from 'vitest';
import { newGame } from './flows/helpers';
import { getMultipliers } from '@/economy/upgrades';
import { newHero } from '@/heroes/heroes';
import { hasKey } from '@/i18n/translator';
import { buyLegacy, canSell, hopsFor, LEGACY, legacyCost, PRESTIGE, sellTavern, startGold, toLegacyView } from '@/prestige/prestige';
import { GUILD_ROOM_ID } from '@/rooms/rooms';
import { num } from '@/shared/numbers';
import { createInitialState, type GameState } from '@/shared/state';
import { resolveTarget } from '@/tutorial/tutorial-guide';
import { TUTORIAL_STEPS } from '@/tutorial/tutorial-steps';

/** Gold that brings exactly `hops` Golden Hop. */
const goldFor = (hops: number) => num(PRESTIGE.hopGold * hops * hops);

/** A tavern at Legendary Hall that earned enough for `hops` Golden Hop, with a bit of everything bought. */
function legendary(hops: number = PRESTIGE.minHops): GameState {
  const state = createInitialState(123);
  state.reputation = 700;
  state.currencies.gold = num(77_000);
  state.recipesDiscovered = [...state.recipesDiscovered, 'bog_lantern'];
  state.upgrades = { swift_cauldron: 5, waitress: 2 };
  state.roomsBuilt = [GUILD_ROOM_ID];
  state.decorBought = ['wall_torch'];
  state.ingredientsBought = ['fire_pepper'];
  state.heroes = { warrior: { ...newHero(), level: 5 } };
  state.ingredientStock = { bog_pearl: 3 };
  state.gearOwned = ['rusty_sword'];
  state.quartermaster = true;
  state.tutorial.skipped = true;
  state.prestige.runEarned = goldFor(hops);
  return state;
}

describe('Golden Hop', () => {
  it('come from the gold earned in a run, as a square root', () => {
    expect(hopsFor(num(0))).toBe(0);
    expect(hopsFor(goldFor(1))).toBe(1);
    expect(hopsFor(goldFor(4).sub(1))).toBe(3);
    expect(hopsFor(goldFor(5))).toBe(5);
  });

  it('can be cashed in from Legendary Hall with at least the minimum', () => {
    expect(canSell(legendary())).toBe(true);
    expect(canSell(legendary(PRESTIGE.minHops - 1))).toBe(false);
    expect(canSell({ ...legendary(), reputation: 600 })).toBe(false);
  });

  it('make drinks pricier for good, and the Legacy adds its bonuses', () => {
    const prestige = { totalHops: 3, legacy: { copper_kettle: 2, night_watch: 1, staff_handbook: 1 } };
    const stats = getMultipliers({ upgrades: { waitress: 1 }, prestige });
    expect(stats.sellPrice.toNumber()).toBeCloseTo(1 + 3 * PRESTIGE.pricePerHop);
    expect(stats.brewSpeed.toNumber()).toBeCloseTo(1.21);
    expect(stats.offlineHours.toNumber()).toBe(3);
    expect(stats.autoServe.toNumber()).toBeCloseTo(getMultipliers({ upgrades: { waitress: 1 } }).autoServe.toNumber() * 1.15);
    expect(getMultipliers({ upgrades: {} }).sellPrice.toNumber()).toBe(1);
  });
});

describe('selling the tavern', () => {
  it('starts over, but keeps the recipes, the tutorial and the Golden Hop', () => {
    const state = legendary(5);
    state.prestige.legacy = { seed_money: 2 };
    const g = newGame(state);
    const done = vi.fn();
    g.world.bus.on('prestige:done', done);
    sellTavern(g.world);
    const after = g.world.store.getState();
    expect(done).toHaveBeenCalledWith({ hops: 5 });
    expect(after.currencies.gold.toNumber()).toBe(2000);
    expect(after).toMatchObject({ reputation: 0, upgrades: {}, roomsBuilt: [], decorBought: [], ingredientsBought: [], heroes: {}, ingredientStock: {}, gearOwned: [], quartermaster: false });
    expect(after.recipesDiscovered).toContain('bog_lantern');
    expect(after.tutorial.skipped).toBe(true);
    expect(after.meta.createdAt).toBe(123);
    expect(after.prestige).toMatchObject({ hops: 5, totalHops: 5, runs: 1, legacy: { seed_money: 2 } });
    expect(after.prestige.runEarned.toNumber()).toBe(0);
    // Not again: the new tavern earned nothing yet.
    sellTavern(g.world);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('announces the reputation levels again in the new tavern', () => {
    const g = newGame(legendary());
    const levels = vi.fn();
    g.world.bus.on('reputation:levelUp', levels);
    sellTavern(g.world);
    g.world.store.update((s) => void (s.reputation = 12));
    expect(levels).toHaveBeenCalledWith({ level: 2 });
  });

  it('counts the gold earned by serving and while away', () => {
    const g = newGame(createInitialState(0));
    const served = { id: 1, seat: 0, recipeId: 'slime_sap', gold: num(30), tip: num(5), extraReputation: 0, liked: false, vip: false, messageKey: '' };
    g.world.bus.emit('customer:served', served);
    g.world.bus.emit('offline:paid', { gold: num(100) });
    expect(g.world.store.getState().prestige.runEarned.toNumber()).toBe(135);
  });

  it('says when it can be sold', () => {
    const state = legendary();
    state.prestige.runEarned = goldFor(PRESTIGE.minHops).sub(10);
    const g = newGame(state);
    const available = vi.fn();
    g.world.bus.on('prestige:available', available);
    g.world.bus.emit('offline:paid', { gold: num(10) });
    expect(available).toHaveBeenCalledTimes(1);
  });
});

describe('the Legacy', () => {
  it('sells levels for Golden Hop, each one dearer, up to the top', () => {
    const state = createInitialState(0);
    state.prestige.hops = 3;
    const g = newGame(state);
    buyLegacy(g.world, 'copper_kettle');
    buyLegacy(g.world, 'copper_kettle');
    expect(g.world.store.getState().prestige).toMatchObject({ hops: 0, legacy: { copper_kettle: 2 } });
    buyLegacy(g.world, 'copper_kettle');
    expect(g.world.store.getState().prestige.legacy.copper_kettle).toBe(2);
    const top = LEGACY.find((d) => d.id === 'night_watch');
    if (top === undefined) throw new Error('no night_watch');
    expect(legacyCost({ legacy: { night_watch: top.maxLevel } }, top)).toBeUndefined();
    expect(startGold({ legacy: { seed_money: 3 } })).toBe(3000);
  });

  it('shows what selling needs, or what it brings', () => {
    expect(toLegacyView({ ...legendary(), reputation: 10 }).sellText).toMatch(/Reach Legendary Hall/);
    expect(toLegacyView(legendary(2)).sellText).toMatch(/needs 4 Golden Hop/);
    const ready = toLegacyView(legendary(6));
    expect(ready.canSell).toBe(true);
    expect(ready.sellLabel).toBe('Sell the tavern · 🌼 6');
    expect(ready.rows.map((r) => r.id)).toEqual(LEGACY.map((d) => d.id));
  });

  it('has a name and a description for every bonus', () => {
    for (const def of LEGACY) {
      expect(hasKey(`legacy.${def.id}.name`)).toBe(true);
      expect(hasKey(`legacy.${def.id}.description`)).toBe(true);
    }
  });
});

describe('the prestige lesson', () => {
  it('points at the sell button, then at a bonus to spend the Golden Hop on', () => {
    const state = legendary();
    state.tutorial = { completedSteps: TUTORIAL_STEPS.filter((s) => s.lesson !== 'prestige').map((s) => s.id), skipped: false };
    const g = newGame(state);
    expect(g.shown()).toBe('prestige_sell');
    expect(resolveTarget('guide-prestige-sell', { ...g.guide(), openTab: null })).toBe('panel-button');
    expect(resolveTarget('guide-prestige-sell', { ...g.guide(), openTab: 'legacy' })).toBe('prestige-sell');
    sellTavern(g.world);
    expect(g.shown()).toBe('prestige_spend');
    expect(resolveTarget('guide-legacy-buy', { ...g.guide(), openTab: 'legacy' })).toBe('legacy-buy:copper_kettle');
    buyLegacy(g.world, 'copper_kettle');
    expect(g.shown()).toBeNull();
  });
});
