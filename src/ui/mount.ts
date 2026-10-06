import type { TargetRegistry } from '@/core/target-registry';
import type { PlayerActions } from '@/systems/actions';
import { fitToViewport } from './fit-root';
import type { SideLayout } from './side-layout';
import { mountHud, type HudSource } from './hud';
import { mountShop, type ShopSource } from './shop/shop-view';
import { mountTutorial, type TutorialUiSource } from './tutorial/tutorial-view';

export interface UiServices {
  source: HudSource & ShopSource;
  actions: Pick<PlayerActions, 'buyUpgrade' | 'openShop'>;
  tutorial: TutorialUiSource;
  targets: TargetRegistry;
  /** Where side panels go (outside the scaled game box) and how much room they take. */
  side: HTMLElement;
  layout: SideLayout;
}

/** Builds the DOM overlay on top of the canvas. */
export function mountUi(root: HTMLElement, { source, actions, tutorial, targets, side, layout }: UiServices): void {
  fitToViewport(root, layout);
  mountHud(root, source, targets);
  mountShop({ root, side, layout }, source, actions, targets);
  mountTutorial(root, tutorial, targets);
}
