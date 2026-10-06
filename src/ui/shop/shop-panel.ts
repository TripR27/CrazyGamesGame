import type { TargetRegistry } from '@/core/target-registry';
import { t } from '@/i18n';
import type { BuyAmount } from '@/systems/upgrades';
import { createEl } from '@/ui/dom';
import { domBounds } from '@/ui/dom-bounds';
import { createAmountPicker } from './amount-picker';
import type { UpgradeRow } from './upgrade-row';

export function buildPanel(onPick: (amount: BuyAmount) => void) {
  const panel = createEl('div', 'shop-panel');
  panel.hidden = true;
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
  button: HTMLElement;
  panel: HTMLElement;
  rows: Array<{ def: { id: string }; row: UpgradeRow }>;
}

/** The shop button and each buy button (while the panel is open) are things the tutorial can point at. */
export function registerTargets(targets: TargetRegistry, { root, button, panel, rows }: TargetParts): () => void {
  const removers = [
    targets.register('shop-button', () => domBounds(button, root)),
    ...rows.map(({ def, row }) =>
      targets.register(`upgrade:${def.id}`, () => (panel.hidden ? null : domBounds(row.buy, root))),
    ),
  ];
  return () => removers.forEach((remove) => remove());
}
