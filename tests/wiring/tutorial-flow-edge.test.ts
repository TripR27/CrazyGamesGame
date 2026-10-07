import { describe, expect, it } from 'vitest';
import { newGame, playBasics, withSeats } from './helpers';
import type { GameState } from '@/shared/state';
import { nextIngredient } from '@/systems/tutorial/guide';

describe('the first tutorial: replaying, skipping, mistakes and reloads', () => {
  it('can be replayed with a customer already seated, without getting stuck', () => {
    const game = newGame();
    game.tick(3_500);
    game.world.tutorial.machine.skip();
    game.tick(20_000);
    game.world.tutorial.machine.restart();
    expect(game.shown()).toBe('basics_add');
    const before = game.world.scene.floor.customers.length;
    game.tick(100_000);
    expect(game.world.scene.floor.customers).toHaveLength(before);
  });

  it('lifts the one-customer limit as soon as the tutorial is skipped', () => {
    const game = newGame(withSeats());
    game.tick(3_500);
    game.world.tutorial.machine.skip();
    game.tick(40_000);
    expect(game.world.scene.floor.customers.length).toBeGreaterThan(1);
  });

  it('is not stuck when the player makes mistakes: a fizzle just brings the guide back to the first ingredient', () => {
    const game = newGame();
    game.tick(3_500);
    const { actions } = game.world.scene;
    actions.clickIngredient('swamp_slime');
    actions.clickIngredient('glowcap'); // no recipe has both: the cauldron fizzles
    expect(game.world.scene.station.contents).toEqual([]);
    expect(game.shown()).toBe('basics_finish');
    playBasics(game);
    expect(game.state.tutorial.completedSteps).toContain('basics_serve');
  });

  it('restarts the lesson from its first step after a reload in the middle of brewing', () => {
    const first = newGame();
    first.tick(3_500);
    first.world.scene.actions.clickIngredient(nextIngredient(first.guide()) ?? '');
    first.world.scene.actions.clickIngredient(nextIngredient(first.guide()) ?? '');
    first.tick(15_000); // drink ready: the open step is the one that needs the bar
    const saved = JSON.parse(JSON.stringify(first.state)) as GameState;
    saved.currencies.gold = first.state.currencies.gold; // the real save codec restores numbers; plain JSON does not
    expect(saved.tutorial.completedSteps).toEqual(['basics_add', 'basics_finish', 'basics_wait']);

    const second = newGame(saved);
    expect(second.state.tutorial.completedSteps).toEqual([]);
    expect(second.shown()).toBeNull();
    second.tick(3_500);
    expect(second.shown()).toBe('basics_add');
  });
});
