import { describe, expect, it, vi } from 'vitest';
import { newGame, playBasics, playLikes } from './helpers';
import { BREWING } from '@/brewing/brewing';
import { num } from '@/shared/numbers';
import { createInitialState } from '@/shared/state';
import { resolveTarget } from '@/tutorial/tutorial-guide';
import { TUTORIAL_STEPS } from '@/tutorial/tutorial-steps';

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

/** Every lesson before the room lesson is done; the player has `reputation` and `gold`. */
function gameRooms(reputation: number, gold: number, seats = 0) {
  const state = createInitialState(0);
  const roomFirst = TUTORIAL_STEPS.findIndex((s) => s.lesson === 'room');
  state.tutorial.completedSteps = TUTORIAL_STEPS.slice(0, roomFirst).map((s) => s.id);
  state.reputation = reputation;
  state.currencies.gold = num(gold);
  state.upgrades = { extra_seat: seats };
  return newGame(state);
}

describe('rooms in the real gameRooms', () => {
  it('lets customers sit in a built room, upstairs, on top of the seats downstairs', () => {
    const g = gameRooms(40, 5000);
    g.world.scene.actions.buildRoom('extension');
    expect(g.state.roomsBuilt).toEqual(['extension']);
    g.tick(120_000);
    const seats = g.world.scene.floor.customers.map((c) => c.seat);
    expect(seats.length).toBeGreaterThan(1);
    expect(seats.every((s) => s === 0 || (s >= 7 && s <= 9))).toBe(true);
  });

  it('asks for the shop when a boarded-up room is clicked', () => {
    const g = gameRooms(0, 0);
    const asked = vi.fn();
    g.world.scene.bus.on('shop:requested', asked);
    g.world.scene.actions.requestShop();
    expect(asked).toHaveBeenCalledTimes(1);
  });
});

describe('the room hint, played in the real gameRooms', () => {
  it('waits for a room that can be built, points the way to it, then at the room itself', () => {
    const g = gameRooms(40, 100);
    expect(g.shown()).toBeNull();
    g.store.update((s) => void (s.currencies.gold = num(5000)));
    expect(g.shown()).toBe('room_buy');
    expect(resolveTarget('guide-room-buy', g.guide())).toBe('panel-button');
    g.world.scene.actions.openShop();
    expect(resolveTarget('guide-room-buy', g.guide())).toBe('room-buy:extension');
    g.world.scene.actions.buildRoom('extension');
    expect(g.shown()).toBe('room_done');
    expect(resolveTarget('guide-new-room', g.guide())).toBe('room:extension');
    g.tick(5_600);
    expect(g.shown()).toBeNull();
  });
});

/** A gameRooms in which the basics lesson is done and the player has `gold`. */
function afterBasics(gold: number) {
  const state = createInitialState(0);
  state.tutorial.completedSteps = ['basics_add', 'basics_finish', 'basics_wait', 'basics_pick', 'basics_serve', 'basics_gold', 'likes_spot', 'likes_done'];
  state.currencies.gold = num(gold);
  state.upgrades = { extra_seat: 6 }; // seats are not what these tests are about
  return newGame(state);
}

describe('the upgrade hint, played in the real gameRooms', () => {
  it('stays hidden, and does not hold customers back, until an upgrade is affordable', () => {
    const gameRooms = afterBasics(0);
    gameRooms.tick(60_000);
    expect(gameRooms.shown()).toBeNull();
    expect(gameRooms.world.scene.floor.customers.length).toBeGreaterThan(1);
  });

  it('starts when the player earns enough, points at the shop, then at the buy button', () => {
    const gameRooms = newGame();
    gameRooms.tick(3_500);
    playBasics(gameRooms);
    gameRooms.tick(4_600);
    gameRooms.store.update((s) => void (s.currencies.gold = num(0)));
    playLikes(gameRooms); // one more drink, still less than the 20 gold an upgrade costs
    expect(gameRooms.shown()).toBeNull();
    gameRooms.store.update((s) => void (s.currencies.gold = num(20)));
    expect(gameRooms.shown()).toBe('upgrade_open');
    expect(gameRooms.world.scene.floor.customers.length).toBeLessThanOrEqual(1);

    gameRooms.world.scene.actions.openShop();
    expect(gameRooms.shown()).toBe('upgrade_buy');
    expect(resolveTarget('guide-upgrade', gameRooms.guide())).toBe('upgrade:swift_cauldron');

    gameRooms.world.scene.actions.buyUpgrade('swift_cauldron', 1);
    expect(gameRooms.shown()).toBe('upgrade_done');
    gameRooms.tick(4_600);
    expect(gameRooms.shown()).toBeNull();
    expect(gameRooms.state.currencies.gold.toNumber()).toBe(0);
  });

  it('starts at once after a reload when the player already has the gold', () => {
    expect(afterBasics(500).shown()).toBe('upgrade_open');
  });
});

describe('upgrades in the real gameRooms', () => {
  it('speeds up the cauldron and grows the bar as soon as they are bought', () => {
    const gameRooms = afterBasics(10_000);
    const { actions, station } = gameRooms.world.scene;
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
