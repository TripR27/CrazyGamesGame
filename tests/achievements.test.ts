import { describe, expect, it, vi } from 'vitest';
import { newGame } from './flows/helpers';
import { ACHIEVEMENTS, statLines, toAchievementToast, toTrophyView } from '@/achievements/achievements';
import { getMultipliers } from '@/economy/upgrades';
import { hasKey } from '@/i18n/translator';
import { PRESTIGE, sellTavern } from '@/prestige/prestige';
import { recipes } from '@/recipes/recipe-data';
import { num } from '@/shared/numbers';
import { createInitialState } from '@/shared/state';
import { resolveTarget } from '@/tutorial/tutorial-guide';
import { TUTORIAL_STEPS } from '@/tutorial/tutorial-steps';

const served = (over: { vip?: boolean; gold?: number } = {}) => ({
  id: 1, seat: 0, recipeId: 'slime_sap', gold: num(over.gold ?? 10), tip: num(2), extraReputation: 0, liked: false, vip: over.vip ?? false, messageKey: '',
});
const returned = (boss: 'won' | 'lost' | null) => ({ id: 'warrior', dungeon: 'swamp', loot: {}, gear: null, xp: 40, level: 1, levelUp: false, injured: false, boss });
const def = (id: string) => ACHIEVEMENTS.find((a) => a.id === id) ?? (() => { throw new Error(`no achievement ${id}`); })();

describe('statistics', () => {
  it('count serves, VIPs, gold, trips and bosses beaten', () => {
    const g = newGame(createInitialState(0));
    g.world.bus.emit('customer:served', served());
    g.world.bus.emit('customer:served', served({ vip: true, gold: 30 }));
    g.world.bus.emit('offline:paid', { gold: num(100) });
    g.world.bus.emit('hero:returned', returned('won'));
    g.world.bus.emit('hero:returned', returned(null));
    const { stats } = g.world.store.getState();
    expect(stats).toMatchObject({ served: 2, vipServed: 1, trips: 2, bossWins: 1 });
    expect(stats.goldEarned.toNumber()).toBe(144);
  });
});

describe('achievements', () => {
  it('are reached once, with an announcement', () => {
    const g = newGame(createInitialState(0));
    const unlocked = vi.fn();
    g.world.bus.on('achievement:unlocked', unlocked);
    g.world.bus.emit('customer:served', served());
    g.world.bus.emit('customer:served', served());
    expect(unlocked).toHaveBeenCalledTimes(1);
    expect(unlocked).toHaveBeenCalledWith({ id: 'first_pint', big: false });
    expect(g.world.store.getState().achievements).toEqual(['first_pint']);
  });

  it('are handed out at the start to a save that reached them before, the great moments marked big', () => {
    const state = createInitialState(0);
    state.recipesDiscovered = recipes.map((r) => r.id);
    const g = newGame(state);
    expect(g.world.store.getState().achievements).toEqual(expect.arrayContaining(['curious', 'recipe_hoarder', 'legend_in_a_glass']));
    expect(def('recipe_hoarder').goal).toBe(recipes.length);
    expect(ACHIEVEMENTS.filter((a) => a.big === true).map((a) => a.id)).toEqual(['recipe_hoarder', 'legend_in_a_glass', 'new_owner']);
  });

  it('each give a small bonus for good', () => {
    const stats = getMultipliers({ upgrades: {}, achievements: ['first_pint', 'packed_house', 'royal_treatment'] });
    expect(stats.sellPrice.toNumber()).toBeCloseTo(1.01);
    expect(stats.brewSpeed.toNumber()).toBeCloseTo(1.03);
    expect(stats.vipChance.toNumber()).toBeCloseTo(getMultipliers({ upgrades: {} }).vipChance.toNumber() * 1.05);
  });

  it('and the statistics stay when the tavern is sold, which is an achievement too', () => {
    const state = createInitialState(0);
    state.reputation = 700;
    state.prestige.runEarned = num(PRESTIGE.hopGold * PRESTIGE.minHops ** 2);
    state.stats.served = 5;
    const g = newGame(state);
    sellTavern(g.world);
    const after = g.world.store.getState();
    expect(after.stats.served).toBe(5);
    expect(after.achievements).toEqual(expect.arrayContaining(['first_pint', 'new_owner']));
  });

  it('have a name, and show their goal, bonus and progress', () => {
    for (const a of ACHIEVEMENTS) expect(hasKey(`achievements.${a.id}.name`)).toBe(true);
    const state = createInitialState(0);
    state.stats.served = 37;
    state.achievements = ['first_pint'];
    expect(toTrophyView(def('regulars'), state)).toEqual({
      id: 'regulars', name: 'The Regulars', text: 'Serve 100 customers · Drinks +2% pricier', progress: '37/100', reached: false,
    });
    expect(toTrophyView(def('first_pint'), state)).toMatchObject({ reached: true, progress: '' });
    expect(toAchievementToast('first_pint')).toEqual({ title: '🏆 First Pint!', lines: ['Drinks +1% pricier', 'All trophies are in the Trophies tab.'] });
    expect(statLines(state)[0]).toBe('Customers served: 37');
  });
});

describe('the trophy lesson', () => {
  it('follows the upgrade lesson: the way to the Trophies tab, then the list', () => {
    const state = createInitialState(0);
    const upTo = TUTORIAL_STEPS.findIndex((s) => s.lesson === 'trophy');
    state.tutorial.completedSteps = TUTORIAL_STEPS.slice(0, upTo).map((s) => s.id);
    state.achievements = ['first_pint'];
    const g = newGame(state);
    expect(g.shown()).toBe('trophy_open');
    expect(resolveTarget('guide-trophies', { ...g.guide(), openTab: null })).toBe('panel-button');
    expect(resolveTarget('guide-trophies', { ...g.guide(), openTab: 'shop' })).toBe('tab:trophies');
    g.world.bus.emit('trophies:opened', {});
    expect(g.shown()).toBe('trophy_done');
    g.tick(6_100);
    expect(g.shown()).toBe('daily_claim');
  });
});
