import type { Effect } from '@/data/common';
import { t } from '@/i18n/index';
import { withEffectIcon } from '@/scene/effects/effect-text';
import { formatNumber, type Num } from '@/shared/numbers';

export const GOLD_COLOR = '#f5c542';
const CHARM_COLOR = '#ffb3e6';
const EFFECT_COLOR = '#c8f0ff';

/** What a served drink earned on top of its price. */
export interface ServedExtras {
  tip: Num;
  /** Charm plus a VIP's own bonus. */
  extraReputation: number;
  liked: boolean;
}

interface Line {
  text: string;
  color: string;
}

/** One line per effect, so the player sees what every drink did (a new effect is one more entry). */
const EFFECT_LINES: Readonly<Record<Effect, (extras: ServedExtras) => Line>> = {
  strength: () => ({ text: t('effects.strength.served'), color: GOLD_COLOR }),
  speed: () => ({ text: t('effects.speed.served'), color: EFFECT_COLOR }),
  luck: ({ tip }) =>
    tip.gt(0)
      ? { text: t('effects.luck.served', { n: formatNumber(tip) }), color: GOLD_COLOR }
      : { text: t('effects.luck.missed'), color: EFFECT_COLOR },
  charm: ({ extraReputation }) => ({ text: t('effects.charm.served', { n: extraReputation }), color: CHARM_COLOR }),
};

/**
 * The lines that float up after serving: the drink's effect with its icon (marked ♥x2 when the customer likes
 * it), and the extra reputation of a VIP when the drink itself is not a charm drink.
 */
export function bonusLines(effect: Effect, extras: ServedExtras): Line[] {
  const line = EFFECT_LINES[effect](extras);
  const text = withEffectIcon(effect, line.text);
  const lines = [{ ...line, text: extras.liked ? t('effects.liked_float', { line: text }) : text }];
  if (effect !== 'charm' && extras.extraReputation > 0) {
    lines.push({ text: t('effects.reputation', { n: extras.extraReputation }), color: CHARM_COLOR });
  }
  return lines;
}
