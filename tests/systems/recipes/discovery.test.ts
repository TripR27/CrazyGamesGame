import { describe, expect, it, vi } from 'vitest';
import { createEventBus } from '@/core/events';
import type { GameEvents } from '@/core/game-events';
import { createStore } from '@/core/store';
import { recipes } from '@/data/recipes';
import { addIngredient } from '@/systems/brewing';
import { discoverableRecipes, recordDiscoveries, type DiscoveryState } from '@/systems/recipes';
import { ab, cde, rng, station } from '../fixtures';

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
  const ids = (state: DiscoveryState): string[] => discoverableRecipes(state, recipes).map((r) => r.id);

  it('nothing at the first level, so a new player cannot brew something by accident', () => {
    expect(ids({ reputation: 0, recipesDiscovered: ['slime_sap', 'glowcap_stout'] })).toEqual([]);
  });

  it('opens up the recipes of each level reached, except the ones already known', () => {
    expect(ids({ reputation: 10, recipesDiscovered: ['dragons_hiccup'] })).toEqual(['bog_lantern', 'swamp_fire']);
    expect(ids({ reputation: 40, recipesDiscovered: [] })).toHaveLength(5);
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
