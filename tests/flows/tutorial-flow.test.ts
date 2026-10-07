import { describe, expect, it } from 'vitest';
import { newGame, playBasics, withSeats } from './helpers';
import type { GameState } from '@/shared/state';
import { nextIngredient, readyDrinkSlot, resolveTarget } from '@/tutorial/tutorial-guide';

describe('the first tutorial, played in the real game', () => {
  it('shows nothing until the first customer sits down, and then only one customer comes', () => {
    const { tick, shown, world } = newGame();
    expect(shown()).toBeNull();
    tick(3_500);
    expect(shown()).toBe('basics_add');
    tick(40_000);
    expect(world.scene.floor.customers).toHaveLength(1);
  });

  it('keeps that customer waiting for as long as the tutorial runs, patience bar full', () => {
    const { tick, world } = newGame();
    tick(3_500);
    const [first] = world.scene.floor.customers;
    tick(300_000);
    expect(world.scene.floor.customers).toEqual([first]);
    expect(first?.patienceMs).toBe(first?.patienceMaxMs);
  });

  it('points at the finished drink on the bar first, then at the customer who ordered it', () => {
    const game = newGame();
    game.tick(3_500);
    const { actions } = game.world.scene;
    for (let i = 0; i < 2; i++) actions.clickIngredient(nextIngredient(game.guide()) ?? '');
    game.tick(15_000);
    expect(game.shown()).toBe('basics_pick');
    expect(resolveTarget('guide-drink', game.guide())).toBe('drink:0');
    actions.clickReadyDrink(readyDrinkSlot(game.guide()) ?? -1);
    expect(game.shown()).toBe('basics_serve');
    const [customer] = game.world.scene.floor.customers;
    expect(resolveTarget('guide-customer', game.guide())).toBe(`customer:${customer?.id}`);
    actions.clickCustomer(customer?.id ?? -1);
    expect(game.shown()).toBe('basics_gold');
  });

  it('also goes on when the player clicks the customer without picking the drink up', () => {
    const game = newGame();
    game.tick(3_500);
    const { actions } = game.world.scene;
    for (let i = 0; i < 2; i++) actions.clickIngredient(nextIngredient(game.guide()) ?? '');
    game.tick(15_000);
    actions.clickCustomer(game.world.scene.floor.customers[0]?.id ?? -1);
    expect(game.shown()).toBe('basics_gold');
  });

  it('can be completed by following the guide, and then customers flow normally', () => {
    const game = newGame(withSeats());
    game.tick(3_500);
    expect(game.saves).toHaveBeenCalled(); // progress asks for a save, so a reload resumes
    playBasics(game);
    expect(game.shown()).toBe('basics_gold');
    game.tick(4_600);
    expect(game.shown()).toBeNull();
    expect(game.state.tutorial.completedSteps).toEqual(expect.arrayContaining(['basics_gold']));
    expect(game.state.tutorial.completedSteps).toHaveLength(6);
    expect(game.state.currencies.gold.gt(0)).toBe(true);

    game.tick(30_000);
    expect(game.world.scene.floor.customers.length).toBeGreaterThan(1);
  });
});

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
