import { describe, expect, it, vi } from 'vitest';
import { createInitialState } from '@/core/state';
import { resolveTarget } from '@/systems/tutorial';
import { newGame } from './helpers';

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

  it('puts the ingredients of discoverable recipes on the shelf', () => {
    expect(withReputation(0).world.scene.getShelf()).toHaveLength(3);
    expect(withReputation(10).world.scene.getShelf()).toEqual(expect.arrayContaining(['fire_pepper']));
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
