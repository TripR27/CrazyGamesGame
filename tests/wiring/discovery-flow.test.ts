import { describe, expect, it, vi } from 'vitest';
import { newGame } from './helpers';
import { num } from '@/shared/numbers';
import { createInitialState } from '@/shared/state';
import { resolveTarget } from '@/systems/tutorial/resolve-target';

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
