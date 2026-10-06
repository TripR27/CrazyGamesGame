import { describe, expect, it } from 'vitest';
import { num } from '@/core/numbers';
import { decode, encode } from '@/save/codec';

describe('codec', () => {
  it('round-trips plain values', () => {
    const value = { a: 1, b: 'text', c: [1, 2, 3], d: { e: true, f: null } };
    expect(decode(encode(value))).toEqual(value);
  });

  it('round-trips Decimal values anywhere in the tree, even huge ones', () => {
    const value = { gold: num('1.5e500'), nested: { list: [num(5), num('1e9999')] } };
    const result = decode(encode(value)) as typeof value;

    expect(result.gold.eq('1.5e500')).toBe(true);
    expect(result.nested.list[0]?.eq(5)).toBe(true);
    expect(result.nested.list[1]?.eq('1e9999')).toBe(true);
  });

  it('stores Decimals as tagged strings', () => {
    expect(encode({ gold: num(5) })).toBe('{"gold":{"$num":"5"}}');
  });

  it('throws on invalid JSON', () => {
    expect(() => decode('{nope')).toThrow();
  });
});
