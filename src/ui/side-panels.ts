import { t } from '@/i18n';
import { SHOP_PANEL_WIDTH, type SideLayout } from './side-layout';
import './side-panels.css';

/** One side panel and the button that opens and closes it. */
export interface SidePanel {
  button: HTMLElement;
  panel: HTMLElement;
  /** i18n keys for the button while the panel is closed and while it is open. */
  labels: { open: string; close: string };
  onOpen(): void;
  onClose(): void;
}

export interface SidePanels {
  add(entry: SidePanel): void;
}

/**
 * The side panels (shop, recipe book, later settings and heroes) share the room next to the game: opening one
 * closes the one that was open, so there is never more than one. The layout gets the width, so the game
 * shrinks next to the open panel.
 */
export function createSidePanels(layout: SideLayout): SidePanels {
  const entries: SidePanel[] = [];
  const close = (entry: SidePanel): void => {
    if (entry.panel.hidden) return;
    entry.panel.hidden = true;
    entry.button.textContent = t(entry.labels.open);
    entry.onClose();
  };
  const open = (entry: SidePanel): void => {
    entry.panel.hidden = false;
    entry.button.textContent = t(entry.labels.close);
    entry.onOpen();
  };
  return {
    add(entry) {
      entries.push(entry);
      entry.panel.hidden = true;
      entry.button.textContent = t(entry.labels.open);
      entry.button.addEventListener('click', () => {
        const opening = entry.panel.hidden;
        entries.forEach(close);
        if (opening) open(entry);
        layout.setWidth(opening ? SHOP_PANEL_WIDTH : 0);
      });
    },
  };
}
