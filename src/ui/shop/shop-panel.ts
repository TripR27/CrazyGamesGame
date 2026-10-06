import type { TargetRegistry } from '@/core/target-registry';
import { t } from '@/i18n';
import type { BuyAmount } from '@/systems/upgrades';
import { createEl } from '@/ui/dom';
import { domBounds } from '@/ui/dom-bounds';
import { createAmountPicker } from './amount-picker';
import type { UpgradeRow } from './upgrade-row';

export function buildPanel(onPick: (amount: BuyAmount) => void) {
  const panel = createEl('div', 'shop-panel');
  const list = createEl('div', 'shop-list');
  const picker = createAmountPicker(onPick);
  const head = createEl('div', 'shop-head');
  head.append(createEl('h2', 'shop-title', t('shop.title')), picker.el);
  panel.append(head, list);
  return { panel, list, picker };
}

export interface TargetParts {
  /** The element whose bounds are measured against `root` (the panel sits outside the scaled game box). */
  root: HTMLElement;
  panel: HTMLElement;
  rows: Array<{ def: { id: string }; row: UpgradeRow }>;
}

/** Each buy button (while the shop tab is on screen) is something the tutorial can point at. */
export function registerTargets(targets: TargetRegistry, { root, panel, rows }: TargetParts): () => void {
  const removers = rows.map(({ def, row }) =>
    targets.register(`upgrade:${def.id}`, () => (panel.hidden ? null : domBounds(row.buy, root))),
  );
  return () => removers.forEach((remove) => remove());
}
