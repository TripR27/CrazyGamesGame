import { ACHIEVEMENTS, statLines, toTrophyView, type TrophyView } from '@/achievements/achievements';
import type { World } from '@/app/world';
import { createEl, domBounds, type SidePanels } from '@/app/panels-view';
import { t } from '@/i18n/translator';
import './achievements.css';

/** While the tab is on screen the progress refreshes this often. */
const REFRESH_MS = 1000;

/** One trophy: a cup (or a lock), its name, what it asks with its bonus, and how far the player is. */
function trophyEl(view: TrophyView): HTMLElement {
  const el = createEl('div', view.reached ? 'trophy trophy--reached' : 'trophy');
  const head = createEl('div', 'trophy-head');
  head.append(createEl('strong', 'trophy-name', `${view.reached ? '🏆' : '🔒'} ${view.name}`), createEl('span', 'trophy-progress', view.progress));
  el.append(head, createEl('p', 'trophy-text', view.text));
  return el;
}

/**
 * The Trophies tab of the side panel: every achievement (reached or with its progress) and the lifetime statistics.
 * The list is only rebuilt when something in it changed. Its title is the tutorial target `trophies-panel`. Returns an unmount function.
 */
export function mountTrophies({ root, panels }: { root: HTMLElement; panels: SidePanels }, world: World): () => void {
  const { store, bus } = world;
  const panel = createEl('div', 'trophies-panel');
  const count = createEl('p', 'trophies-count');
  const list = createEl('div', 'trophies-list');
  const stats = createEl('ul', 'trophies-stats');
  const title = createEl('h2', 'trophies-title', t('trophies.title'));
  panel.append(title, count, list, createEl('h3', 'trophies-subtitle', t('trophies.stats_title')), stats);
  // The tutorial points at the top of the list.
  const stopTarget = world.targets.register('trophies-panel', () => (panel.hidden ? null : domBounds(title, root)));
  let shown = '';

  const render = (): void => {
    if (panel.hidden) return;
    const state = store.getState();
    const views = ACHIEVEMENTS.map((def) => toTrophyView(def, state));
    const lines = statLines(state);
    const key = views.map((v) => `${v.id}:${v.progress}:${v.reached}`).join('|') + lines.join('|');
    if (key === shown) return;
    shown = key;
    count.textContent = t('trophies.count', { reached: state.achievements.length, total: ACHIEVEMENTS.length });
    list.replaceChildren(...views.map(trophyEl));
    stats.replaceChildren(...lines.map((line) => createEl('li', 'trophies-stat', line)));
  };

  let timer: number | undefined;
  panels.add({
    id: 'trophies',
    labelKey: 'trophies.tab',
    content: panel,
    onOpen: () => {
      shown = '';
      render();
      timer = window.setInterval(render, REFRESH_MS);
      bus.emit('trophies:opened', {});
    },
    onClose: () => {
      window.clearInterval(timer);
      bus.emit('trophies:closed', {});
    },
  });
  return () => {
    window.clearInterval(timer);
    stopTarget();
    panel.remove();
  };
}
