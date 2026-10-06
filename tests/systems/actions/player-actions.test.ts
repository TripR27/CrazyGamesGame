import { describe, expect, it, vi } from 'vitest';
import { createEventBus } from '@/core/events';
import type { GameEvents } from '@/core/game-events';
import { startBrewSystem } from '@/systems/brewing';
import { createPlayerActions } from '@/systems/actions';
import { catalog, economy, floorWith, rng, station } from '../fixtures';

function game(knownIds: string[] = ['ab', 'cde']) {
  const bus = createEventBus<GameEvents>();
  const s = station();
  const eco = economy();
  const floor = floorWith(['plain', 'ab']);
  const actions = createPlayerActions({
    bus, station: s, floor, economy: eco, catalog, rng: rng(), getKnownRecipeIds: () => knownIds,
  });
  startBrewSystem(s, bus);
  const seen = {
    clicked: vi.fn(), started: vi.fn(), done: vi.fn(), notice: vi.fn(),
    served: vi.fn(), refused: vi.fn(), left: vi.fn(),
  };
  bus.on('ingredient:clicked', seen.clicked);
  bus.on('brew:started', seen.started);
  bus.on('brew:done', seen.done);
  bus.on('brew:notice', seen.notice);
  bus.on('customer:served', seen.served);
  bus.on('customer:refused', seen.refused);
  bus.on('customer:left', seen.left);
  const wait = (ms: number): void => {
    for (let t = 0; t < ms; t += 100) bus.emit('tick', { deltaMs: 100 });
  };
  return { actions, eco, floor, s, seen, wait };
}

describe('a full round: brew, wait, serve', () => {
  it('turns two clicks, a short wait and a click on the customer into gold and reputation', () => {
    const { actions, eco, seen, wait, floor } = game();
    actions.clickIngredient('a');
    actions.clickIngredient('b');
    expect(seen.clicked).toHaveBeenCalledTimes(2);
    expect(seen.started).toHaveBeenCalledWith({ recipeId: 'ab' });

    wait(2000);
    expect(seen.done).toHaveBeenCalledWith({ recipeId: 'ab' });

    actions.clickCustomer(1);
    expect(seen.served).toHaveBeenCalledWith(expect.objectContaining({ id: 1, recipeId: 'ab' }));
    expect(seen.left).toHaveBeenCalledWith({ id: 1, reason: 'served' });
    expect(eco.getState().currencies.gold.eq(10)).toBe(true);
    expect(eco.getState().reputation).toBe(1);
    expect(floor.customers).toEqual([]);
  });

  it('tells the player when serving too early', () => {
    const { actions, seen, eco } = game();
    actions.clickCustomer(1);
    expect(seen.refused).toHaveBeenCalledWith(expect.objectContaining({ reason: 'nothing-ready' }));
    expect(eco.getState().reputation).toBe(0);
  });

  it('announces a fizzle and a busy cauldron as notices', () => {
    const { actions, seen } = game();
    actions.clickIngredient('a');
    actions.clickIngredient('c');
    expect(seen.notice).toHaveBeenLastCalledWith(expect.objectContaining({ notice: 'fizzle' }));
    actions.clickIngredient('a');
    actions.clickIngredient('b');
    actions.clickIngredient('a');
    expect(seen.notice).toHaveBeenLastCalledWith(expect.objectContaining({ notice: 'busy' }));
  });

  it('lets the player dump the cauldron contents', () => {
    const { actions, s } = game();
    actions.clickIngredient('c');
    actions.clickCauldron();
    expect(s.contents).toEqual([]);
  });

  it('only brews recipes that are known at the moment of the click', () => {
    const { actions, seen } = game(['cde']);
    actions.clickIngredient('a');
    actions.clickIngredient('b');
    expect(seen.started).not.toHaveBeenCalled();
    expect(seen.notice).toHaveBeenCalled();
  });
});
