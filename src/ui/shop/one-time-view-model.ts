import { formatNumber } from '@/core/format';
import { REPUTATION_LEVELS } from '@/data/reputation/levels';
import { textKey } from '@/data/text-key';
import { t } from '@/i18n';
import type { OneTimeOffer } from '@/systems/purchases';
import type { RowView } from './shop-view-model';

/** What a one-time purchase (an ingredient, a room) shows in the shop besides its offer. */
export interface OneTimeLabels {
  name: string;
  description: string;
  /** The reputation level it is for sale from. */
  level: number;
  /** i18n key of the buy button, with `{cost}`. */
  buyKey: string;
}

const levelName = (level: number): string => t(textKey('reputation', REPUTATION_LEVELS[level - 1]?.id ?? '', 'name'));

/** Bought ones leave the shop: they are there for good, so listing them would only clutter it. */
export const isListed = (offer: OneTimeOffer): boolean => offer.status !== 'owned';

/** One row for a one-time purchase: locked until its level ("Unlocks at …"), then for sale with its price. */
export function toOneTimeRowView(labels: OneTimeLabels, offer: OneTimeOffer): RowView {
  return {
    name: labels.name,
    description: labels.description,
    level: offer.status === 'locked' ? t('shop.ingredient_locked', { level: levelName(labels.level) }) : '',
    buyLabel: t(labels.buyKey, { cost: formatNumber(offer.cost) }),
    canBuy: offer.affordable,
    maxed: false,
  };
}
