import type { World } from '@/app/world';
import { mountHud } from '@/app/hud-view';
import { createSidePanels } from '@/app/panels-view';
import { computeFit, type Fit, type SideLayout } from '@/app/ui-model';
import { GAME_HEIGHT, GAME_WIDTH } from '@/config';
import { mountShop } from '@/economy/shop-view';
import { mountHeroes } from '@/heroes/heroes-view';
import { mountWelcomeBack } from '@/offline/welcome-view';
import { mountRecipeBook } from '@/recipes/recipe-book-view';
import { mountLevelUpToast } from '@/reputation/level-up-view';
import { toLevelUpView } from '@/reputation/level-up-model';
import { mountTutorial } from '@/tutorial/tutorial-view';

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

/** Builds the DOM overlay on top of the canvas. */
export function mountUi(root: HTMLElement, world: World, layout: SideLayout, onFit: (fit: Fit) => void): void {
  fitToViewport(root, layout, onFit);
  mountHud(root, world.store, world.targets);
  const panels = createSidePanels(root, layout, world.targets);
  mountShop({ root, panels }, world);
  mountRecipeBook({ root, panels }, world);
  mountHeroes({ root, panels }, world);
  world.bus.on('shop:requested', () => panels.show('shop'));
  world.bus.on('heroes:requested', () => panels.show('heroes'));
  mountTutorial(root, world.tutorial, world.targets);
  mountLevelUpToast(root, (show) => world.bus.on('reputation:levelUp', ({ level }) => show(toLevelUpView(level, world.content.customerTypes))));
  mountWelcomeBack(root, world.offline.inbox);
}
