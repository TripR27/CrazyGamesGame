import { vi } from 'vitest';
import { createEventBus } from '@/core/events';
import type { GameEvents } from '@/core/game-events';
import { createSeededRng } from '@/core/rng';
import { createInitialState, type GameState } from '@/core/state';
import { createStore } from '@/core/store';
import { nextIngredient, readyCustomerId } from '@/systems/tutorial';
import { createServices } from '@/wiring/create-services';

/** A fresh state in which the player already bought the seats, so more than one customer can sit. */
export function withSeats(levels = 6): GameState {
  const state = createInitialState(0);
  state.upgrades = { extra_seat: levels };
  return state;
}

export function newGame(state: GameState = createInitialState(0)) {
  const bus = createEventBus<GameEvents>();
  const store = createStore(state);
  const world = createServices({ store, bus, rng: createSeededRng(4) });
  const saves = vi.fn();
  bus.on('saveRequested', saves);
  const tick = (ms: number): void => {
    for (let t = 0; t < ms; t += 100) bus.emit('tick', { deltaMs: 100 });
  };
  const shown = (): string | null => world.tutorial.machine.visibleStep()?.id ?? null;
  const guide = () => world.tutorial.getGuideContext();
  return { world, tick, shown, guide, saves, state, store };
}

// Plays the lesson the way the mascot asks: add what it points at, wait, serve who it points at.
export function playBasics(game: ReturnType<typeof newGame>): void {
  const { actions } = game.world.scene;
  for (let i = 0; i < 2; i++) actions.clickIngredient(nextIngredient(game.guide()) ?? '');
  game.tick(15_000);
  actions.clickCustomer(readyCustomerId(game.guide()) ?? -1);
}

// The preference lesson: wait for a customer who orders a drink they like (♥), brew it and serve them.
export function playLikes(game: ReturnType<typeof newGame>): void {
  for (let t = 0; t < 300_000 && game.shown() !== 'likes_spot'; t += 1_000) game.tick(1_000);
  playBasics(game);
  game.tick(6_100);
}
