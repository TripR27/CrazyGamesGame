import { describe, expect, it } from 'vitest';
import { num } from '@/core/numbers';
import { createInitialState } from '@/core/state';
import { resolveTarget } from '@/systems/tutorial';
import { newGame } from './helpers';

const BEFORE = [
  'basics_add', 'basics_finish', 'basics_wait', 'basics_pick', 'basics_serve', 'basics_gold', 'likes_spot', 'likes_done',
  'upgrade_open', 'upgrade_buy', 'upgrade_done', 'seats_buy', 'seats_done', 'book_open', 'book_read',
];

/** The lessons before the ingredient lesson are done; the player has `reputation` and `gold`. */
function game(reputation: number, gold: number) {
  const state = createInitialState(0);
  state.tutorial.completedSteps = [...BEFORE];
  state.reputation = reputation;
  state.currencies.gold = num(gold);
  return newGame(state);
}

describe('the ingredient hint, played in the real game', () => {
  it('waits for a level that sells an ingredient and the gold to buy it', () => {
    expect(game(0, 500).shown()).toBeNull();
    const poor = game(10, 10);
    expect(poor.shown()).toBeNull();
    poor.store.update((s) => void (s.currencies.gold = num(40)));
    expect(poor.shown()).toBe('ingredient_buy');
  });

  it('points at the menu, the shop tab and the buy button, then at the new ingredient on the shelf', () => {
    const g = game(10, 40);
    expect(resolveTarget('guide-ingredient-buy', g.guide())).toBe('panel-button');
    g.world.scene.actions.openShop();
    expect(resolveTarget('guide-ingredient-buy', g.guide())).toBe('ingredient-buy:fire_pepper');
    g.world.scene.actions.buyIngredient('fire_pepper');
    expect(g.shown()).toBe('ingredient_done');
    expect(resolveTarget('guide-new-ingredient', g.guide())).toBe('ingredient:fire_pepper');
    g.tick(5_600);
    expect(g.shown()).toBeNull();
    expect(g.saves).toHaveBeenCalled();
  });
});

describe('ingredients in an older save', () => {
  it('keep a tier-2 recipe the player already knows brewable, without buying anything', () => {
    const state = createInitialState(0);
    state.recipesDiscovered = ['slime_sap', 'dragons_hiccup'];
    expect(newGame(state).world.scene.getShelf()).toContain('fire_pepper');
  });
});
