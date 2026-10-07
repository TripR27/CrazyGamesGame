import { levelFor } from '@/reputation/reputation';
import { ROOMS } from '@/rooms/rooms';
import { createEventBus, type GameEvents } from '@/shared/events';
import type { Num } from '@/shared/numbers';
import { createSeededRng } from '@/shared/random';
import { createInitialState, type GameState, createStore } from '@/shared/state';
import { createBot, type BotOptions } from '@/sim/bot';
import { recordTimeline, type Timeline } from '@/sim/timeline';
import { getMultipliers } from '@/systems/economy/multipliers';
import { createServices } from '@/wiring/create-services';

const STEP_MS = 100;
const MINUTE_MS = 60_000;
const SNAPSHOT_MINUTES = [1, 2, 5, 10, 15, 20, 30, 45, 60, 90, 120];

export interface SimOptions {
  minutes: number;
  seed: number;
  /** Time between two player actions (clicks). */
  actionMs: number;
  bot: BotOptions;
  /** From this minute on the player does nothing at all and only the staff work (to measure idle income). */
  idleFromMinute?: number;
}

export interface Snapshot {
  minute: number;
  gold: Num;
  reputation: number;
  level: number;
  recipes: number;
  seats: number;
  staff: string;
}

export interface SimResult {
  options: SimOptions;
  timeline: Timeline;
  snapshots: Snapshot[];
}

function snapshot(minute: number, state: GameState): Snapshot {
  const stats = getMultipliers(state);
  return {
    minute,
    gold: state.currencies.gold,
    reputation: Math.floor(state.reputation),
    level: levelFor(state.reputation),
    recipes: state.recipesDiscovered.length,
    // Seats downstairs plus the seats of the built rooms.
    seats: stats.seats.toNumber() + ROOMS.filter((r) => state.roomsBuilt.includes(r.id)).reduce((sum, r) => sum + r.seats, 0),
    staff: `${stats.autoBrew.toNumber().toFixed(2)}/${stats.autoServe.toNumber().toFixed(2)}`,
  };
}

/**
 * Plays the real game (the same wiring as the browser, no rendering) with a simulated player and a seeded random
 * generator, so a run is repeatable. The tutorial is skipped: it only slows the player down on purpose.
 */
export function runSimulation(options: SimOptions): SimResult {
  const state = createInitialState(0);
  state.tutorial.skipped = true;
  const store = createStore(state);
  const bus = createEventBus<GameEvents>();
  let now = 0;
  const world = createServices({ store, bus, rng: createSeededRng(options.seed), clock: { now: () => now } });
  const timeline = recordTimeline(bus, () => now);
  const bot = createBot(world, store, options.bot);
  const snapshots: Snapshot[] = [];
  let nextAction = 0;
  const idleFrom = (options.idleFromMinute ?? Infinity) * MINUTE_MS;
  for (now = 0; now < options.minutes * MINUTE_MS; now += STEP_MS) {
    bus.emit('tick', { deltaMs: STEP_MS });
    if (now >= nextAction && now < idleFrom) {
      bot.act();
      nextAction += options.actionMs;
    }
    const minute = (now + STEP_MS) / MINUTE_MS;
    if (SNAPSHOT_MINUTES.includes(minute)) snapshots.push(snapshot(minute, store.getState()));
  }
  return { options, timeline, snapshots };
}
