import { SHOP_PANEL_WIDTH, type SideLayout, createPanelState, type PanelChange } from '@/app/ui-model';
import { t } from '@/i18n/translator';
import type { Bounds, TargetRegistry } from '@/shared/targets';
import './panels.css';

export function createEl<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text = '',
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  el.className = className;
  el.textContent = text;
  return el;
}

/** Bounds of a DOM element in design pixels (undoing the overlay's scale), for the target registry. */
export function domBounds(el: HTMLElement, root: HTMLElement): Bounds {
  const box = el.getBoundingClientRect();
  const rootBox = root.getBoundingClientRect();
  const scale = rootBox.width / root.offsetWidth || 1;
  return {
    x: (box.left - rootBox.left) / scale,
    y: (box.top - rootBox.top) / scale,
    w: box.width / scale,
    h: box.height / scale,
  };
}

/** One tab of the side panel (shop, recipe book, later settings and heroes). */
export interface SideTab {
  id: string;
  /** i18n key of the tab's label. */
  labelKey: string;
  content: HTMLElement;
  /** The tab came on screen, or went off it (another tab, or the panel folded away). */
  onOpen(): void;
  onClose(): void;
}

export interface SidePanels {
  add(tab: SideTab): void;
  /** Unfold the panel on this tab (for example when the scene asks for the shop). */
  show(tabId: string): void;
}

interface Entry {
  tab: SideTab;
  button: HTMLElement;
}

function buildFrame(root: HTMLElement) {
  const toggle = createEl('button', 'side-button panel-button');
  const panel = createEl('div', 'side-panel');
  const bar = createEl('div', 'side-tabs');
  panel.append(bar);
  root.append(toggle, panel);
  return { toggle, panel, bar };
}

/**
 * One button in the corner of the game unfolds the side panel and folds it away again; tabs on top of the
 * panel switch between its parts. The layout gets the width, so the game shrinks next to the open panel.
 * The button (`panel-button`) and every tab (`tab:<id>`) are tutorial targets.
 */
export function createSidePanels(root: HTMLElement, layout: SideLayout, targets: TargetRegistry): SidePanels {
  const state = createPanelState();
  const entries: Entry[] = [];
  const { toggle, panel, bar } = buildFrame(root);
  targets.register('panel-button', () => domBounds(toggle, root));

  const render = (): void => {
    const open = state.isOpen();
    toggle.textContent = t(open ? 'panel.close' : 'panel.open');
    panel.hidden = !open;
    for (const { tab, button } of entries) {
      tab.content.hidden = !open || state.active() !== tab.id;
      button.classList.toggle('side-tab--on', state.active() === tab.id);
    }
    layout.setWidth(open ? SHOP_PANEL_WIDTH : 0);
  };
  const apply = ({ closed, opened }: PanelChange): void => {
    render();
    entries.find((e) => e.tab.id === closed)?.tab.onClose();
    entries.find((e) => e.tab.id === opened)?.tab.onOpen();
  };
  toggle.addEventListener('click', () => apply(state.toggle()));
  render();

  return {
    add(tab) {
      const button = createEl('button', 'side-tab', t(tab.labelKey));
      button.addEventListener('click', () => apply(state.select(tab.id)));
      tab.content.classList.add('side-tab-body');
      bar.append(button);
      panel.append(tab.content);
      entries.push({ tab, button });
      state.addTab(tab.id);
      targets.register(`tab:${tab.id}`, () => (panel.hidden ? null : domBounds(button, root)));
      render();
    },
    show: (tabId) => apply(state.select(tabId)),
  };
}
