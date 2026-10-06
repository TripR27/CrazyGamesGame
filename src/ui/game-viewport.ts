import type { SideLayout } from './side-layout';

/**
 * Gives the canvas container the room a side panel leaves free, then tells the engine to fit again.
 * Returns a stop function.
 */
export function bindGameViewport(container: HTMLElement, side: SideLayout, refit: () => void): () => void {
  return side.subscribe(() => {
    container.style.right = `${side.width()}px`;
    refit();
  });
}
