import { describe, expect, it } from 'vitest';
import type { UpgradeDef } from '@/data/upgrades/types';
import { getMultipliers } from '@/systems/economy/multipliers';

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
