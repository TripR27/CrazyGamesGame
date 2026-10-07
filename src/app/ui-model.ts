import { t } from '@/i18n/translator';
import { levelProgress } from '@/reputation/reputation';
import { textKey } from '@/shared/content';
import { formatNumber, num } from '@/shared/numbers';
import type { GameState } from '@/shared/state';

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

export interface Fit {
  scale: number;
  left: number;
  top: number;
}

/** Same rule as Phaser's Scale.FIT with centring: largest uniform scale that fits, centred. */
export function computeFit(viewW: number, viewH: number, designW: number, designH: number): Fit {
  const scale = Math.min(viewW / designW, viewH / designH);
  return {
    scale,
    left: (viewW - designW * scale) / 2,
    top: (viewH - designH * scale) / 2,
  };
}

/** The slice of the state the HUD needs (interface segregation). */
export type HudState = Pick<GameState, 'currencies' | 'reputation'>;

export interface HudView {
  gold: string;
  reputation: string;
  /** Name of the reputation level. */
  level: string;
  /** How far towards the next level, 0 to 1 (full at the top level). */
  levelFraction: number;
}

export function toHudView(state: HudState): HudView {
  const progress = levelProgress(state.reputation);
  return {
    gold: formatNumber(state.currencies.gold),
    reputation: formatNumber(num(Math.floor(state.reputation))),
    level: t(textKey('reputation', progress.current.id, 'name')),
    levelFraction: progress.fraction,
  };
}
