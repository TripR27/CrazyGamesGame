import { describe, expect, it } from 'vitest';
import { num } from '@/core/numbers';
import { averagePayout, computeOffline, type OfflineInput } from '@/systems/offline';
import { plain, recipes, rich } from '../fixtures';

const HOUR = 3_600_000;
const input = (over: Partial<OfflineInput> = {}): OfflineInput => ({
  awayMs: HOUR,
  rates: { brew: 0.05, serve: 0.08 },
  limitHours: 2,
  reputation: 0,
  knownRecipes: recipes,
  customerTypes: [plain],
  sellMultiplier: num(1),
  ...over,
});

describe('average payout', () => {
  it('averages every known recipe against every customer type that comes', () => {
    expect(averagePayout(recipes, [plain], 0, num(1)).toNumber()).toBe(20); // (10 + 30) / 2
    expect(averagePayout(recipes, [plain, rich], 0, num(1)).toNumber()).toBe(25); // (10 + 15 + 30 + 45) / 4
  });

  it('leaves out customers whose reputation is not reached and counts the sell multiplier', () => {
    const vip = { ...rich, id: 'vip', minReputation: 50 };
    expect(averagePayout(recipes, [plain, vip], 0, num(2)).toNumber()).toBe(40);
    expect(averagePayout(recipes, [plain, vip], 50, num(1)).toNumber()).toBe(25);
  });

  it('is zero when nobody can order anything', () => {
    expect(averagePayout([], [plain], 0, num(1)).toNumber()).toBe(0);
    expect(averagePayout(recipes, [], 0, num(1)).toNumber()).toBe(0);
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
    expect(fast.served).toBe(225); // 3600 s x 0.125 customers per second x 0.5
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

  it('pay more with a higher sell multiplier, and stay sound for huge numbers', () => {
    expect(computeOffline(input({ sellMultiplier: num(2) })).gold.toNumber()).toBe(3600);
    expect(computeOffline(input({ sellMultiplier: num('1e200') })).gold.gt('1e200')).toBe(true);
  });
});
