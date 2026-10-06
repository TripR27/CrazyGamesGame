import { describe, expect, it } from 'vitest';
import { num } from '@/core/numbers';
import { createInitialState } from '@/core/state';
import { BREWING } from '@/data/brewing';
import { resolveTarget } from '@/systems/tutorial';
import { newGame, playBasics } from './helpers';

/** A game in which the basics lesson is done and the player has `gold`. */
function afterBasics(gold: number) {
  const state = createInitialState(0);
  state.tutorial.completedSteps = ['basics_add', 'basics_finish', 'basics_wait', 'basics_serve', 'basics_gold'];
  state.currencies.gold = num(gold);
  state.upgrades = { extra_seat: 6 }; // seats are not what these tests are about
  return newGame(state);
}

describe('the upgrade hint, played in the real game', () => {
  it('stays hidden, and does not hold customers back, until an upgrade is affordable', () => {
    const game = afterBasics(0);
    game.tick(60_000);
    expect(game.shown()).toBeNull();
    expect(game.world.scene.floor.customers.length).toBeGreaterThan(1);
  });

  it('starts when the player earns enough, points at the shop, then at the buy button', () => {
    const game = newGame();
    game.tick(3_500);
    playBasics(game);
    game.tick(4_600);
    expect(game.shown()).toBeNull();

    game.store.update((s) => void (s.currencies.gold = num(0)));
    expect(game.shown()).toBeNull();
    game.store.update((s) => void (s.currencies.gold = num(20)));
    expect(game.shown()).toBe('upgrade_open');
    expect(game.world.scene.floor.customers.length).toBeLessThanOrEqual(1);

    game.world.scene.actions.openShop();
    expect(game.shown()).toBe('upgrade_buy');
    expect(resolveTarget('guide-upgrade', game.guide())).toBe('upgrade:swift_cauldron');

    game.world.scene.actions.buyUpgrade('swift_cauldron', 1);
    expect(game.shown()).toBe('upgrade_done');
    game.tick(4_600);
    expect(game.shown()).toBeNull();
    expect(game.state.currencies.gold.toNumber()).toBe(0);
  });

  it('starts at once after a reload when the player already has the gold', () => {
    expect(afterBasics(500).shown()).toBe('upgrade_open');
  });
});

describe('upgrades in the real game', () => {
  it('speeds up the cauldron and grows the bar as soon as they are bought', () => {
    const game = afterBasics(10_000);
    const { actions, station } = game.world.scene;
    expect(station.capacity).toBe(BREWING.storageCapacity);
    actions.buyUpgrade('bigger_bar', 'max');
    for (let i = 0; i < 3; i++) actions.buyUpgrade('swift_cauldron', 1);
    expect(station.capacity).toBe(BREWING.storageCapacity + 2);
    expect(station.speed).toBeCloseTo(1.331);
  });

  it('applies bought levels from a loaded save', () => {
    const state = createInitialState(0);
    state.upgrades = { bigger_bar: 1 };
    expect(newGame(state).world.scene.station.capacity).toBe(BREWING.storageCapacity + 1);
  });
});
