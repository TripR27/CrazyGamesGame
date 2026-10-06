import type { TargetRegistry } from '@/core/target-registry';
import type { PlayerActions } from '@/systems/actions';
import { fitToViewport } from './fit-root';
import { mountHud, type HudSource } from './hud';
import { mountShop, type ShopSource } from './shop/shop-view';
import { mountTutorial, type TutorialUiSource } from './tutorial/tutorial-view';

export interface UiServices {
  source: HudSource & ShopSource;
  actions: Pick<PlayerActions, 'buyUpgrade' | 'openShop'>;
  tutorial: TutorialUiSource;
  targets: TargetRegistry;
}

/** Builds the DOM overlay on top of the canvas. */
export function mountUi(root: HTMLElement, { source, actions, tutorial, targets }: UiServices): void {
  fitToViewport(root);
  mountHud(root, source, targets);
  mountShop(root, source, actions, targets);
  mountTutorial(root, tutorial, targets);
}
