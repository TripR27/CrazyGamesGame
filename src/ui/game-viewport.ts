import { GAME_HEIGHT, GAME_WIDTH } from '@/config';
import type { Fit } from './fit-math';

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
