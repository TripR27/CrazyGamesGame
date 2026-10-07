import { describe, expect, it, vi } from 'vitest';
import { ab, cde, rng, station } from './systems/fixtures';
import { recipes } from '@/recipes/recipe-data';
import { discoverableRecipes, recordDiscoveries, type DiscoveryState, toBookView, type BookEntry } from '@/recipes/recipes';
import { createEventBus, type GameEvents } from '@/shared/events';
import { createStore } from '@/shared/state';
import { addIngredient } from '@/systems/brewing/add-ingredient';

describe('discovering a recipe in the cauldron', () => {
  it('announces a discoverable recipe as a discovery, then brews it', () => {
    const s = station();
    addIngredient(s, 'a', [cde], rng(), [ab]);
    expect(addIngredient(s, 'b', [cde], rng(), [ab])).toEqual([
      { kind: 'discovered', recipeId: 'ab' },
      { kind: 'started', recipeId: 'ab' },
    ]);
    expect(s.brewing?.recipeId).toBe('ab');
  });

  it('does not announce a recipe the player already knows', () => {
    const s = station();
    addIngredient(s, 'a', [ab], rng(), []);
    expect(addIngredient(s, 'b', [ab], rng(), [])).toEqual([{ kind: 'started', recipeId: 'ab' }]);
  });

  it('keeps a combination on its way to a discoverable recipe, and fizzles without one', () => {
    const s = station();
    expect(addIngredient(s, 'c', [ab], rng(), [cde])).toEqual([]);
    expect(s.contents).toEqual(['c']);
    const other = station();
    expect(addIngredient(other, 'c', [ab], rng(), [])[0]).toMatchObject({ kind: 'notice', notice: 'fizzle' });
  });
});

describe('which recipes can be discovered', () => {
  const all = ['swamp_slime', 'wild_honey', 'glowcap', 'fire_pepper', 'moon_grape', 'troll_sweat'];
  const ids = (state: DiscoveryState, owned = all): string[] => discoverableRecipes(state, recipes, owned).map((r) => r.id);

  it('nothing at the first level, so a new player cannot brew something by accident', () => {
    expect(ids({ reputation: 0, recipesDiscovered: ['slime_sap', 'glowcap_stout'] })).toEqual([]);
  });

  it('opens up the recipes of each level reached, except the ones already known', () => {
    expect(ids({ reputation: 10, recipesDiscovered: ['dragons_hiccup'] })).toEqual(['bog_lantern', 'swamp_fire']);
    expect(ids({ reputation: 40, recipesDiscovered: [] })).toHaveLength(5);
  });

  it('needs every ingredient of the recipe on the shelf too', () => {
    const basic = ['swamp_slime', 'wild_honey', 'glowcap'];
    expect(ids({ reputation: 10, recipesDiscovered: [] }, basic)).toEqual(['bog_lantern']);
    expect(ids({ reputation: 10, recipesDiscovered: [] }, [...basic, 'fire_pepper'])).toEqual(['bog_lantern', 'dragons_hiccup', 'swamp_fire']);
  });
});

describe('recording discoveries', () => {
  it('adds a discovered recipe to the state once and asks for a save', () => {
    const store = createStore<DiscoveryState>({ reputation: 10, recipesDiscovered: ['slime_sap'] });
    const bus = createEventBus<GameEvents>();
    const saves = vi.fn();
    bus.on('saveRequested', saves);
    recordDiscoveries(store, bus);
    bus.emit('recipe:discovered', { recipeId: 'bog_lantern' });
    bus.emit('recipe:discovered', { recipeId: 'bog_lantern' });
    expect(store.getState().recipesDiscovered).toEqual(['slime_sap', 'bog_lantern']);
    expect(saves).toHaveBeenCalledTimes(1);
  });
});

const entry = (entries: BookEntry[], id: string): BookEntry | undefined => entries.find((e) => e.id === id);

describe('the recipe book', () => {
  it('shows progress and how to make every known drink', () => {
    const view = toBookView({ recipesDiscovered: ['slime_sap', 'glowcap_stout'], reputation: 0, ingredientsBought: [] }, recipes);
    expect(view.progress).toBe(`2/${recipes.length} discovered`);
    expect(entry(view.entries, 'slime_sap')).toEqual({
      kind: 'known',
      id: 'slime_sap',
      name: 'Slime Sap',
      ingredients: [{ id: 'swamp_slime', name: 'Swamp Slime' }, { id: 'wild_honey', name: 'Wild Honey' }],
      details: ['4s brew', '8 gold', '💖 Charm: more reputation'],
      rarity: 'common',
    });
  });

  it('shows a hint for a drink that can be discovered, and the level for one that cannot yet', () => {
    const view = toBookView({ recipesDiscovered: [], reputation: 10, ingredientsBought: [] }, recipes);
    expect(entry(view.entries, 'bog_lantern')).toMatchObject({ kind: 'hidden', rarity: 'common' });
    expect(entry(view.entries, 'bog_lantern')).toHaveProperty('hint', expect.stringContaining('Swamp'));
    expect(entry(view.entries, 'moonlight_merlot')).toEqual({ kind: 'locked', id: 'moonlight_merlot', unlock: 'Unlocks at Cozy Inn' });
  });

  it('lists every recipe, in content order', () => {
    const view = toBookView({ recipesDiscovered: [], reputation: 0, ingredientsBought: [] }, recipes);
    expect(view.entries.map((e) => e.id)).toEqual(recipes.map((r) => r.id));
  });
});
