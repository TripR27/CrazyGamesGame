import { t } from '@/i18n/index';
import type { Listener } from '@/shared/state';
import type { TargetRegistry } from '@/shared/targets';
import { createEl } from '@/ui/dom';
import { domBounds } from '@/ui/dom-bounds';
import { toHudView, type HudState } from '@/ui/hud-view';
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

/** The reputation level under the reputation value: its name and a bar towards the next level. */
function createLevel(): { level: HTMLElement; name: HTMLElement; fill: HTMLElement } {
  const level = createEl('span', 'hud-level');
  const name = createEl('span', 'hud-level-name');
  const bar = createEl('span', 'hud-level-bar');
  const fill = createEl('span', 'hud-level-fill');
  bar.append(fill);
  level.append(name, bar);
  return { level, name, fill };
}

/** HUD: gold, reputation and the reputation level, kept in sync with the store. Returns an unmount function. */
export function mountHud(root: HTMLElement, source: HudSource, targets: TargetRegistry): () => void {
  const hud = createEl('div', 'hud');
  const gold = createItem('gold', 'hud.gold');
  const reputation = createItem('reputation', 'hud.reputation');
  const level = createLevel();
  reputation.item.append(level.level);
  hud.append(gold.item, reputation.item);
  root.append(hud);

  const render = (state: HudState): void => {
    const view = toHudView(state);
    gold.value.textContent = view.gold;
    reputation.value.textContent = view.reputation;
    level.name.textContent = view.level;
    level.fill.style.width = `${Math.round(view.levelFraction * 100)}%`;
  };
  render(source.getState());
  const unsubscribe = source.subscribe(render);
  const unregister = targets.register('hud-gold', () => domBounds(gold.item, root));

  return () => {
    unsubscribe();
    unregister();
    hud.remove();
  };
}
