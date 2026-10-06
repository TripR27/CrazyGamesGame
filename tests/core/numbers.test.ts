import { describe, expect, it } from 'vitest';
import { num, ONE, parseNum, serializeNum, ZERO } from '@/core/numbers';

describe('numbers', () => {
  it('exposes ZERO and ONE', () => {
    expect(ZERO.eq(0)).toBe(true);
    expect(ONE.eq(1)).toBe(true);
  });

  it.each(['0', '0.5', '123456789012345678901234567890', '1e500', '4.2e12345'])(
    'round-trips %s through a string',
    (source) => {
      const value = num(source);
      expect(parseNum(serializeNum(value)).eq(value)).toBe(true);
    },
  );

  it('keeps precision beyond the double range', () => {
    const huge = num('1e400').mul(num('1e400'));
    expect(huge.eq(num('1e800'))).toBe(true);
  });
});
