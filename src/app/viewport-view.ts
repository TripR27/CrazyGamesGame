import type { PlayerActions } from '@/app/actions';
import { mountHud, type HudSource } from '@/app/hud-view';
import { createSidePanels } from '@/app/panels-view';
import { computeFit, type Fit, type SideLayout } from '@/app/ui-model';
import { GAME_HEIGHT, GAME_WIDTH } from '@/config';
import { mountShop, type ShopSource } from '@/economy/shop-view';
import type { OfflineInbox } from '@/offline/offline';
import { mountWelcomeBack } from '@/offline/welcome-view';
import { mountRecipeBook, type BookSource } from '@/recipes/recipe-book-view';
import { mountLevelUpToast } from '@/reputation/level-up-view';
import type { LevelUpView } from '@/reputation/reputation';
import type { TargetRegistry } from '@/shared/targets';
import { mountTutorial, type TutorialUiSource } from '@/tutorial/tutorial-view';

/**
 * Makes the overlay a design-space box that is scaled and centred like the canvas, so HUD elements stay
 * lined up with the scene. The box is the game (1280x720) plus any side panel to its right, fitted into
 * the window as one frame. `onFit` gets the result so the canvas can take the game's part of it.
 * Returns a stop function.
 */
export function fitToViewport(root: HTMLElement, side: SideLayout, onFit: (fit: Fit) => void): () => void {
  root.style.height = `${GAME_HEIGHT}px`;
  root.style.transformOrigin = '0 0';

  const apply = (): void => {
    const width = GAME_WIDTH + side.width();
    root.style.width = `${width}px`;
    // Things anchored to the right edge of the game (the Shop button) must stay clear of the panel.
    root.style.setProperty('--side-w', `${side.width()}px`);
    const fit = computeFit(window.innerWidth, window.innerHeight, width, GAME_HEIGHT);
    root.style.transform = `translate(${fit.left}px, ${fit.top}px) scale(${fit.scale})`;
    onFit(fit);
  };
  apply();
  window.addEventListener('resize', apply);
  const unsubscribe = side.subscribe(apply);
  return () => {
    window.removeEventListener('resize', apply);
    unsubscribe();
  };
}

/**
 * Puts the canvas container exactly where the game part of the frame is, then lets the engine fit again.
 * The engine only re-reads the size of its container on a window resize, so `refit` has to ask for it.
 */
export function placeGame(container: HTMLElement, fit: Fit, refit: () => void): void {
  Object.assign(container.style, {
    left: `${fit.left}px`,
    top: `${fit.top}px`,
    width: `${GAME_WIDTH * fit.scale}px`,
    height: `${GAME_HEIGHT * fit.scale}px`,
  });
  refit();
}

export interface UiServices {
  source: HudSource & ShopSource & BookSource;
  actions: Pick<PlayerActions, 'buyUpgrade' | 'buyIngredient' | 'buildRoom' | 'openShop' | 'closeShop' | 'openBook' | 'closeBook'>;
  tutorial: TutorialUiSource;
  targets: TargetRegistry;
  /** How much room a side panel takes next to the game. */
  layout: SideLayout;
  /** Reports of what the staff earned while the player was away. */
  welcome: OfflineInbox;
  /** Told where the game part of the frame sits, so the canvas can follow. */
  onFit: (fit: Fit) => void;
  /** Subscribes to requests from the scene to open the shop (a boarded-up room was clicked). Returns an unsubscribe function. */
  onShopRequest: (open: () => void) => () => void;
  /** Subscribes to new reputation levels, already turned into a message. Returns an unsubscribe function. */
  onLevelUp: (show: (view: LevelUpView) => void) => () => void;
}

/** Builds the DOM overlay on top of the canvas. */
export function mountUi(root: HTMLElement, services: UiServices): void {
  const { source, actions, tutorial, targets, layout, welcome, onFit, onLevelUp, onShopRequest } = services;
  fitToViewport(root, layout, onFit);
  mountHud(root, source, targets);
  const panels = createSidePanels(root, layout, targets);
  mountShop({ root, panels }, source, actions, targets);
  mountRecipeBook({ root, panels }, source, actions, targets);
  onShopRequest(() => panels.show('shop'));
  mountTutorial(root, tutorial, targets);
  mountLevelUpToast(root, onLevelUp);
  mountWelcomeBack(root, welcome);
}
