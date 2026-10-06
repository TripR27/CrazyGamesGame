import { formatNumber } from '@/core/format';
import type { IngredientDef } from '@/data/ingredients';
import { REPUTATION_LEVELS } from '@/data/reputation/levels';
import { textKey } from '@/data/text-key';
import { t } from '@/i18n';
import { ingredientOffer, type IngredientCatalog, type IngredientShopState } from '@/systems/ingredients';
import type { RowView } from './shop-view-model';

const levelName = (level: number): string => t(textKey('reputation', REPUTATION_LEVELS[level - 1]?.id ?? '', 'name'));

/** A bought ingredient leaves the shop: it is on the shelf for good, so listing it would only clutter the shop. */
export const isListed = (def: IngredientDef, state: IngredientShopState, catalog: IngredientCatalog): boolean =>
  ingredientOffer(state, def, catalog).status !== 'owned';

/** One ingredient in the shop: locked until its level, then for sale once (see `isListed` for what happens after). */
export function toIngredientRowView(def: IngredientDef, state: IngredientShopState, catalog: IngredientCatalog): RowView {
  const offer = ingredientOffer(state, def, catalog);
  const owned = offer.status === 'owned';
  const status = {
    locked: t('shop.ingredient_locked', { level: levelName(def.buy?.level ?? 1) }),
    forSale: '',
    owned: t('shop.ingredient_owned'),
  }[offer.status];
  return {
    name: t(textKey('ingredients', def.id, 'name')),
    description: t('shop.ingredient_text'),
    level: status,
    buyLabel: owned ? t('shop.owned') : t('shop.buy_once', { cost: formatNumber(offer.cost) }),
    canBuy: offer.affordable,
    maxed: owned,
  };
}
