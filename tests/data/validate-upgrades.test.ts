import { describe, expect, it } from 'vitest';
import { upgrades } from '@/data/upgrades/index';
import type { UpgradeDef } from '@/data/upgrades/types';
import { validateContent } from '@/data/validate/index';
import { upgradeTable } from '@/data/validate/tables';

const problems = (...items: UpgradeDef[]): string[] => validateContent(() => true, [upgradeTable(items)]);
const upgrade = (over: Partial<UpgradeDef> = {}): UpgradeDef => ({
  id: 'u1', kind: 'cauldron', baseCost: 5, growth: 1.1,
  effect: { stat: 'brewSpeed', mode: 'multiply', perLevel: 0.1 }, ...over,
});

describe('upgrade validation', () => {
  it('accepts a sound upgrade and the real upgrade list', () => {
    expect(problems(upgrade())).toEqual([]);
    expect(upgrades.length).toBeGreaterThan(0);
  });

  it('reports a free upgrade, no growth and a zero max level', () => {
    expect(problems(upgrade({ baseCost: 0, growth: 1, maxLevel: 0 }))).toHaveLength(3);
  });

  it('rejects an upgrade that changes nothing', () => {
    const idle = upgrade({ effect: { stat: 'brewSpeed', mode: 'multiply', perLevel: 0 } });
    expect(problems(idle)).toEqual(['upgrades.u1: effect.perLevel must be a positive number, got 0']);
  });
});
