import { describe, expect, it, vi } from 'vitest';
import { newGame } from './helpers';
import { TUTORIAL_STEPS } from '@/data/tutorial/index';
import { num } from '@/shared/numbers';
import { createInitialState } from '@/shared/state';
import { resolveTarget } from '@/systems/tutorial/resolve-target';

/** Every lesson before the room lesson is done; the player has `reputation` and `gold`. */
function game(reputation: number, gold: number, seats = 0) {
  const state = createInitialState(0);
  const roomFirst = TUTORIAL_STEPS.findIndex((s) => s.lesson === 'room');
  state.tutorial.completedSteps = TUTORIAL_STEPS.slice(0, roomFirst).map((s) => s.id);
  state.reputation = reputation;
  state.currencies.gold = num(gold);
  state.upgrades = { extra_seat: seats };
  return newGame(state);
}

describe('rooms in the real game', () => {
  it('lets customers sit in a built room, upstairs, on top of the seats downstairs', () => {
    const g = game(40, 5000);
    g.world.scene.actions.buildRoom('extension');
    expect(g.state.roomsBuilt).toEqual(['extension']);
    g.tick(120_000);
    const seats = g.world.scene.floor.customers.map((c) => c.seat);
    expect(seats.length).toBeGreaterThan(1);
    expect(seats.every((s) => s === 0 || (s >= 7 && s <= 9))).toBe(true);
  });

  it('asks for the shop when a boarded-up room is clicked', () => {
    const g = game(0, 0);
    const asked = vi.fn();
    g.world.scene.bus.on('shop:requested', asked);
    g.world.scene.actions.requestShop();
    expect(asked).toHaveBeenCalledTimes(1);
  });
});

describe('the room hint, played in the real game', () => {
  it('waits for a room that can be built, points the way to it, then at the room itself', () => {
    const g = game(40, 100);
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
