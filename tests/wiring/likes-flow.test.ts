import { describe, expect, it } from 'vitest';
import { newGame, playBasics } from './helpers';
import { SERVING } from '@/data/brewing';
import { createInitialState } from '@/shared/state';
import { resolveTarget } from '@/systems/tutorial/resolve-target';

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
