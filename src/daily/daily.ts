import type { World } from '@/app/world';
import { levelFor } from '@/reputation/reputation';
import { num, type Num } from '@/shared/numbers';
import type { GameState } from '@/shared/state';

/** Placeholder numbers. */
export const DAILY = {
  /** Gold of a day-1 bonus per reputation level (level 1 first): it grows with the tavern. */
  goldByLevel: [50, 200, 800, 3000, 10_000, 30_000],
  /** The bonus of each day in a row is the day-1 bonus times this; after the last day it stays there. */
  streakFactors: [1, 1.5, 2, 2.5, 3, 4, 6],
  /** How often the open game looks whether a new day began. */
  checkMs: 60_000,
} as const;

const DAY_MS = 86_400_000;

/** The local calendar day of a wall-clock time, as a number (it changes at the player's midnight). */
export function localDay(ms: number): number {
  return Math.floor((ms - new Date(ms).getTimezoneOffset() * 60_000) / DAY_MS);
}

type DailyState = Pick<GameState, 'daily' | 'reputation'>;

/** The bonus as it stands now: whether it can be claimed today, which day of the streak that would be, and the gold. */
export interface DailyOffer {
  available: boolean;
  /** 1 to 7: the day of the streak a claim now counts as. */
  day: number;
  gold: Num;
}

export function dailyOffer(state: DailyState, now: number): DailyOffer {
  const today = localDay(now);
  const available = today > state.daily.lastDay;
  // Yesterday's claim continues the streak; a missed day starts it over.
  const continues = today === state.daily.lastDay + 1;
  const day = Math.min(DAILY.streakFactors.length, (continues ? state.daily.streak : 0) + 1);
  const base = DAILY.goldByLevel[levelFor(state.reputation) - 1] ?? DAILY.goldByLevel[0];
  const factor = DAILY.streakFactors[day - 1] ?? 1;
  return { available, day, gold: num(Math.round(base * factor)) };
}

/** Claim today's bonus: gold, and one more day in the streak. Does nothing when it was claimed today already. */
export function claimDaily({ store, bus, clock }: Pick<World, 'store' | 'bus' | 'clock'>): void {
  const now = clock.now();
  const offer = dailyOffer(store.getState(), now);
  if (!offer.available) return;
  store.update((s) => {
    s.currencies.gold = s.currencies.gold.add(offer.gold);
    s.daily = { lastDay: localDay(now), streak: offer.day };
  });
  bus.emit('daily:claimed', { day: offer.day, gold: offer.gold });
  bus.emit('saveRequested', {});
}

/** Announces `daily:available` when a new day begins while the game is open (checked once a minute). */
export function startDaily({ store, bus, clock }: Pick<World, 'store' | 'bus' | 'clock'>): void {
  let since = 0;
  let was = dailyOffer(store.getState(), clock.now()).available;
  bus.on('tick', ({ deltaMs }) => {
    since += deltaMs;
    if (since < DAILY.checkMs) return;
    since = 0;
    const now = dailyOffer(store.getState(), clock.now()).available;
    if (now && !was) bus.emit('daily:available', {});
    was = now;
  });
}
