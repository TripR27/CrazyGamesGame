import { describe, expect, it, vi } from 'vitest';
import { catalog, economy, floorWith, noUpgrades, rng, station } from './fixtures';
import { createPlayerActions } from '@/app/actions';
import { startBrewSystem } from '@/brewing/brewing';
import { createDrinkSelection } from '@/serving/serving';
import { createEventBus, type GameEvents } from '@/shared/events';

function game1(knownIds: string[] = ['ab', 'cde']) {
  const bus = createEventBus<GameEvents>();
  const s = station();
  const eco = economy();
  const floor = floorWith(['plain', 'ab']);
  const actions = createPlayerActions({
    bus, station: s, floor, economy: eco, upgradeStore: eco, ...noUpgrades, catalog, rng: rng(), getKnownRecipeIds: () => knownIds,
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
    const { actions, eco, seen, wait, floor } = game1();
    actions.clickIngredient('a');
    actions.clickIngredient('b');
    expect(seen.clicked).toHaveBeenCalledTimes(2);
    expect(seen.started).toHaveBeenCalledWith({ recipeId: 'ab' });

    wait(2000);
    expect(seen.done).toHaveBeenCalledWith({ recipeId: 'ab' });

    actions.clickCustomer(1);
    expect(seen.served).toHaveBeenCalledWith(expect.objectContaining({ id: 1, recipeId: 'ab' }));
    expect(eco.getState().currencies.gold.eq(10)).toBe(true);
    expect(eco.getState().reputation).toBe(1);
    // The customer stays to drink; the customer system lets them leave later.
    expect(seen.left).not.toHaveBeenCalled();
    expect(floor.customers[0]?.drinkMsLeft).toBeGreaterThan(0);
  });

  it('tells the player when serving too early', () => {
    const { actions, seen, eco } = game1();
    actions.clickCustomer(1);
    expect(seen.refused).toHaveBeenCalledWith(expect.objectContaining({ reason: 'nothing-ready' }));
    expect(eco.getState().reputation).toBe(0);
  });

  it('announces a fizzle and a busy cauldron as notices', () => {
    const { actions, seen } = game1();
    actions.clickIngredient('a');
    actions.clickIngredient('c');
    expect(seen.notice).toHaveBeenLastCalledWith(expect.objectContaining({ notice: 'fizzle' }));
    actions.clickIngredient('a');
    actions.clickIngredient('b');
    actions.clickIngredient('a');
    expect(seen.notice).toHaveBeenLastCalledWith(expect.objectContaining({ notice: 'busy' }));
  });

  it('lets the player dump the cauldron contents', () => {
    const { actions, s } = game1();
    actions.clickIngredient('c');
    actions.clickCauldron();
    expect(s.contents).toEqual([]);
  });

  it('only brews recipes that are known at the moment of the click', () => {
    const { actions, seen } = game1(['cde']);
    actions.clickIngredient('a');
    actions.clickIngredient('b');
    expect(seen.started).not.toHaveBeenCalled();
    expect(seen.notice).toHaveBeenCalled();
  });
});

/** Customer 1 ordered ab, customer 2 ordered cde; both drinks stand on the bar. */
function game2() {
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
    const { actions, s, selection, seen } = game2();
    actions.clickReadyDrink(1);
    expect(selection.selected()).toBe('cde');
    expect(seen.picked).toHaveBeenCalledWith({ recipeId: 'cde' });
    actions.clickCustomer(2);
    expect(seen.served).toHaveBeenCalledWith(expect.objectContaining({ id: 2, recipeId: 'cde' }));
    expect(s.ready).toEqual(['ab']);
    expect(selection.selected()).toBeNull();
  });

  it('lets the wrong customer refuse it, even when their own drink is ready, and keeps it picked', () => {
    const { actions, s, selection, seen } = game2();
    actions.clickReadyDrink(1);
    actions.clickCustomer(1);
    expect(seen.refused).toHaveBeenCalledWith(expect.objectContaining({ id: 1, reason: 'wrong-drink' }));
    expect(seen.served).not.toHaveBeenCalled();
    expect(s.ready).toEqual(['ab', 'cde']);
    expect(selection.selected()).toBe('cde');
  });

  it('puts the drink back on a second click or on a click on an empty spot', () => {
    const { actions, selection, seen } = game2();
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
    const { actions, selection } = game2();
    actions.clickReadyDrink(0);
    actions.clickReadyDrink(1);
    expect(selection.selected()).toBe('cde');
  });

  it('forgets the pick once that drink is no longer on the bar (the waitress took it)', () => {
    const { actions, s, selection } = game2();
    actions.clickReadyDrink(0);
    s.ready.splice(0, 1);
    expect(selection.selected()).toBeNull();
  });

  it('still serves a customer clicked straight away, with nothing picked', () => {
    const { actions, seen } = game2();
    actions.clickCustomer(1);
    expect(seen.served).toHaveBeenCalledWith(expect.objectContaining({ id: 1, recipeId: 'ab' }));
  });
});

function game3(gold: number) {
  const bus = createEventBus<GameEvents>();
  const eco = economy(gold);
  const actions = createPlayerActions({
    bus, station: station(), floor: floorWith(), economy: eco, upgradeStore: eco, ...noUpgrades,
    catalog, rng: rng(), getKnownRecipeIds: () => [],
  });
  const bought = vi.fn();
  const saves = vi.fn();
  const opened = vi.fn();
  bus.on('upgrade:bought', bought);
  bus.on('saveRequested', saves);
  bus.on('shop:opened', opened);
  return { actions, eco, bought, saves, opened };
}

describe('upgrade actions', () => {
  it('buys, announces the purchase and asks for a save', () => {
    const { actions, eco, bought, saves } = game3(100);
    actions.buyUpgrade('price_up', 'max');
    expect(bought).toHaveBeenCalledWith({ id: 'price_up', count: 3 });
    expect(saves).toHaveBeenCalledTimes(1);
    expect(eco.getState().upgrades.price_up).toBe(3);
  });

  it('stays silent when the player cannot pay or the upgrade does not exist', () => {
    const { actions, bought, saves } = game3(5);
    actions.buyUpgrade('price_up', 1);
    actions.buyUpgrade('nope', 1);
    expect(bought).not.toHaveBeenCalled();
    expect(saves).not.toHaveBeenCalled();
  });

  it('announces that the shop was opened', () => {
    const { actions, opened } = game3(0);
    actions.openShop();
    expect(opened).toHaveBeenCalledTimes(1);
  });
});
