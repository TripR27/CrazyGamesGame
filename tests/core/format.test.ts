import { describe, expect, it } from 'vitest';
import { formatNumber } from '@/core/format';
import { num } from '@/core/numbers';
import { MAX_SUFFIX_GROUP, suffixForGroup } from '@/core/suffixes';

const fmt = (value: number | string): string => formatNumber(num(value));

describe('formatNumber', () => {
  it('shows small numbers without a suffix', () => {
    expect(fmt(0)).toBe('0');
    expect(fmt(5)).toBe('5');
    expect(fmt(12.5)).toBe('12.5');
    expect(fmt(999)).toBe('999');
  });

  it('uses K, M, B, T and the named suffixes', () => {
    expect(fmt(1000)).toBe('1K');
    expect(fmt(1500)).toBe('1.5K');
    expect(fmt(12340)).toBe('12.34K');
    expect(fmt(1e6)).toBe('1M');
    expect(fmt(2.5e9)).toBe('2.5B');
    expect(fmt(1e12)).toBe('1T');
    expect(fmt(1e15)).toBe('1Qa');
  });

  it('rolls over to the next suffix instead of showing 1000', () => {
    expect(fmt(999.999)).toBe('1K');
    expect(fmt(999999)).toBe('1M');
  });

  it('continues with aa, ab, ... after the named suffixes', () => {
    expect(fmt('1e36')).toBe('1aa');
    expect(fmt('1e39')).toBe('1ab');
    expect(fmt(`1e${MAX_SUFFIX_GROUP * 3}`)).toBe('1zz');
  });

  it('falls back to scientific notation beyond the suffix table', () => {
    expect(fmt('1e3000')).toBe('1.00e3000');
  });

  it('handles negative numbers', () => {
    expect(fmt(-1500)).toBe('-1.5K');
  });
});

describe('suffixForGroup', () => {
  it('returns null out of range', () => {
    expect(suffixForGroup(-1)).toBeNull();
    expect(suffixForGroup(MAX_SUFFIX_GROUP + 1)).toBeNull();
  });
});
