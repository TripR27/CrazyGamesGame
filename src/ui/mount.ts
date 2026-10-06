import type { TargetRegistry } from '@/core/target-registry';
import type { PlayerActions } from '@/systems/actions';
import type { OfflineInbox } from '@/systems/offline';
import type { Fit } from './fit-math';
import { fitToViewport } from './fit-root';
import type { SideLayout } from './side-layout';
import { mountHud, type HudSource } from './hud';
import { mountShop, type ShopSource } from './shop/shop-view';
import { mountWelcomeBack } from './welcome/welcome-back';
import { mountTutorial, type TutorialUiSource } from './tutorial/tutorial-view';

export interface UiServices {
  source: HudSource & ShopSource;
  actions: Pick<PlayerActions, 'buyUpgrade' | 'openShop' | 'closeShop'>;
  tutorial: TutorialUiSource;
  targets: TargetRegistry;
  /** How much room a side panel takes next to the game. */
  layout: SideLayout;
  /** Reports of what the staff earned while the player was away. */
  welcome: OfflineInbox;
  /** Told where the game part of the frame sits, so the canvas can follow. */
  onFit: (fit: Fit) => void;
}

/** Builds the DOM overlay on top of the canvas. */
export function mountUi(root: HTMLElement, { source, actions, tutorial, targets, layout, welcome, onFit }: UiServices): void {
  fitToViewport(root, layout, onFit);
  mountHud(root, source, targets);
  mountShop({ root, layout }, source, actions, targets);
  mountTutorial(root, tutorial, targets);
  mountWelcomeBack(root, welcome);
}
