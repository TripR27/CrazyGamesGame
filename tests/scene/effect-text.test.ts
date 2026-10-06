import { describe, expect, it } from 'vitest';
import { num } from '@/core/numbers';
import { EFFECTS } from '@/data/common';
import { hasKey } from '@/i18n';
import { orderLabel } from '@/scene/customers/order-label';
import { bonusLines } from '@/scene/effects/bonus-lines';

const plain = { tip: num(0), extraReputation: 0, liked: false };
const texts = (lines: { text: string }[]): string[] => lines.map((l) => l.text);

describe('effect icons', () => {
  it('has an icon and every text for each effect', () => {
    const fields = ['icon', 'name', 'short', 'does', 'served'];
    const missing = EFFECTS.flatMap((e) => fields.map((f) => `effects.${e}.${f}`)).filter((key) => !hasKey(key));
    expect(missing).toEqual([]);
  });

  it('puts the icon of the effect in the order bubble, with a ♥ when liked and a crown for a VIP', () => {
    const order = { recipeId: 'glowcap_stout', liked: false, vip: false };
    expect(orderLabel(order, 'speed')).toBe('⚡ Glowcap Stout');
    expect(orderLabel({ ...order, liked: true }, 'speed')).toBe('♥⚡ Glowcap Stout');
    expect(orderLabel({ ...order, vip: true }, 'speed')).toBe('👑 ⚡ Glowcap Stout');
  });
});

describe('the lines that float up after serving', () => {
  it('always shows what the drink did, with its icon', () => {
    expect(texts(bonusLines('speed', plain))).toEqual(['⚡ Quick drinker!']);
    expect(texts(bonusLines('strength', plain))).toEqual(['💪 Big spender!']);
    expect(texts(bonusLines('luck', plain))).toEqual(['🍀 No tip this time']);
    expect(texts(bonusLines('luck', { ...plain, tip: num(5) }))).toEqual(['🍀 +5 tip!']);
    expect(texts(bonusLines('charm', { ...plain, extraReputation: 1 }))).toEqual(['💖 +1 reputation']);
  });

  it('marks a liked effect as double, and adds a VIP bonus to a drink without charm', () => {
    expect(texts(bonusLines('speed', { ...plain, liked: true }))).toEqual(['⚡ Quick drinker! ♥x2']);
    expect(texts(bonusLines('strength', { ...plain, extraReputation: 3 }))).toEqual(['💪 Big spender!', '+3 reputation']);
  });
});
