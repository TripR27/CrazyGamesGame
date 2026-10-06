/** Design-pixel width of the shop column (the game itself is 1280 wide). */
export const SHOP_PANEL_WIDTH = 380;

/**
 * How much room a side panel takes next to the game, in design pixels. The game and the panel
 * together form one frame that is fitted into the window, so the panel is exactly as tall as the
 * game, scales with it, and never reaches into the empty bars of a window that is not 16:9.
 */
export interface SideLayout {
  /** Design-pixel width; 0 when no panel is open. */
  width(): number;
  setWidth(designPx: number): void;
  /** Called after every change of the width. Returns an unsubscribe function. */
  subscribe(listener: () => void): () => void;
}

export function createSideLayout(): SideLayout {
  let width = 0;
  const listeners = new Set<() => void>();
  return {
    width: () => width,
    setWidth(designPx) {
      if (designPx === width) return;
      width = designPx;
      for (const listener of [...listeners]) listener();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
