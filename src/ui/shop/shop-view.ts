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
  /** The scaled game box: the Shop button lives here, in the corner of the game view. */
  root: HTMLElement;
  /** Outside the game box: the panel is a column next to the game view and shrinks the game view. */
  side: HTMLElement;
  layout: SideLayout;
}

/** Shop button plus a side panel with one row per upgrade. Returns an unmount function. */
export function mountShop(
  { root, side, layout }: ShopHosts,
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
  root.append(button);
  side.append(panel);

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
  const stopToggle = bindPanelToggle(button, panel, layout, actions.openShop);
  const unsubscribe = source.subscribe(render);
  render();

  return () => {
    unsubscribe();
    unregister();
    stopToggle();
    button.remove();
    panel.remove();
  };
}
