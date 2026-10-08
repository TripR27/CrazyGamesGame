import { vi } from 'vitest';
import { clickCustomer, clickReadyDrink } from '@/serving/serving';
import { clickIngredient } from '@/brewing/brewing';
import { createWorld } from '@/app/world';
import { createEventBus, type GameEvents } from '@/shared/events';
import { createSeededRng } from '@/shared/random';
import { createInitialState, type GameState, createStore } from '@/shared/state';
import type { Clock } from '@/shared/time';
import { nextIngredient, readyCustomerId, readyDrinkSlot } from '@/tutorial/tutorial-guide';

/** A fresh state in which the player already bought the seats, so more than one customer can sit. */
export function withSeats(levels = 6): GameState {
  const state = createInitialState(0);
  state.upgrades = { extra_seat: levels };
  return state;
}

/** A real world; pass a clock to control wall-clock time (hero trips end at an absolute time). */
export function newGame(state: GameState = createInitialState(0), clock?: Clock) {
  const bus = createEventBus<GameEvents>();
  const store = createStore(state);
  const world = createWorld({ store, bus, rng: createSeededRng(4), clock });
  const saves = vi.fn();
  bus.on('saveRequested', saves);
  const tick = (ms: number): void => {
    for (let t = 0; t < ms; t += 100) bus.emit('tick', { deltaMs: 100 });
  };
  const shown = (): string | null => world.tutorial.machine.visibleStep()?.id ?? null;
  const guide = () => world.tutorial.getGuideContext();
  return { world, tick, shown, guide, saves, state, store };
}

// Plays the lesson the way the mascot asks: add what it points at, wait, pick the drink up, serve who it points at.
export function playBasics(game: ReturnType<typeof newGame>): void {
  const w = game.world;
  for (let i = 0; i < 2; i++) clickIngredient(w, nextIngredient(game.guide()) ?? '');
  game.tick(15_000);
  clickReadyDrink(w, readyDrinkSlot(game.guide()) ?? -1);
  clickCustomer(w, readyCustomerId(game.guide()) ?? -1);
}

// The preference lesson: wait for a customer who orders a drink they like (♥), brew it and serve them.
export function playLikes(game: ReturnType<typeof newGame>): void {
  for (let t = 0; t < 300_000 && game.shown() !== 'likes_spot'; t += 1_000) game.tick(1_000);
  playBasics(game);
  game.tick(6_100);
}
