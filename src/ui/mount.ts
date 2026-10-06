import { fitToViewport } from './fit-root';
import { mountHud, type HudSource } from './hud';

/** Builds the DOM overlay on top of the canvas. */
export function mountUi(root: HTMLElement, source: HudSource): void {
  fitToViewport(root);
  mountHud(root, source);
}
