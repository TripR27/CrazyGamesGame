import type { Listener } from '@/core/store';
import type { TargetRegistry } from '@/core/target-registry';
import { upgrades } from '@/data/upgrades';
import { t } from '@/i18n';
import type { PlayerActions } from '@/systems/actions';
import type { BuyAmount, UpgradeState } from '@/systems/upgrades';
import { createEl } from '@/ui/dom';
import type { SidePanels } from '@/ui/side-panels';
import { buildPanel, registerTargets } from './shop-panel';
import { toRowView } from './shop-view-model';
import { createUpgradeRow } from './upgrade-row';
import './shop.css';

export interface ShopSource {
  getState(): UpgradeState;
  subscribe(listener: Listener<UpgradeState>): () => void;
}

export interface ShopHosts {
  /** The scaled overlay box, to measure tutorial targets against. */
  root: HTMLElement;
  panels: SidePanels;
}

/** The Shop tab of the side panel: one row per upgrade. Returns an unmount function. */
export function mountShop(
  { root, panels }: ShopHosts,
  source: ShopSource,
  actions: Pick<PlayerActions, 'buyUpgrade' | 'openShop' | 'closeShop'>,
  targets: TargetRegistry,
): () => void {
  let amount: BuyAmount = 1;
  const { panel, list, picker } = buildPanel((picked) => {
    amount = picked;
    render();
  });

  let kind = '';
  const rows = upgrades.map((def) => {
    const row = createUpgradeRow(() => actions.buyUpgrade(def.id, amount));
    // A small heading above the first upgrade of each kind (the list is ordered by kind).
    if (def.kind !== kind) list.append(createEl('h3', 'shop-kind', t(`shop.kind_${def.kind}`)));
    kind = def.kind;
    list.append(row.el);
    return { def, row };
  });
  const unregister = registerTargets(targets, { root, panel, rows });

  function render(): void {
    picker.select(amount);
    for (const { def, row } of rows) row.update(toRowView(def, source.getState(), amount));
  }
  panels.add({ id: 'shop', labelKey: 'shop.tab', content: panel, onOpen: actions.openShop, onClose: actions.closeShop });
  const unsubscribe = source.subscribe(render);
  render();

  return () => {
    unsubscribe();
    unregister();
    panel.remove();
  };
}
