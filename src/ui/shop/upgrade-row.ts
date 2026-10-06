import { createEl } from '@/ui/dom';
import type { RowView } from './shop-view-model';

export interface UpgradeRow {
  el: HTMLElement;
  /** The buy button; the tutorial points at it. */
  buy: HTMLButtonElement;
  update(view: RowView): void;
}

/** One line in the shop: name, level, description and a buy button. Only text and flags change after creation. */
export function createUpgradeRow(onBuy: () => void): UpgradeRow {
  const el = createEl('div', 'shop-row');
  const name = createEl('span', 'shop-row-name');
  const level = createEl('span', 'shop-row-level');
  const description = createEl('p', 'shop-row-text');
  const buy = createEl('button', 'shop-buy');
  const head = createEl('div', 'shop-row-head');
  head.append(name, level);
  const info = createEl('div', 'shop-row-info');
  info.append(head, description);
  el.append(info, buy);
  buy.addEventListener('click', onBuy);

  return {
    el,
    buy,
    update(view) {
      name.textContent = view.name;
      level.textContent = view.level;
      description.textContent = view.description;
      buy.textContent = view.buyLabel;
      buy.disabled = !view.canBuy;
      el.classList.toggle('shop-row--maxed', view.maxed);
    },
  };
}
