import { describe, expect, it } from 'vitest';
import { num } from '@/core/numbers';
import { levelCost, packCost } from '@/systems/upgrades';
import { quote } from '@/systems/upgrades/quote';
import { priceUp } from '../fixtures';

// priceUp costs 10, 20, 40 for levels 0, 1, 2 (max level 3).
const uncapped = { ...priceUp, maxLevel: undefined };

describe('upgrade cost', () => {
  it('follows base x growth^level, in whole coins', () => {
    expect([0, 1, 2, 3].map((n) => levelCost(priceUp, n).toNumber())).toEqual([10, 20, 40, 80]);
    expect(levelCost({ ...priceUp, baseCost: 20, growth: 1.15 }, 2).toNumber()).toBe(26);
  });

  it('adds a pack of levels up as the sum of the single costs', () => {
    expect(packCost(priceUp, 0, 3).toNumber()).toBe(70);
    expect(packCost(priceUp, 1, 2).toNumber()).toBe(60);
    expect(packCost(priceUp, 4, 1).toNumber()).toBe(160);
  });
});

describe('buy quotes', () => {
  it('prices x1 and x10 and says whether the gold is enough', () => {
    expect(quote(priceUp, 0, num(15), 1, 3)).toMatchObject({ count: 1, affordable: true });
    expect(quote(priceUp, 0, num(5), 1, 3)).toMatchObject({ count: 1, affordable: false });
    const ten = quote(uncapped, 0, num(5000), 10, Infinity);
    expect(ten.count).toBe(10);
    expect(ten.cost.toNumber()).toBe(10_230);
    expect(ten.affordable).toBe(false);
  });

  it('caps a fixed amount at the levels that are left', () => {
    expect(quote(priceUp, 2, num(1000), 10, 1)).toMatchObject({ count: 1, affordable: true });
  });

  it('buys as many as the gold allows with max', () => {
    expect(quote(priceUp, 0, num(75), 'max', 3)).toMatchObject({ count: 3, affordable: true });
    const two = quote(priceUp, 0, num(35), 'max', 3);
    expect(two.count).toBe(2);
    expect(two.cost.toNumber()).toBe(30);
  });

  it('shows the next level, not affordable, when max cannot buy anything', () => {
    const poor = quote(priceUp, 1, num(5), 'max', 2);
    expect(poor).toMatchObject({ count: 1, affordable: false });
    expect(poor.cost.toNumber()).toBe(20);
  });

  it('has nothing to buy once the upgrade is maxed', () => {
    for (const amount of [1, 10, 'max'] as const) {
      expect(quote(priceUp, 3, num(1e9), amount, 0)).toMatchObject({ count: 0, affordable: false });
    }
  });

  it('never overspends with max, however much gold there is', () => {
    for (const gold of [10, 29, 30, 70, 1e6, 1e50, 1e200].map(num)) {
      const deal = quote(uncapped, 0, gold, 'max', Infinity);
      expect(deal.cost.lte(gold)).toBe(true);
      expect(packCost(uncapped, 0, deal.count + 1).gt(gold)).toBe(true);
    }
  });
});
