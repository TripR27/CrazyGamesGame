import type { EventBus } from '@/core/events';
import type { GameEvents } from '@/core/game-events';
import { num, type Num } from '@/core/numbers';
import { REPUTATION_LEVELS } from '@/data/reputation/levels';
import { textKey } from '@/data/text-key';
import { t } from '@/i18n';

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

const name = (domain: 'upgrades' | 'recipes' | 'reputation' | 'ingredients' | 'rooms', id: string): string => t(textKey(domain, id, 'name'));

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
  return timeline;
}

/** Gold earned between two moments. */
export function earnedBetween(timeline: Timeline, fromMs: number, toMs: number): Num {
  return timeline.earned.filter((e) => e.ms >= fromMs && e.ms < toMs).reduce((sum, e) => sum.add(e.gold), num(0));
}
