import { describe, expect, it, vi } from 'vitest';
import { plain, recipes, rich } from './fixtures';
import { computeOffline, offlineWithMissed, type OfflineInput, averageReward, applyOffline, type OfflineState, createOfflineInbox, type OfflineReport, formatDuration, toWelcomeView } from '@/offline/offline';
import { num } from '@/shared/numbers';
import { createStore } from '@/shared/state';

const HOUR = 3_600_000;
const input = (over: Partial<OfflineInput> = {}): OfflineInput => ({
  awayMs: HOUR,
  rates: { brew: 0.05, serve: 0.08 },
  limitHours: 2,
  share: 0.5, // Night Shift bought
  reputation: 0,
  knownRecipes: recipes,
  customerTypes: [plain],
  sellMultiplier: num(1),
  ...over,
});

describe('average reward', () => {
  it('averages every known recipe against every customer type that comes', () => {
    expect(averageReward(recipes, [plain], 0, num(1)).gold.toNumber()).toBe(20); // (10 + 30) / 2
    expect(averageReward(recipes, [plain, rich], 0, num(1)).gold.toNumber()).toBe(25); // (10 + 15 + 30 + 45) / 4
  });

  it('leaves out customers whose reputation is not reached and counts the sell multiplier', () => {
    const vip = { ...rich, id: 'vip', minLevel: 4 };
    expect(averageReward(recipes, [plain, vip], 0, num(2)).gold.toNumber()).toBe(40);
    expect(averageReward(recipes, [plain, vip], 120, num(1)).gold.toNumber()).toBe(25);
  });

  it('is zero when nobody can order anything', () => {
    expect(averageReward([], [plain], 0, num(1)).gold.toNumber()).toBe(0);
    expect(averageReward(recipes, [], 0, num(1)).gold.toNumber()).toBe(0);
  });
});

describe('average reward with drink effects', () => {
  const strong = { ...recipes[0]!, effect: 'strength' as const };
  const charming = { ...recipes[1]!, effect: 'charm' as const };
  const lucky = { ...recipes[0]!, effect: 'luck' as const };

  it('counts strength, expected tips and charm, and liked drinks are ordered more often', () => {
    expect(averageReward([strong], [plain], 0, num(1)).gold.toNumber()).toBe(13); // 10 x 1.25, rounded
    expect(averageReward([lucky], [plain], 0, num(1)).gold.toNumber()).toBe(11.25); // 10 + 25% of a 5 tip
    expect(averageReward([charming], [plain], 0, num(1)).reputation).toBe(2);
    const fan = { ...plain, likes: ['charm' as const] };
    // Charm liked: 3 reputation, ordered twice as often as the 1-reputation drink: (2 x 3 + 1) / 3.
    expect(averageReward([recipes[0]!, charming], [fan], 0, num(1)).reputation).toBeCloseTo(7 / 3);
  });
});

describe('average reward with VIPs', () => {
  const king = { ...rich, id: 'king', minLevel: 3, spendMultiplier: 3, vip: true, reputationBonus: 3 };

  it('mixes in VIPs by their chance once their level is reached; they order the priciest drink', () => {
    expect(averageReward(recipes, [plain, king], 0, num(1)).gold.toNumber()).toBe(20); // level 1: no VIP yet
    // Level 3: 90% regular (avg 20) and 10% king (30 x 3 = 90): 18 + 9.
    const mixed = averageReward(recipes, [plain, king], 40, num(1));
    expect(mixed.gold.toNumber()).toBeCloseTo(27);
    expect(mixed.reputation).toBeCloseTo(0.9 * 1 + 0.1 * 4);
  });
});

describe('offline earnings', () => {
  it('work out drinks from the slowest link, half of the pace, and pay the average price', () => {
    const report = computeOffline(input());
    expect(report.served).toBe(90); // 3600 s x 0.05 per second x 0.5
    expect(report.gold.toNumber()).toBe(1800);
    expect(report.reputation).toBe(90);
    expect(report.capped).toBe(false);
  });

  it('are limited by how fast customers come in, however fast the staff are', () => {
    const fast = computeOffline(input({ rates: { brew: 5, serve: 5 } }));
    expect(fast.served).toBe(150); // 3600 s x (1 customer per 12 s) x 0.5
  });

  it('need both a brewer and a waitress', () => {
    for (const rates of [{ brew: 0.1, serve: 0 }, { brew: 0, serve: 0.1 }, { brew: 0, serve: 0 }]) {
      const report = computeOffline(input({ rates }));
      expect(report).toMatchObject({ served: 0, hadStaff: false });
      expect(report.gold.toNumber()).toBe(0);
    }
  });

  it('stop at the offline limit, and a higher limit counts more time', () => {
    const long = computeOffline(input({ awayMs: 10 * HOUR }));
    expect(long).toMatchObject({ capped: true, countedMs: 2 * HOUR, served: 180 });
    expect(computeOffline(input({ awayMs: 10 * HOUR, limitHours: 4 })).served).toBe(360);
  });

  it('count nothing for no time or a clock that went backwards', () => {
    expect(computeOffline(input({ awayMs: 0 })).served).toBe(0);
    expect(computeOffline(input({ awayMs: -5000 }))).toMatchObject({ served: 0, awayMs: 0 });
  });

  it('count only the bought share of the pace: nothing without Night Shift, more with Night Owls', () => {
    expect(computeOffline(input({ share: 0 }))).toMatchObject({ served: 0, hadStaff: true });
    expect(computeOffline(input({ share: 0.8 })).served).toBe(144); // 3600 s x 0.05 x 0.8
  });

  it('say what a crew without Night Shift missed, and nothing when there was no crew or it was bought', () => {
    const missed = offlineWithMissed(input({ share: 0 }));
    expect(missed.served).toBe(0);
    expect(missed.missed.toNumber()).toBe(1800); // what Night Shift (half the pace) would have earned
    expect(offlineWithMissed(input()).missed.toNumber()).toBe(0);
    expect(offlineWithMissed(input({ share: 0, rates: { brew: 0.1, serve: 0 } })).missed.toNumber()).toBe(0);
  });

  it('pay more with a higher sell multiplier, and stay sound for huge numbers', () => {
    expect(computeOffline(input({ sellMultiplier: num(2) })).gold.toNumber()).toBe(3600);
    expect(computeOffline(input({ sellMultiplier: num('1e200') })).gold.gt('1e200')).toBe(true);
  });
});

const report = (over: Partial<OfflineReport> = {}): OfflineReport => ({
  awayMs: 1000, countedMs: 1000, capped: false, limitHours: 2, hadStaff: true, served: 4, gold: num(80), reputation: 4, missed: num(0), ...over,
});

describe('paying out offline earnings', () => {
  it('adds the gold and the reputation', () => {
    const store = createStore<OfflineState>({ currencies: { gold: num(10) }, reputation: 1 });
    applyOffline(store, report());
    expect(store.getState().currencies.gold.toNumber()).toBe(90);
    expect(store.getState().reputation).toBe(5);
  });

  it('changes nothing, and notifies nobody, when nothing was earned', () => {
    const store = createStore<OfflineState>({ currencies: { gold: num(10) }, reputation: 1 });
    const seen = vi.fn();
    store.subscribe(seen);
    applyOffline(store, report({ served: 0, gold: num(0), reputation: 0 }));
    expect(seen).not.toHaveBeenCalled();
  });
});

describe('the offline inbox', () => {
  it('hands a waiting report over once', () => {
    const inbox = createOfflineInbox();
    expect(inbox.take()).toBeNull();
    inbox.post(report());
    expect(inbox.take()?.served).toBe(4);
    expect(inbox.take()).toBeNull();
  });

  it('tells subscribers about new reports until they unsubscribe', () => {
    const inbox = createOfflineInbox();
    const seen = vi.fn();
    const stop = inbox.subscribe(seen);
    inbox.post(report());
    stop();
    inbox.post(report());
    expect(seen).toHaveBeenCalledTimes(1);
  });
});

const welcomeReport = (over: Partial<OfflineReport> = {}): OfflineReport => ({
  awayMs: 3_600_000, countedMs: 3_600_000, capped: false, limitHours: 2, hadStaff: true, served: 90, gold: num(1800), reputation: 90, missed: num(0), ...over,
});

describe('formatDuration', () => {
  it('shows the two biggest units that are not zero', () => {
    expect(formatDuration(3_600_000 + 23 * 60_000 + 5000)).toBe('1h 23m');
    expect(formatDuration(45 * 60_000)).toBe('45m');
    expect(formatDuration(2 * 3_600_000)).toBe('2h');
    expect(formatDuration(50_000)).toBe('50s');
  });
});

describe('welcome-back window', () => {
  it('lists the time away, the customers served and the gold earned', () => {
    const view = toWelcomeView(welcomeReport());
    expect(view.title).toBe('Welcome back!');
    expect(view.lines).toEqual(['You were away for 1h.', 'Customers served: 90', 'Gold earned: 1.8K']);
  });

  it('tells a player without a full crew what to do', () => {
    const view = toWelcomeView(welcomeReport({ served: 0, hadStaff: false, gold: num(0) }));
    expect(view.lines[1]).toMatch(/Hire a brewer and a waitress/);
  });

  it('tells a crew without Night Shift what it missed and where to buy it', () => {
    const view = toWelcomeView(welcomeReport({ served: 0, gold: num(0), missed: num(1200), capped: true }));
    expect(view.lines).toEqual([
      'You were away for 1h.',
      'Your staff went home. With Night Shift they could have earned 1.2K gold.',
      'Buy Night Shift in the shop and they keep working while you are away.',
    ]);
  });

  it('says when the staff stopped working before the player came back', () => {
    const view = toWelcomeView(welcomeReport({ awayMs: 5 * 3_600_000, countedMs: 2 * 3_600_000, capped: true }));
    expect(view.lines.at(-1)).toBe('Staff stop working after 2h away.');
  });
});
