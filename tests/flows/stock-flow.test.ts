import { describe, expect, it, vi } from 'vitest';
import { newGame } from './helpers';
import { ACHIEVEMENTS } from '@/achievements/achievements';
import { clickIngredient } from '@/brewing/brewing';
import {
  brewableRecipes, ingredients, orderableRecipeIds, ownedIngredients, shelfCount, shelfIds, usableIngredientIds, usesStock,
} from '@/brewing/ingredients';
import { newHero } from '@/heroes/heroes';
import { recipes } from '@/recipes/recipe-data';
import { toBookView } from '@/recipes/recipes';
import { GUILD_ROOM_ID } from '@/rooms/rooms';
import { num } from '@/shared/numbers';
import { createInitialState, type GameState } from '@/shared/state';
import { TUTORIAL_STEPS } from '@/tutorial/tutorial-steps';

const catalog = { ingredients, recipes };

/** A save at Legendary Hall with every shop ingredient bought, the guild hall and the warrior. */
function late(stock: Record<string, number> = {}, known: string[] = []): GameState {
  const state = createInitialState(0);
  state.reputation = 700;
  state.currencies.gold = num(1000);
  state.tutorial.skipped = true;
  state.ingredientsBought = ['fire_pepper', 'moon_grape', 'troll_sweat'];
  state.roomsBuilt = [GUILD_ROOM_ID];
  state.heroes = { warrior: newHero() };
  state.ingredientStock = stock;
  state.recipesDiscovered.push(...known);
  return state;
}

describe('dungeon ingredients on the shelf', () => {
  it('stand on the shelf once found, with their count, also when the stock ran out', () => {
    expect(ownedIngredients(late(), ingredients, recipes).map((i) => i.id)).not.toContain('bog_pearl');
    const g = newGame(late({ bog_pearl: 0, witch_moss: 2 }));
    expect(shelfIds(g.world)).toEqual(expect.arrayContaining(['bog_pearl', 'witch_moss']));
    expect(shelfCount(g.world, 'witch_moss')).toBe(2);
    expect(shelfCount(g.world, 'bog_pearl')).toBe(0);
    expect(shelfCount(g.world, 'wild_honey')).toBeNull();
    expect(usableIngredientIds(g.world)).not.toContain('bog_pearl');
    expect(usableIngredientIds(g.world)).toContain('witch_moss');
  });

  it('do nothing but grumble when clicked with an empty stock', () => {
    const g = newGame(late({ bog_pearl: 0 }));
    const notice = vi.fn();
    g.world.bus.on('brew:notice', notice);
    clickIngredient(g.world, 'bog_pearl');
    expect(g.world.station.contents).toEqual([]);
    expect(notice).toHaveBeenCalledWith(expect.objectContaining({ notice: 'empty', messageKey: expect.stringMatching(/^feedback\.empty\.[12]$/) }));
  });
});

describe('brewing with a dungeon ingredient', () => {
  it('discovers the recipe and uses up one of each dungeon ingredient', () => {
    const g = newGame(late({ bog_pearl: 2, witch_moss: 1 }));
    clickIngredient(g.world, 'bog_pearl');
    clickIngredient(g.world, 'wild_honey');
    expect(g.state.recipesDiscovered).toContain('pearl_mead');
    expect(g.state.ingredientStock).toEqual({ bog_pearl: 1, witch_moss: 1 });
    g.tick(30_000);
    clickIngredient(g.world, 'bog_pearl');
    clickIngredient(g.world, 'witch_moss');
    clickIngredient(g.world, 'fire_pepper');
    expect(g.state.recipesDiscovered).toContain('bog_royale');
    expect(g.state.ingredientStock).toEqual({ bog_pearl: 0, witch_moss: 0 });
    expect(g.saves).toHaveBeenCalled();
  });

  it('lets the brewer only brew such a drink while it is in stock', () => {
    expect(brewableRecipes(late({ bog_pearl: 0 }, ['pearl_mead']), catalog).map((r) => r.id)).not.toContain('pearl_mead');
    expect(brewableRecipes(late({ bog_pearl: 1 }, ['pearl_mead']), catalog).map((r) => r.id)).toContain('pearl_mead');
  });
});

describe('ordering a drink with a dungeon ingredient', () => {
  it('is the known recipes as they are while no dungeon drink is known', () => {
    const state = late();
    expect(orderableRecipeIds(state, catalog, [])).toBe(state.recipesDiscovered);
  });

  it('only happens while the stock covers it, on top of the orders already waiting', () => {
    const state = late({ bog_pearl: 1 }, ['pearl_mead']);
    expect(orderableRecipeIds(state, catalog, [])).toContain('pearl_mead');
    expect(orderableRecipeIds(state, catalog, [{ recipeId: 'pearl_mead' }])).not.toContain('pearl_mead');
    expect(orderableRecipeIds(state, catalog, [{ recipeId: 'slime_sap' }])).toContain('pearl_mead');
    state.ingredientStock.bog_pearl = 0;
    expect(orderableRecipeIds(state, catalog, [])).not.toContain('pearl_mead');
    expect(orderableRecipeIds(state, catalog, [])).toContain('slime_sap');
  });

  it('never makes customers order it in the tavern without stock', () => {
    const state = late({ bog_pearl: 0 }, ['pearl_mead']);
    state.upgrades = { extra_seat: 6 };
    const g = newGame(state);
    const ordered = vi.fn();
    g.world.bus.on('customer:arrived', ({ id }) => ordered(g.world.floor.customers.find((c) => c.id === id)?.recipeId));
    g.tick(120_000);
    expect(ordered).toHaveBeenCalled();
    expect(ordered.mock.calls.map(([id]) => id)).not.toContain('pearl_mead');
  });
});

describe('dungeon drinks elsewhere', () => {
  it('are the pricey new recipes of Famous Tavern and Legendary Hall', () => {
    const dungeon = recipes.filter((r) => usesStock(r, ingredients));
    expect(dungeon.map((r) => r.id)).toEqual(['pearl_mead', 'witchs_kiss', 'mossy_grog', 'frog_fizz', 'hex_glow', 'pearly_moon', 'witch_honey', 'bog_royale']);
    const shopTop = Math.max(...recipes.filter((r) => !usesStock(r, ingredients)).map((r) => r.basePrice));
    expect(Math.min(...dungeon.map((r) => r.basePrice))).toBeGreaterThan(shopTop);
  });

  it('show a never-found dungeon ingredient as "?" in the recipe book', () => {
    const book = (stock: Record<string, number>) =>
      toBookView({ recipesDiscovered: [], reputation: 700, ingredientsBought: ['fire_pepper', 'moon_grape', 'troll_sweat'], ingredientStock: stock }, recipes);
    const mead = (stock: Record<string, number>) => book(stock).entries.find((e) => e.id === 'pearl_mead');
    expect(mead({})).toMatchObject({ kind: 'hidden', needs: 'Needs ? from a dungeon' });
    expect(mead({ bog_pearl: 0 })).not.toHaveProperty('needs');
  });

  it('do not count while the player is away', () => {
    const state = late({ bog_pearl: 50, witch_moss: 50 });
    state.upgrades = { brewer_assistant: 7, waitress: 7, night_shift: 1 };
    const withDungeon = late({ bog_pearl: 50, witch_moss: 50 }, recipes.filter((r) => usesStock(r, ingredients)).map((r) => r.id));
    withDungeon.upgrades = state.upgrades;
    // Knowing more recipes reaches more achievements (with bonuses); give both the same, to compare only the drinks.
    state.achievements = ACHIEVEMENTS.map((a) => a.id);
    withDungeon.achievements = state.achievements;
    const gold = (s: GameState): number => {
      const g = newGame(s);
      g.world.offline.handleAway(3_600_000);
      return g.state.currencies.gold.toNumber();
    };
    expect(gold(withDungeon)).toBe(gold(state));
  });
});

describe('the loot lesson', () => {
  it('points at the first loot on the shelf when a hero brings some home', () => {
    const state = late();
    state.tutorial = { completedSteps: TUTORIAL_STEPS.filter((s) => s.lesson !== 'loot').map((s) => s.id), skipped: false };
    const g = newGame(state);
    expect(g.shown()).toBeNull();
    g.world.store.update((s) => void (s.ingredientStock.witch_moss = 2));
    g.world.bus.emit('hero:returned', { id: 'warrior', dungeon: 'swamp', loot: { witch_moss: 2 }, gear: null, xp: 40, level: 1, levelUp: false, injured: false, boss: null });
    expect(g.shown()).toBe('loot_shelf');
    expect(g.guide().lootId).toBe('witch_moss');
    g.tick(8_100);
    expect(g.shown()).toBeNull();
  });
});
