import { describe, expect, it, vi } from 'vitest';
import { createInitialState } from '@/core/state';
import { resolveTarget } from '@/systems/tutorial';
import { newGame, playBasics } from './helpers';

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
