import type { Listener } from '@/core/store';
import type { TargetRegistry } from '@/core/target-registry';
import { upgrades } from '@/data/upgrades';
import { t } from '@/i18n';
import type { PlayerActions } from '@/systems/actions';
import type { BuyAmount, UpgradeState } from '@/systems/upgrades';
import { createEl } from '@/ui/dom';
import type { SideLayout } from '@/ui/side-layout';
import { bindPanelToggle } from './panel-toggle';
import { buildPanel, registerTargets } from './shop-panel';
import { toRowView } from './shop-view-model';
import { createUpgradeRow } from './upgrade-row';
import './shop.css';

export interface ShopSource {
  getState(): UpgradeState;
  subscribe(listener: Listener<UpgradeState>): () => void;
}

export interface ShopHosts {
  /** The scaled overlay box: the Shop button sits in the corner of the game, the panel just to its right. */
  root: HTMLElement;
  layout: SideLayout;
}

/** Shop button plus a side panel with one row per upgrade. Returns an unmount function. */
export function mountShop(
  { root, layout }: ShopHosts,
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
  const unregister = registerTargets(targets, { root, button, panel, rows });

  function render(): void {
    picker.select(amount);
    for (const { def, row } of rows) row.update(toRowView(def, source.getState(), amount));
  }
  bindPanelToggle(button, panel, layout, actions.openShop);
  const unsubscribe = source.subscribe(render);
  render();

  return () => {
    unsubscribe();
    unregister();
    button.remove();
    panel.remove();
  };
}
