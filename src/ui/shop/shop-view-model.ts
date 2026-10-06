import { formatNumber } from '@/core/format';
import { textKey } from '@/data/text-key';
import type { UpgradeDef, UpgradeEffect } from '@/data/upgrades';
import { t } from '@/i18n';
import { levelOf, quoteFor, type BuyAmount, type UpgradeState } from '@/systems/upgrades';

/** Everything one shop row shows, as plain strings and flags (so it is easy to test). */
export interface RowView {
  name: string;
  description: string;
  level: string;
  buyLabel: string;
  canBuy: boolean;
  maxed: boolean;
}

/** The effect of one level as the player reads it: "+10%" for factors, "+1" for added amounts. */
export function effectAmount(effect: UpgradeEffect): string {
  return effect.mode === 'multiply' ? `+${Math.round(effect.perLevel * 100)}%` : `+${effect.perLevel}`;
}

export function toRowView(def: UpgradeDef, state: UpgradeState, amount: BuyAmount): RowView {
  const level = levelOf(state.upgrades, def);
  const deal = quoteFor(state, def, amount);
  const maxed = deal.count === 0;
  return {
    name: t(textKey('upgrades', def.id, 'name')),
    description: t(textKey('upgrades', def.id, 'description'), { amount: effectAmount(def.effect) }),
    level: t(maxed ? 'shop.level_max' : 'shop.level', { level }),
    buyLabel: maxed ? t('shop.maxed') : `${t('shop.buy', { count: deal.count })} · ${formatNumber(deal.cost)}`,
    canBuy: deal.affordable,
    maxed,
  };
}
