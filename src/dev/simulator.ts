import { createWorld } from '@/app/world';
import { createBot, type BotOptions } from '@/dev/bot';
import { getMultipliers } from '@/economy/upgrades';
import { t } from '@/i18n/translator';
import { REPUTATION_LEVELS, levelFor } from '@/reputation/reputation';
import { ROOMS } from '@/rooms/rooms';
import { textKey } from '@/shared/content';
import { type EventBus, type GameEvents, createEventBus } from '@/shared/events';
import { num, type Num } from '@/shared/numbers';
import { createSeededRng } from '@/shared/random';
import { type GameState, createInitialState, createStore } from '@/shared/state';

export interface TimelineEntry {
  ms: number;
  text: string;
}

/** What happened during a simulated run, read from the game bus: milestones, purchases and money earned. */
export interface Timeline {
  entries: TimelineEntry[];
  /** Times of every purchase, upgrades and ingredients (to count purchases in the first minutes). */
  purchases: number[];
  /** Gold earned by serving (prices and tips), with the time of each serve. */
  earned: { ms: number; gold: Num }[];
}

const name = (domain: 'upgrades' | 'recipes' | 'reputation' | 'ingredients' | 'rooms' | 'decor' | 'heroes' | 'gear', id: string): string =>
  t(textKey(domain, id, 'name'));

/** Starts recording; `now` gives the simulated time. Only firsts are written to the timeline, to keep it short. */
export function recordTimeline(bus: EventBus<GameEvents>, now: () => number): Timeline {
  const timeline: Timeline = { entries: [], purchases: [], earned: [] };
  const seen = new Set<string>();
  const once = (key: string, text: string): void => {
    if (seen.has(key)) return;
    seen.add(key);
    timeline.entries.push({ ms: now(), text });
  };
  bus.on('customer:served', ({ gold, tip }) => {
    once('served', 'first customer served');
    timeline.earned.push({ ms: now(), gold: num(gold).add(tip) });
  });
  bus.on('upgrade:bought', ({ id, count }) => {
    for (let i = 0; i < count; i++) timeline.purchases.push(now());
    once(`upgrade:${id}`, `first ${name('upgrades', id)}`);
  });
  bus.on('reputation:levelUp', ({ level }) => {
    once(`level:${level}`, `level ${level}: ${name('reputation', REPUTATION_LEVELS[level - 1]?.id ?? '')}`);
  });
  bus.on('recipe:discovered', ({ recipeId }) => once(`recipe:${recipeId}`, `discovered ${name('recipes', recipeId)}`));
  bus.on('vip:arrived', () => once('vip', 'first VIP'));
  bus.on('ingredient:bought', ({ id }) => {
    timeline.purchases.push(now());
    once(`ingredient:${id}`, `bought ${name('ingredients', id)}`);
  });
  bus.on('room:built', ({ id }) => {
    timeline.purchases.push(now());
    once(`room:${id}`, `built ${name('rooms', id)}`);
  });
  bus.on('decor:bought', ({ id }) => {
    timeline.purchases.push(now());
    once(`decor:${id}`, `bought ${name('decor', id)}`);
  });
  bus.on('hero:recruited', ({ id }) => once(`hero:${id}`, `hero ${name('heroes', id)} joined`));
  bus.on('hero:returned', ({ id, gear }) => {
    once(`returned:${id}`, `${name('heroes', id)} back from the swamp`);
    if (gear !== null) once(`found:${gear}`, `found ${name('gear', gear)}`);
  });
  bus.on('gear:bought', ({ id }) => {
    timeline.purchases.push(now());
    once(`gear:${id}`, `bought ${name('gear', id)}`);
  });
  return timeline;
}

/** Gold earned between two moments. */
export function earnedBetween(timeline: Timeline, fromMs: number, toMs: number): Num {
  return timeline.earned.filter((e) => e.ms >= fromMs && e.ms < toMs).reduce((sum, e) => sum.add(e.gold), num(0));
}

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
  const world = createWorld({ store, bus, rng: createSeededRng(options.seed), clock: { now: () => now } });
  const timeline = recordTimeline(bus, () => now);
  const bot = createBot(world, options.bot);
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
