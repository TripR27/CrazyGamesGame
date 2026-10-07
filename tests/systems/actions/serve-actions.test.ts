import { describe, expect, it, vi } from 'vitest';
import { catalog, economy, floorWith, noUpgrades, rng, station } from '../fixtures';
import { createEventBus, type GameEvents } from '@/shared/events';
import { createPlayerActions } from '@/systems/actions/player-actions';
import { createDrinkSelection } from '@/systems/serving/selection';

/** Customer 1 ordered ab, customer 2 ordered cde; both drinks stand on the bar. */
function game() {
  const bus = createEventBus<GameEvents>();
  const s = station();
  s.ready.push('ab', 'cde');
  const eco = economy();
  const floor = floorWith(['plain', 'ab'], ['plain', 'cde']);
  const selection = createDrinkSelection(s);
  const actions = createPlayerActions({
    bus, station: s, floor, economy: eco, upgradeStore: eco, ...noUpgrades, catalog, rng: rng(), getKnownRecipeIds: () => ['ab', 'cde'], selection,
  });
  const seen = { picked: vi.fn(), served: vi.fn(), refused: vi.fn() };
  bus.on('drink:picked', seen.picked);
  bus.on('customer:served', seen.served);
  bus.on('customer:refused', seen.refused);
  return { actions, s, selection, seen };
}

describe('serving by picking the drink first', () => {
  it('picks a drink from the bar and hands it to the customer who ordered it', () => {
    const { actions, s, selection, seen } = game();
    actions.clickReadyDrink(1);
    expect(selection.selected()).toBe('cde');
    expect(seen.picked).toHaveBeenCalledWith({ recipeId: 'cde' });
    actions.clickCustomer(2);
    expect(seen.served).toHaveBeenCalledWith(expect.objectContaining({ id: 2, recipeId: 'cde' }));
    expect(s.ready).toEqual(['ab']);
    expect(selection.selected()).toBeNull();
  });

  it('lets the wrong customer refuse it, even when their own drink is ready, and keeps it picked', () => {
    const { actions, s, selection, seen } = game();
    actions.clickReadyDrink(1);
    actions.clickCustomer(1);
    expect(seen.refused).toHaveBeenCalledWith(expect.objectContaining({ id: 1, reason: 'wrong-drink' }));
    expect(seen.served).not.toHaveBeenCalled();
    expect(s.ready).toEqual(['ab', 'cde']);
    expect(selection.selected()).toBe('cde');
  });

  it('puts the drink back on a second click or on a click on an empty spot', () => {
    const { actions, selection, seen } = game();
    actions.clickReadyDrink(0);
    actions.clickReadyDrink(0);
    expect(selection.selected()).toBeNull();
    actions.clickReadyDrink(0);
    actions.cancelSelection();
    expect(selection.selected()).toBeNull();
    actions.clickReadyDrink(4); // an empty slot: nothing to pick
    expect(selection.selected()).toBeNull();
    expect(seen.picked).toHaveBeenCalledTimes(2);
  });

  it('switches to another drink when the player clicks it', () => {
    const { actions, selection } = game();
    actions.clickReadyDrink(0);
    actions.clickReadyDrink(1);
    expect(selection.selected()).toBe('cde');
  });

  it('forgets the pick once that drink is no longer on the bar (the waitress took it)', () => {
    const { actions, s, selection } = game();
    actions.clickReadyDrink(0);
    s.ready.splice(0, 1);
    expect(selection.selected()).toBeNull();
  });

  it('still serves a customer clicked straight away, with nothing picked', () => {
    const { actions, seen } = game();
    actions.clickCustomer(1);
    expect(seen.served).toHaveBeenCalledWith(expect.objectContaining({ id: 1, recipeId: 'ab' }));
  });
});
