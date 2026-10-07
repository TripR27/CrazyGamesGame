import { describe, expect, it, vi } from 'vitest';
import { catalog, floorWith, rng, station, upgradeDefs } from './fixtures';
import type { Content } from '@/app/world';
import { clickCauldron, clickIngredient, startBrewSystem } from '@/brewing/brewing';
import { buyUpgradeById } from '@/economy/upgrades';
import { cancelSelection, clickCustomer, clickReadyDrink, createDrinkSelection } from '@/serving/serving';
import { createEventBus, type GameEvents } from '@/shared/events';
import { num } from '@/shared/numbers';
import { createInitialState, createStore } from '@/shared/state';

const content: Content = { ...catalog, upgrades: upgradeDefs, rooms: [], decor: [], ingredients: [] };

/** The real game state with `gold` and the given known recipes. */
function gameStore(gold: number, known: string[]) {
  const state = createInitialState(0);
  state.currencies.gold = num(gold);
  state.recipesDiscovered = known;
  return createStore(state);
}

function game1(knownIds: string[] = ['ab', 'cde']) {
  const bus = createEventBus<GameEvents>();
  const s = station();
  const eco = gameStore(0, knownIds);
  const floor = floorWith(['plain', 'ab']);
  const world = { bus, station: s, floor, store: eco, content, rng: rng(), selection: createDrinkSelection(s) };
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
  return { world, eco, floor, s, seen, wait };
}

describe('a full round: brew, wait, serve', () => {
  it('turns two clicks, a short wait and a click on the customer into gold and reputation', () => {
    const { world, eco, seen, wait, floor } = game1();
    clickIngredient(world, 'a');
    clickIngredient(world, 'b');
    expect(seen.clicked).toHaveBeenCalledTimes(2);
    expect(seen.started).toHaveBeenCalledWith({ recipeId: 'ab' });

    wait(2000);
    expect(seen.done).toHaveBeenCalledWith({ recipeId: 'ab' });

    clickCustomer(world, 1);
    expect(seen.served).toHaveBeenCalledWith(expect.objectContaining({ id: 1, recipeId: 'ab' }));
    expect(eco.getState().currencies.gold.eq(10)).toBe(true);
    expect(eco.getState().reputation).toBe(1);
    // The customer stays to drink; the customer system lets them leave later.
    expect(seen.left).not.toHaveBeenCalled();
    expect(floor.customers[0]?.drinkMsLeft).toBeGreaterThan(0);
  });

  it('tells the player when serving too early', () => {
    const { world, seen, eco } = game1();
    clickCustomer(world, 1);
    expect(seen.refused).toHaveBeenCalledWith(expect.objectContaining({ reason: 'nothing-ready' }));
    expect(eco.getState().reputation).toBe(0);
  });

  it('announces a fizzle and a busy cauldron as notices', () => {
    const { world, seen } = game1();
    clickIngredient(world, 'a');
    clickIngredient(world, 'c');
    expect(seen.notice).toHaveBeenLastCalledWith(expect.objectContaining({ notice: 'fizzle' }));
    clickIngredient(world, 'a');
    clickIngredient(world, 'b');
    clickIngredient(world, 'a');
    expect(seen.notice).toHaveBeenLastCalledWith(expect.objectContaining({ notice: 'busy' }));
  });

  it('lets the player dump the cauldron contents', () => {
    const { world, s } = game1();
    clickIngredient(world, 'c');
    clickCauldron(world);
    expect(s.contents).toEqual([]);
  });

  it('only brews recipes that are known at the moment of the click', () => {
    const { world, seen } = game1(['cde']);
    clickIngredient(world, 'a');
    clickIngredient(world, 'b');
    expect(seen.started).not.toHaveBeenCalled();
    expect(seen.notice).toHaveBeenCalled();
  });
});

/** Customer 1 ordered ab, customer 2 ordered cde; both drinks stand on the bar. */
function game2() {
  const bus = createEventBus<GameEvents>();
  const s = station();
  s.ready.push('ab', 'cde');
  const eco = gameStore(0, ['ab', 'cde']);
  const floor = floorWith(['plain', 'ab'], ['plain', 'cde']);
  const selection = createDrinkSelection(s);
  const world = { bus, station: s, floor, store: eco, content, rng: rng(), selection };
  const seen = { picked: vi.fn(), served: vi.fn(), refused: vi.fn() };
  bus.on('drink:picked', seen.picked);
  bus.on('customer:served', seen.served);
  bus.on('customer:refused', seen.refused);
  return { world, s, selection, seen };
}

describe('serving by picking the drink first', () => {
  it('picks a drink from the bar and hands it to the customer who ordered it', () => {
    const { world, s, selection, seen } = game2();
    clickReadyDrink(world, 1);
    expect(selection.selected()).toBe('cde');
    expect(seen.picked).toHaveBeenCalledWith({ recipeId: 'cde' });
    clickCustomer(world, 2);
    expect(seen.served).toHaveBeenCalledWith(expect.objectContaining({ id: 2, recipeId: 'cde' }));
    expect(s.ready).toEqual(['ab']);
    expect(selection.selected()).toBeNull();
  });

  it('lets the wrong customer refuse it, even when their own drink is ready, and keeps it picked', () => {
    const { world, s, selection, seen } = game2();
    clickReadyDrink(world, 1);
    clickCustomer(world, 1);
    expect(seen.refused).toHaveBeenCalledWith(expect.objectContaining({ id: 1, reason: 'wrong-drink' }));
    expect(seen.served).not.toHaveBeenCalled();
    expect(s.ready).toEqual(['ab', 'cde']);
    expect(selection.selected()).toBe('cde');
  });

  it('puts the drink back on a second click or on a click on an empty spot', () => {
    const { world, selection, seen } = game2();
    clickReadyDrink(world, 0);
    clickReadyDrink(world, 0);
    expect(selection.selected()).toBeNull();
    clickReadyDrink(world, 0);
    cancelSelection(world);
    expect(selection.selected()).toBeNull();
    clickReadyDrink(world, 4); // an empty slot: nothing to pick
    expect(selection.selected()).toBeNull();
    expect(seen.picked).toHaveBeenCalledTimes(2);
  });

  it('switches to another drink when the player clicks it', () => {
    const { world, selection } = game2();
    clickReadyDrink(world, 0);
    clickReadyDrink(world, 1);
    expect(selection.selected()).toBe('cde');
  });

  it('forgets the pick once that drink is no longer on the bar (the waitress took it)', () => {
    const { world, s, selection } = game2();
    clickReadyDrink(world, 0);
    s.ready.splice(0, 1);
    expect(selection.selected()).toBeNull();
  });

  it('still serves a customer clicked straight away, with nothing picked', () => {
    const { world, seen } = game2();
    clickCustomer(world, 1);
    expect(seen.served).toHaveBeenCalledWith(expect.objectContaining({ id: 1, recipeId: 'ab' }));
  });
});

function game3(gold: number) {
  const bus = createEventBus<GameEvents>();
  const eco = gameStore(gold, []);
  const world = { bus, station: station(), floor: floorWith(), store: eco, content, rng: rng(), selection: createDrinkSelection(station()) };
  const bought = vi.fn();
  const saves = vi.fn();
  const opened = vi.fn();
  bus.on('upgrade:bought', bought);
  bus.on('saveRequested', saves);
  bus.on('shop:opened', opened);
  return { world, eco, bought, saves, opened };
}

describe('upgrade world', () => {
  it('buys, announces the purchase and asks for a save', () => {
    const { world, eco, bought, saves } = game3(100);
    buyUpgradeById(world, 'price_up', 'max');
    expect(bought).toHaveBeenCalledWith({ id: 'price_up', count: 3 });
    expect(saves).toHaveBeenCalledTimes(1);
    expect(eco.getState().upgrades.price_up).toBe(3);
  });

  it('stays silent when the player cannot pay or the upgrade does not exist', () => {
    const { world, bought, saves } = game3(5);
    buyUpgradeById(world, 'price_up', 1);
    buyUpgradeById(world, 'nope', 1);
    expect(bought).not.toHaveBeenCalled();
    expect(saves).not.toHaveBeenCalled();
  });

  it('announces that the shop was opened', () => {
    const { world, opened } = game3(0);
    world.bus.emit('shop:opened', {});
    expect(opened).toHaveBeenCalledTimes(1);
  });
});
