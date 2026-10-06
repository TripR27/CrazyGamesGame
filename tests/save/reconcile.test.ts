import { describe, expect, it } from 'vitest';
import { num } from '@/core/numbers';
import { reconcile } from '@/save/reconcile';

const defaults = { gold: num(0), level: 1, name: 'tavern', nested: { flag: false, list: [1] }, owned: {} };

describe('reconcile', () => {
  it('uses saved values when they match the defaults types', () => {
    const result = reconcile(defaults, { gold: num(50), level: 3, name: 'inn', nested: { flag: true, list: [2, 3] } });

    expect(result.gold.eq(50)).toBe(true);
    expect(result.level).toBe(3);
    expect(result.name).toBe('inn');
    expect(result.nested).toEqual({ flag: true, list: [2, 3] });
  });

  it('fills fields missing from the save with defaults', () => {
    const result = reconcile(defaults, { level: 4 });

    expect(result.level).toBe(4);
    expect(result.name).toBe('tavern');
    expect(result.nested).toEqual({ flag: false, list: [1] });
  });

  it('drops fields that are not in the defaults', () => {
    const result = reconcile(defaults, { level: 2, removedFeature: 99 });
    expect('removedFeature' in result).toBe(false);
  });

  it('falls back to defaults on wrong types', () => {
    const result = reconcile(defaults, { gold: 'lots', level: '7', nested: 5, name: null });

    expect(result.gold.eq(0)).toBe(true);
    expect(result.level).toBe(1);
    expect(result.nested).toEqual({ flag: false, list: [1] });
    expect(result.name).toBe('tavern');
  });

  it('keeps open-ended maps (empty default objects) as saved', () => {
    const result = reconcile(defaults, { owned: { cauldron: 3, barrel: 1 } });
    expect(result.owned).toEqual({ cauldron: 3, barrel: 1 });
  });

  it('returns the defaults when the save is not an object', () => {
    expect(reconcile(defaults, 'garbage').level).toBe(1);
    expect(reconcile(defaults, null).name).toBe('tavern');
  });
});
