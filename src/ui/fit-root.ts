import { GAME_HEIGHT, GAME_WIDTH } from '@/config';
import { computeFit } from './fit-math';
import type { SideLayout } from './side-layout';

/**
 * Makes the overlay a 1280x720 design-space box that is scaled and centred like the canvas,
 * so HUD elements stay lined up with the scene. A side panel takes its width off the right.
 * Returns a stop function.
 */
export function fitToViewport(root: HTMLElement, side: SideLayout): () => void {
  root.style.width = `${GAME_WIDTH}px`;
  root.style.height = `${GAME_HEIGHT}px`;
  root.style.transformOrigin = '0 0';

  const apply = (): void => {
    const fit = computeFit(window.innerWidth - side.width(), window.innerHeight, GAME_WIDTH, GAME_HEIGHT);
    root.style.transform = `translate(${fit.left}px, ${fit.top}px) scale(${fit.scale})`;
  };
  apply();
  window.addEventListener('resize', apply);
  const unsubscribe = side.subscribe(apply);
  return () => {
    window.removeEventListener('resize', apply);
    unsubscribe();
  };
}
