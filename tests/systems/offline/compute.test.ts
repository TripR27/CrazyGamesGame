import { describe, expect, it } from 'vitest';
import { num } from '@/core/numbers';
import { averageReward, computeOffline, type OfflineInput } from '@/systems/offline';
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

  it('pay more with a higher sell multiplier, and stay sound for huge numbers', () => {
    expect(computeOffline(input({ sellMultiplier: num(2) })).gold.toNumber()).toBe(3600);
    expect(computeOffline(input({ sellMultiplier: num('1e200') })).gold.gt('1e200')).toBe(true);
  });
});
