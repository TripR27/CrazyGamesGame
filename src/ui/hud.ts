import type { Listener } from '@/core/store';
import { t } from '@/i18n';
import { createEl } from './dom';
import { toHudView, type HudState } from './hud-view';
import './hud.css';

export interface HudSource {
  getState(): HudState;
  subscribe(listener: Listener<HudState>): () => void;
}

function createItem(modifier: string, labelKey: string): { item: HTMLElement; value: HTMLElement } {
  const item = createEl('div', `hud-item hud-item--${modifier}`);
  const value = createEl('span', 'hud-value');
  item.append(createEl('span', 'hud-label', t(labelKey)), value);
  return { item, value };
}

/** Empty HUD for now: gold and reputation, kept in sync with the store. Returns an unmount function. */
export function mountHud(root: HTMLElement, source: HudSource): () => void {
  const hud = createEl('div', 'hud');
  const gold = createItem('gold', 'hud.gold');
  const reputation = createItem('reputation', 'hud.reputation');
  hud.append(gold.item, reputation.item);
  root.append(hud);

  const render = (state: HudState): void => {
    const view = toHudView(state);
    gold.value.textContent = view.gold;
    reputation.value.textContent = view.reputation;
  };
  render(source.getState());
  const unsubscribe = source.subscribe(render);

  return () => {
    unsubscribe();
    hud.remove();
  };
}
