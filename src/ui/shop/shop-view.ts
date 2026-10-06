import type { Listener } from '@/core/store';
import type { TargetRegistry } from '@/core/target-registry';
import { upgrades } from '@/data/upgrades';
import { t } from '@/i18n';
import type { PlayerActions } from '@/systems/actions';
import type { BuyAmount, UpgradeState } from '@/systems/upgrades';
import { createEl } from '@/ui/dom';
import { domBounds } from '@/ui/dom-bounds';
import { toRowView } from './shop-view-model';
import { createAmountPicker } from './amount-picker';
import { createUpgradeRow, type UpgradeRow } from './upgrade-row';
import './shop.css';

export interface ShopSource {
  getState(): UpgradeState;
  subscribe(listener: Listener<UpgradeState>): () => void;
}

function buildPanel(onPick: (amount: BuyAmount) => void) {
  const panel = createEl('div', 'shop-panel');
  panel.hidden = true;
  const list = createEl('div', 'shop-list');
  const picker = createAmountPicker(onPick);
  const head = createEl('div', 'shop-head');
  head.append(createEl('h2', 'shop-title', t('shop.title')), picker.el);
  panel.append(head, list);
  return { panel, list, picker };
}

interface Parts {
  button: HTMLElement;
  panel: HTMLElement;
  rows: Array<{ def: { id: string }; row: UpgradeRow }>;
}

/** The shop button and each buy button (while the panel is open) are things the tutorial can point at. */
function registerTargets(root: HTMLElement, targets: TargetRegistry, { button, panel, rows }: Parts): () => void {
  const removers = [
    targets.register('shop-button', () => domBounds(button, root)),
    ...rows.map(({ def, row }) =>
      targets.register(`upgrade:${def.id}`, () => (panel.hidden ? null : domBounds(row.buy, root))),
    ),
  ];
  return () => removers.forEach((remove) => remove());
}

/** Shop button plus a panel with one row per upgrade. Returns an unmount function. */
export function mountShop(
  root: HTMLElement,
  source: ShopSource,
  actions: Pick<PlayerActions, 'buyUpgrade' | 'openShop'>,
  targets: TargetRegistry,
): () => void {
  let amount: BuyAmount = 1;
  const button = createEl('button', 'shop-button', t('shop.button'));
  const { panel, list, picker } = buildPanel((picked) => {
    amount = picked;
    render();
  });
  root.append(button, panel);

  const rows = upgrades.map((def) => {
    const row = createUpgradeRow(() => actions.buyUpgrade(def.id, amount));
    list.append(row.el);
    return { def, row };
  });
  const unregister = registerTargets(root, targets, { button, panel, rows });

  function render(): void {
    picker.select(amount);
    for (const { def, row } of rows) row.update(toRowView(def, source.getState(), amount));
  }
  button.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    button.textContent = t(panel.hidden ? 'shop.button' : 'shop.close');
    if (!panel.hidden) actions.openShop();
  });
  const unsubscribe = source.subscribe(render);
  render();

  return () => {
    unsubscribe();
    unregister();
    button.remove();
    panel.remove();
  };
}
