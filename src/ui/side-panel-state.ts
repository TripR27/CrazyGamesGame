/** Which tab stopped and which started being on screen because of a click; empty when nothing changed. */
export interface PanelChange {
  closed?: string;
  opened?: string;
}

/**
 * The side panel as pure state: folded away or unfolded, and the tab it shows. It unfolds on the last tab that
 * was used (the first tab until the player picks another). No DOM, so it can be tested.
 */
export interface PanelState {
  isOpen(): boolean;
  /** The tab shown while unfolded, and shown again next time; null until a tab is added. */
  active(): string | null;
  addTab(id: string): void;
  /** The one button: unfold on the last tab, or fold away. */
  toggle(): PanelChange;
  /** Show this tab (unfolding the panel if needed). */
  select(id: string): PanelChange;
}

export function createPanelState(): PanelState {
  let open = false;
  let active: string | null = null;
  return {
    isOpen: () => open,
    active: () => active,
    addTab(id) {
      active ??= id;
    },
    toggle() {
      if (active === null) return {};
      open = !open;
      return open ? { opened: active } : { closed: active };
    },
    select(id) {
      if (open && active === id) return {};
      const closed = open && active !== null ? active : undefined;
      open = true;
      active = id;
      return closed === undefined ? { opened: id } : { closed, opened: id };
    },
  };
}
