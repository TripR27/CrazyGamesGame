/**
 * How much of the window a side panel (the shop) takes from the right. The game view, the HUD and the
 * tutorial overlay fit into what is left, so the game stays playable while a panel is open.
 */
export interface SideLayout {
  /** Width in screen pixels; 0 when no panel is open. */
  width(): number;
  setWidth(px: number): void;
  /** Called after every change of the width. Returns an unsubscribe function. */
  subscribe(listener: () => void): () => void;
}

export function createSideLayout(): SideLayout {
  let width = 0;
  const listeners = new Set<() => void>();
  return {
    width: () => width,
    setWidth(px) {
      if (px === width) return;
      width = px;
      for (const listener of [...listeners]) listener();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/** The panel is a fixed width, but never more than a third of a small window. */
export function sidePanelWidth(viewportWidth: number): number {
  return Math.round(Math.min(360, viewportWidth * 0.33));
}
