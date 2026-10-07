import { upgrades } from '@/data/upgrades/index';
import { t } from '@/i18n/index';
import type { Listener } from '@/shared/state';
import type { TargetRegistry } from '@/shared/targets';
import type { PlayerActions } from '@/systems/actions/player-actions';
import type { UpgradeState } from '@/systems/upgrades/buy';
import type { BuyAmount } from '@/systems/upgrades/quote';
import { createEl } from '@/ui/dom';
import { mountOneTimeGroups, type OneTimeState } from '@/ui/shop/one-time-groups';
import { buildPanel, registerTargets } from '@/ui/shop/shop-panel';
import { toRowView } from '@/ui/shop/shop-view-model';
import { createUpgradeRow } from '@/ui/shop/upgrade-row';
import type { SidePanels } from '@/ui/side-panels';
import './shop.css';

type ShopState = UpgradeState & OneTimeState;

export interface ShopSource {
  getState(): ShopState;
  subscribe(listener: Listener<ShopState>): () => void;
}

export interface ShopHosts {
  /** The scaled overlay box, to measure tutorial targets against. */
  root: HTMLElement;
  panels: SidePanels;
}

/** The Shop tab of the side panel: ingredients and rooms for sale, then one row per upgrade. Returns an unmount function. */
export function mountShop(
  { root, panels }: ShopHosts,
  source: ShopSource,
  actions: Pick<PlayerActions, 'buyUpgrade' | 'buyIngredient' | 'buildRoom' | 'openShop' | 'closeShop'>,
  targets: TargetRegistry,
): () => void {
  let amount: BuyAmount = 1;
  const { panel, list, picker } = buildPanel((picked) => {
    amount = picked;
    render();
  });

  const renderOneTime = mountOneTimeGroups({ list, root, panel, actions, targets });
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
    renderOneTime(source.getState());
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
