import { describe, expect, it, vi } from 'vitest';
import { newGame } from './flows/helpers';
import { claimDaily, DAILY, dailyOffer, localDay } from '@/daily/daily';
import { PRESTIGE, sellTavern } from '@/prestige/prestige';
import { num } from '@/shared/numbers';
import { createInitialState } from '@/shared/state';
import { TUTORIAL_STEPS } from '@/tutorial/tutorial-steps';

/** Noon on a day in October 2026, local time, `plus` days later. */
const noon = (plus = 0): number => new Date(2026, 9, 12 + plus, 12, 0, 0).getTime();

function testClock(start = noon()) {
  let now = start;
  return { now: () => now, set: (ms: number) => void (now = ms) };
}

describe('the day', () => {
  it('changes at local midnight', () => {
    const late = new Date(2026, 9, 12, 23, 59, 0).getTime();
    const early = new Date(2026, 9, 13, 0, 1, 0).getTime();
    expect(localDay(noon())).toBe(localDay(late));
    expect(localDay(early)).toBe(localDay(late) + 1);
  });
});

describe('the daily bonus', () => {
  it('is there at once for a new player, grows each day in a row and starts over after a missed day', () => {
    const state = createInitialState(0);
    expect(dailyOffer(state, noon())).toMatchObject({ available: true, day: 1 });
    expect(dailyOffer(state, noon()).gold.toNumber()).toBe(DAILY.goldByLevel[0]);
    state.daily = { lastDay: localDay(noon()), streak: 1 };
    expect(dailyOffer(state, noon()).available).toBe(false);
    expect(dailyOffer(state, noon(1))).toMatchObject({ available: true, day: 2 });
    expect(dailyOffer(state, noon(1)).gold.toNumber()).toBe(75);
    expect(dailyOffer(state, noon(2)).day).toBe(1);
    state.daily.streak = 7;
    expect(dailyOffer(state, noon(1)).day).toBe(7);
    state.reputation = 700;
    expect(dailyOffer(state, noon(1)).gold.toNumber()).toBe(30_000 * 6);
  });

  it('is claimed once a day, for gold', () => {
    const clock = testClock();
    const state = createInitialState(0);
    state.tutorial.skipped = true;
    const g = newGame(state, clock);
    const claimed = vi.fn();
    g.world.bus.on('daily:claimed', claimed);
    claimDaily(g.world);
    claimDaily(g.world);
    expect(claimed).toHaveBeenCalledTimes(1);
    expect(g.world.store.getState().currencies.gold.toNumber()).toBe(50);
    clock.set(noon(1));
    claimDaily(g.world);
    expect(claimed).toHaveBeenLastCalledWith({ day: 2, gold: num(75) });
  });

  it('says when a new day began while the game is open', () => {
    const clock = testClock();
    const state = createInitialState(0);
    state.tutorial.skipped = true;
    state.daily = { lastDay: localDay(noon()), streak: 1 };
    const g = newGame(state, clock);
    const available = vi.fn();
    g.world.bus.on('daily:available', available);
    g.tick(DAILY.checkMs);
    expect(available).not.toHaveBeenCalled();
    clock.set(noon(1));
    g.tick(DAILY.checkMs);
    expect(available).toHaveBeenCalledTimes(1);
  });

  it('keeps its streak when the tavern is sold', () => {
    const state = createInitialState(0);
    state.reputation = 700;
    state.prestige.runEarned = num(PRESTIGE.hopGold * PRESTIGE.minHops ** 2);
    state.daily = { lastDay: 123, streak: 4 };
    const g = newGame(state);
    sellTavern(g.world);
    expect(g.world.store.getState().daily).toEqual({ lastDay: 123, streak: 4 });
  });
});

describe('the daily lesson', () => {
  it('points at the Claim button, then explains the streak', () => {
    const clock = testClock();
    const state = createInitialState(0);
    const at = TUTORIAL_STEPS.findIndex((s) => s.lesson === 'daily');
    state.tutorial.completedSteps = TUTORIAL_STEPS.slice(0, at).map((s) => s.id);
    const g = newGame(state, clock);
    expect(g.shown()).toBe('daily_claim');
    claimDaily(g.world);
    expect(g.shown()).toBe('daily_done');
    g.tick(6_100);
    expect(g.shown()).not.toBe('daily_done');
  });
});
