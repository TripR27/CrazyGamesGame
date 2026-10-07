import { t } from '@/i18n/index';
import type { TargetRegistry } from '@/shared/targets';
import { createEl } from '@/ui/dom';
import { domBounds } from '@/ui/dom-bounds';
import type { RowView } from '@/ui/shop/shop-view-model';
import { createUpgradeRow } from '@/ui/shop/upgrade-row';

/** One thing sold once: how to show it right now, and whether it is still in the shop. */
export interface OneTimeEntry<S> {
  id: string;
  listed(state: S): boolean;
  view(state: S): RowView;
}

export interface OneTimeSectionParts<S> {
  list: HTMLElement;
  /** The overlay box and the shop panel, to measure and hide tutorial targets. */
  root: HTMLElement;
  panel: HTMLElement;
  headingKey: string;
  /** Tutorial target of each buy button: `<targetPrefix>:<id>`. */
  targetPrefix: string;
  entries: readonly OneTimeEntry<S>[];
  onBuy(id: string): void;
  targets: TargetRegistry;
}

/**
 * A group of one-time purchases in the shop (ingredients, rooms): one row per entry still for sale. Bought ones
 * leave the shop, and the heading goes when nothing is left. Returns the render function.
 */
export function mountOneTimeSection<S>(parts: OneTimeSectionParts<S>): (state: S) => void {
  const { list, root, panel, entries, onBuy, targets } = parts;
  const heading = createEl('h3', 'shop-kind', t(parts.headingKey));
  list.append(heading);
  const rows = entries.map((entry) => {
    const row = createUpgradeRow(() => onBuy(entry.id));
    list.append(row.el);
    targets.register(`${parts.targetPrefix}:${entry.id}`, () => (panel.hidden || row.el.hidden ? null : domBounds(row.buy, root)));
    return { entry, row };
  });
  return (state) => {
    for (const { entry, row } of rows) {
      row.el.hidden = !entry.listed(state);
      if (!row.el.hidden) row.update(entry.view(state));
    }
    heading.hidden = rows.every(({ row }) => row.el.hidden);
  };
}
