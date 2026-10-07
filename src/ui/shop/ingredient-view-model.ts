import type { IngredientDef } from '@/data/ingredients/types';
import { textKey } from '@/data/text-key';
import { t } from '@/i18n/index';
import { ingredientOffer, type IngredientCatalog, type IngredientShopState } from '@/systems/ingredients/offer';
import { isListed as listedOffer, toOneTimeRowView } from '@/ui/shop/one-time-view-model';
import type { RowView } from '@/ui/shop/shop-view-model';

/** A bought ingredient leaves the shop (see `isListed` in one-time-view-model.ts). */
export const isListed = (def: IngredientDef, state: IngredientShopState, catalog: IngredientCatalog): boolean =>
  listedOffer(ingredientOffer(state, def, catalog));

/** One ingredient in the shop: locked until its level, then for sale once. */
export function toIngredientRowView(def: IngredientDef, state: IngredientShopState, catalog: IngredientCatalog): RowView {
  const labels = {
    name: t(textKey('ingredients', def.id, 'name')),
    description: t('shop.ingredient_text'),
    level: def.buy?.level ?? 1,
    buyKey: 'shop.buy_once',
  };
  return toOneTimeRowView(labels, ingredientOffer(state, def, catalog));
}
