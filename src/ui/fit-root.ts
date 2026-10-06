import { GAME_HEIGHT, GAME_WIDTH } from '@/config';
import { computeFit, type Fit } from './fit-math';
import type { SideLayout } from './side-layout';

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
