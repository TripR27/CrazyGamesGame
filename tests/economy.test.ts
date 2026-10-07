import { describe, expect, it, vi } from 'vitest';
import { priceUp, economy, upgradeDefs, ab, catalog, floorWith, rng } from './fixtures';
import { addIngredient, createStation } from '@/brewing/brewing';
import type { UpgradeDef } from '@/economy/upgrade-data';
import { levelCost, packCost, quote, firstAffordable, watchAffordable, buyUpgrade, getMultipliers } from '@/economy/upgrades';
import { serveCustomer } from '@/serving/serving';
import { createEventBus, type GameEvents } from '@/shared/events';
import { num } from '@/shared/numbers';

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

describe('buying an upgrade', () => {
  it('takes the gold and raises the level', () => {
    const store = economy(100);
    expect(buyUpgrade(store, priceUp, 1)).toBe(1);
    expect(store.getState().currencies.gold.toNumber()).toBe(90);
    expect(store.getState().upgrades).toEqual({ price_up: 1 });
  });

  it('buys a whole pack for the quoted price', () => {
    const store = economy(100);
    expect(buyUpgrade(store, priceUp, 'max')).toBe(3);
    expect(store.getState().currencies.gold.toNumber()).toBe(30);
    expect(store.getState().upgrades.price_up).toBe(3);
  });

  it('does nothing, and notifies nobody, when the gold is not enough or it is maxed', () => {
    const store = economy(5);
    const seen = vi.fn();
    store.subscribe(seen);
    expect(buyUpgrade(store, priceUp, 1)).toBe(0);
    store.update((s) => void (s.upgrades.price_up = 3));
    seen.mockClear();
    store.update((s) => void (s.currencies.gold = s.currencies.gold.add(1e6)));
    seen.mockClear();
    expect(buyUpgrade(store, priceUp, 'max')).toBe(0);
    expect(seen).not.toHaveBeenCalled();
  });
});

describe('watching what the player can afford', () => {
  it('finds the first upgrade that one more level pays for', () => {
    expect(firstAffordable(economy(9).getState(), upgradeDefs)).toBeUndefined();
    expect(firstAffordable(economy(10).getState(), upgradeDefs)?.id).toBe('price_up');
  });

  it('announces the moment the player can first pay for something, and again after each dry spell', () => {
    const store = economy(0);
    const bus = createEventBus<GameEvents>();
    const seen = vi.fn();
    bus.on('upgrade:affordable', seen);
    watchAffordable(store, bus, upgradeDefs);

    store.update((s) => void (s.currencies.gold = s.currencies.gold.add(4)));
    expect(seen).not.toHaveBeenCalled();
    store.update((s) => void (s.currencies.gold = s.currencies.gold.add(6)));
    expect(seen).toHaveBeenCalledTimes(1);
    store.update((s) => void (s.currencies.gold = s.currencies.gold.add(1)));
    expect(seen).toHaveBeenCalledTimes(1); // still affordable: no repeat

    buyUpgrade(store, priceUp, 1);
    store.update((s) => void (s.currencies.gold = s.currencies.gold.add(50)));
    expect(seen).toHaveBeenCalledTimes(2);
  });
});

describe('brew speed', () => {
  it('shortens the brew time by the speed factor', () => {
    const normal = createStation(3);
    const fast = createStation(3, 2);
    for (const s of [normal, fast]) {
      addIngredient(s, 'a', [ab], rng());
      addIngredient(s, 'b', [ab], rng());
    }
    expect(normal.brewing?.totalMs).toBe(2000);
    expect(fast.brewing?.totalMs).toBe(1000);
  });
});

describe('sell price', () => {
  function serveWith(multiplier: number): number {
    const station = createStation(3);
    station.ready.push('ab');
    const eco = economy();
    serveCustomer(
      { floor: floorWith(['plain', 'ab']), station, economy: eco, catalog, rng: rng(), getSellMultiplier: () => num(multiplier) },
      1,
    );
    return eco.getState().currencies.gold.toNumber();
  }

  it('multiplies what a served drink pays', () => {
    expect(serveWith(1)).toBe(10);
    expect(serveWith(1.5)).toBe(15);
  });

  it('still pays at least one coin', () => {
    expect(serveWith(0.001)).toBe(1);
  });
});

const def = (id: string, stat: UpgradeDef['effect']['stat'], mode: 'add' | 'multiply', perLevel: number, maxLevel?: number): UpgradeDef => ({
  id, kind: 'tavern', baseCost: 10, growth: 2, effect: { stat, mode, perLevel }, maxLevel,
});
const stats = (levels: Record<string, number>, defs: UpgradeDef[]) => {
  const m = getMultipliers({ upgrades: levels }, defs);
  return { speed: m.brewSpeed.toNumber(), price: m.sellPrice.toNumber(), storage: m.storage.toNumber() };
};

describe('getMultipliers', () => {
  it('gives the base values when nothing is bought', () => {
    expect(getMultipliers({ upgrades: {} }).sellPrice.toNumber()).toBe(1);
    expect(stats({}, [def('a', 'brewSpeed', 'multiply', 0.1)])).toEqual({ speed: 1, price: 1, storage: 3 });
  });

  it('compounds factors per level and adds amounts per level', () => {
    const defs = [def('speed', 'brewSpeed', 'multiply', 0.5), def('bar', 'storage', 'add', 1)];
    const result = stats({ speed: 2, bar: 2 }, defs);
    expect(result.speed).toBeCloseTo(2.25);
    expect(result.storage).toBe(5);
  });

  it('counts added amounts before factors, whatever the order of the list', () => {
    const add = def('add', 'sellPrice', 'add', 1);
    const times = def('times', 'sellPrice', 'multiply', 1);
    expect(stats({ add: 1, times: 1 }, [times, add]).price).toBe(4);
    expect(stats({ add: 1, times: 1 }, [add, times]).price).toBe(4);
  });

  it('ignores unknown upgrade ids and caps levels at the maximum', () => {
    const defs = [def('capped', 'storage', 'add', 1, 2)];
    expect(stats({ gone: 9, capped: 50 }, defs).storage).toBe(5);
  });

  it('reads the real upgrade data by default', () => {
    expect(getMultipliers({ upgrades: { swift_cauldron: 1 } }).brewSpeed.toNumber()).toBeCloseTo(1.1);
  });
});
