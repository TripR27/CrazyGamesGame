import { describe, expect, it } from 'vitest';
import { num } from '@/core/numbers';
import { createInitialState } from '@/core/state';
import { resolveTarget } from '@/systems/tutorial';
import { newGame } from './helpers';

const BASICS = ['basics_add', 'basics_finish', 'basics_wait', 'basics_serve', 'basics_gold'];
const UPGRADE = ['upgrade_open', 'upgrade_buy', 'upgrade_done'];
const SEATS = ['seats_buy', 'seats_done'];

/** A game with the earlier lessons done and `gold` in the till. */
function afterLessons(gold: number, done: string[] = [...BASICS, ...UPGRADE, ...SEATS]) {
  const state = createInitialState(0);
  state.tutorial.completedSteps = done;
  state.currencies.gold = num(gold);
  state.upgrades = { extra_seat: 6 }; // several customers, so the staff have work
  return newGame(state);
}

describe('staff in the real game', () => {
  it('a hired brewer and waitress earn gold while the player does nothing', () => {
    const game = afterLessons(10_000);
    const { actions } = game.world.scene;
    actions.buyUpgrade('brewer_assistant', 1);
    actions.buyUpgrade('waitress', 1);
    const before = game.state.currencies.gold.toNumber();
    game.tick(300_000);
    expect(game.state.currencies.gold.toNumber()).toBeGreaterThan(before);
    expect(game.state.reputation).toBeGreaterThan(0);
  });

  it('earn nothing without staff', () => {
    const game = afterLessons(0);
    game.tick(120_000);
    expect(game.state.currencies.gold.toNumber()).toBe(0);
  });

  it('work faster after training', () => {
    const earned = (levels: number): number => {
      const game = afterLessons(1e9);
      for (const id of ['brewer_assistant', 'waitress']) {
        for (let i = 0; i < levels; i++) game.world.scene.actions.buyUpgrade(id, 1);
      }
      const start = game.state.currencies.gold.toNumber();
      game.tick(600_000);
      return game.state.currencies.gold.toNumber() - start;
    };
    expect(earned(5)).toBeGreaterThan(earned(1));
  });
});

describe('the staff hint, played in the real game', () => {
  it('stays hidden and does not slow the game until a hire is affordable', () => {
    const game = afterLessons(0);
    game.tick(60_000);
    expect(game.shown()).toBeNull();
    expect(game.world.scene.floor.customers.length).toBeGreaterThan(1);
  });

  it('starts when the player can pay for a hire, points at the shop, then at the hire', () => {
    const game = afterLessons(0);
    game.store.update((s) => void (s.currencies.gold = num(100)));
    expect(game.shown()).toBe('staff_hire');
    expect(resolveTarget('guide-staff', game.guide())).toBe('shop-button');

    game.world.scene.actions.openShop();
    expect(resolveTarget('guide-staff', game.guide())).toBe('upgrade:brewer_assistant');
    game.world.scene.actions.closeShop();
    expect(resolveTarget('guide-staff', game.guide())).toBe('shop-button');

    game.world.scene.actions.openShop();
    game.world.scene.actions.buyUpgrade('brewer_assistant', 1);
    expect(game.shown()).toBe('staff_done');
    game.tick(4_600);
    expect(game.shown()).toBeNull();
  });

  it('is not triggered by the first shop upgrade alone', () => {
    const game = afterLessons(0, BASICS);
    game.store.update((s) => void (s.currencies.gold = num(20)));
    expect(game.shown()).toBe('upgrade_open');
  });

  it('starts at once after a reload when the player already has the gold', () => {
    expect(afterLessons(500).shown()).toBe('staff_hire');
  });
});
