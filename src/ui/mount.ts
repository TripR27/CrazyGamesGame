import type { TargetRegistry } from '@/core/target-registry';
import { fitToViewport } from './fit-root';
import { mountHud, type HudSource } from './hud';
import { mountTutorial, type TutorialUiSource } from './tutorial/tutorial-view';

export interface UiServices {
  source: HudSource;
  tutorial: TutorialUiSource;
  targets: TargetRegistry;
}

/** Builds the DOM overlay on top of the canvas. */
export function mountUi(root: HTMLElement, { source, tutorial, targets }: UiServices): void {
  fitToViewport(root);
  mountHud(root, source, targets);
  mountTutorial(root, tutorial, targets);
}
