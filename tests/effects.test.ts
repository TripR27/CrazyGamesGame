import { describe, expect, it } from 'vitest';
import { orderLabel } from '@/customers/customers-view';
import { hasKey } from '@/i18n/index';
import { EFFECT_POWER, LIKED_ORDER_WEIGHT, drinkBonus, isLiked, orderWeight, rollTip, tipSize } from '@/serving/effects';
import { bonusLines } from '@/serving/serving-view';
import { type Effect, EFFECTS } from '@/shared/content';
import { num } from '@/shared/numbers';
import { createSeededRng, pickWeighted } from '@/shared/random';

const drink = (effect: Effect) => ({ effect });
const fan = (...likes: Effect[]) => ({ likes });

describe('drink effects', () => {
  it('always work, also for a customer who does not like them', () => {
    expect(drinkBonus(drink('strength'), fan()).priceFactor).toBe(1 + EFFECT_POWER.strengthExtraPrice);
    expect(drinkBonus(drink('speed'), fan()).drinkTimeFactor).toBeCloseTo(1 - EFFECT_POWER.speedDrinkCut);
    expect(drinkBonus(drink('luck'), fan()).tipChance).toBe(EFFECT_POWER.luckTipChance);
    expect(drinkBonus(drink('charm'), fan()).extraReputation).toBe(EFFECT_POWER.charmExtraReputation);
  });

  it('count double when the customer likes the effect', () => {
    const liked = EFFECT_POWER.likedFactor;
    expect(drinkBonus(drink('strength'), fan('strength')).priceFactor).toBe(1 + EFFECT_POWER.strengthExtraPrice * liked);
    expect(drinkBonus(drink('speed'), fan('speed')).drinkTimeFactor).toBeCloseTo(1 - EFFECT_POWER.speedDrinkCut * liked);
    expect(drinkBonus(drink('luck'), fan('luck')).tipChance).toBe(EFFECT_POWER.luckTipChance * liked);
    expect(drinkBonus(drink('charm'), fan('charm', 'luck')).extraReputation).toBe(EFFECT_POWER.charmExtraReputation * liked);
  });

  it('only change what they are about; the rest stays neutral', () => {
    expect(drinkBonus(drink('charm'), fan('charm'))).toMatchObject({ priceFactor: 1, tipChance: 0, drinkTimeFactor: 1 });
    expect(drinkBonus(drink('strength'), fan('strength'))).toMatchObject({ extraReputation: 0, tipChance: 0 });
  });

  it('know which customers like a drink, and let them order it more often', () => {
    expect(isLiked(fan('speed', 'luck'), drink('luck'))).toBe(true);
    expect(isLiked(fan('speed'), drink('charm'))).toBe(false);
    expect(orderWeight(fan('speed'), drink('speed'))).toBe(LIKED_ORDER_WEIGHT);
    expect(orderWeight(fan('speed'), drink('charm'))).toBe(1);
  });
});

describe('tips', () => {
  const lucky = drinkBonus(drink('luck'), fan());

  it('come by chance, as a share of the price in whole coins', () => {
    expect(rollTip(num(20), lucky, () => 0).toNumber()).toBe(20 * EFFECT_POWER.luckTipShare);
    expect(rollTip(num(20), lucky, () => 0.99).toNumber()).toBe(0);
    expect(tipSize(num(1), lucky).toNumber()).toBe(1); // never less than a coin
  });

  it('never come, and use no randomness, without luck', () => {
    let rolls = 0;
    const counting = () => (rolls++, 0);
    expect(rollTip(num(20), drinkBonus(drink('strength'), fan()), counting).toNumber()).toBe(0);
    expect(rolls).toBe(0);
  });
});

describe('weighted pick', () => {
  it('picks in proportion to the weights', () => {
    const rng = createSeededRng(7);
    const picks = Array.from({ length: 3000 }, () => pickWeighted(rng, ['a', 'b'], (x) => (x === 'a' ? 2 : 1)));
    const share = picks.filter((p) => p === 'a').length / picks.length;
    expect(share).toBeGreaterThan(0.62);
    expect(share).toBeLessThan(0.71);
  });

  it('gives nothing for an empty list', () => {
    expect(pickWeighted(() => 0.5, [], () => 1)).toBeUndefined();
  });
});

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
