import { formatNumber } from '@/core/format';
import type { Num } from '@/core/numbers';
import { t } from '@/i18n';

export const GOLD_COLOR = '#f5c542';
const CHARM_COLOR = '#ffb3e6';

/** The extra lines a drink effect earns: a tip (luck) and extra reputation (charm). Empty without either. */
export function bonusLines(tip: Num, extraReputation: number): { text: string; color: string }[] {
  return [
    ...(tip.gt(0) ? [{ text: t('effects.tip', { n: formatNumber(tip) }), color: GOLD_COLOR }] : []),
    ...(extraReputation > 0 ? [{ text: t('effects.reputation', { n: extraReputation }), color: CHARM_COLOR }] : []),
  ];
}
