import type { TargetRegistry } from '@/core/target-registry';
import { t } from '@/i18n';
import { shopIngredients, type IngredientCatalog, type IngredientShopState } from '@/systems/ingredients';
import { createEl } from '@/ui/dom';
import { domBounds } from '@/ui/dom-bounds';
import { isListed, toIngredientRowView } from './ingredient-view-model';
import { createUpgradeRow } from './upgrade-row';

export interface IngredientSectionParts {
  list: HTMLElement;
  /** The overlay box and the shop panel, to measure and hide tutorial targets. */
  root: HTMLElement;
  panel: HTMLElement;
  catalog: IngredientCatalog;
  onBuy(ingredientId: string): void;
  targets: TargetRegistry;
}

/**
 * The "Ingredients" group at the top of the shop: one row per ingredient that is still for sale (bought ones leave
 * the shop, and the heading goes when nothing is left). Each buy button is a tutorial target (`ingredient-buy:<id>`).
 * Returns the render function.
 */
export function mountIngredientSection(parts: IngredientSectionParts): (state: IngredientShopState) => void {
  const { list, root, panel, catalog, onBuy, targets } = parts;
  const defs = shopIngredients(catalog);
  const heading = createEl('h3', 'shop-kind', t('shop.kind_ingredients'));
  list.append(heading);
  const rows = defs.map((def) => {
    const row = createUpgradeRow(() => onBuy(def.id));
    list.append(row.el);
    targets.register(`ingredient-buy:${def.id}`, () => (panel.hidden || row.el.hidden ? null : domBounds(row.buy, root)));
    return { def, row };
  });
  return (state) => {
    for (const { def, row } of rows) {
      row.el.hidden = !isListed(def, state, catalog);
      if (!row.el.hidden) row.update(toIngredientRowView(def, state, catalog));
    }
    heading.hidden = rows.every(({ row }) => row.el.hidden);
  };
}
