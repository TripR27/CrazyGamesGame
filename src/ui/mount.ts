import type { TargetRegistry } from '@/shared/targets';
import type { PlayerActions } from '@/systems/actions/player-actions';
import type { OfflineInbox } from '@/systems/offline/inbox';
import type { Fit } from '@/ui/fit-math';
import { fitToViewport } from '@/ui/fit-root';
import { mountHud, type HudSource } from '@/ui/hud';
import { mountLevelUpToast } from '@/ui/level-up/level-up-toast';
import type { LevelUpView } from '@/ui/level-up/level-up-view-model';
import { mountRecipeBook, type BookSource } from '@/ui/recipe-book/book-view';
import { mountShop, type ShopSource } from '@/ui/shop/shop-view';
import type { SideLayout } from '@/ui/side-layout';
import { createSidePanels } from '@/ui/side-panels';
import { mountTutorial, type TutorialUiSource } from '@/ui/tutorial/tutorial-view';
import { mountWelcomeBack } from '@/ui/welcome/welcome-back';

export interface UiServices {
  source: HudSource & ShopSource & BookSource;
  actions: Pick<PlayerActions, 'buyUpgrade' | 'buyIngredient' | 'buildRoom' | 'openShop' | 'closeShop' | 'openBook' | 'closeBook'>;
  tutorial: TutorialUiSource;
  targets: TargetRegistry;
  /** How much room a side panel takes next to the game. */
  layout: SideLayout;
  /** Reports of what the staff earned while the player was away. */
  welcome: OfflineInbox;
  /** Told where the game part of the frame sits, so the canvas can follow. */
  onFit: (fit: Fit) => void;
  /** Subscribes to requests from the scene to open the shop (a boarded-up room was clicked). Returns an unsubscribe function. */
  onShopRequest: (open: () => void) => () => void;
  /** Subscribes to new reputation levels, already turned into a message. Returns an unsubscribe function. */
  onLevelUp: (show: (view: LevelUpView) => void) => () => void;
}

/** Builds the DOM overlay on top of the canvas. */
export function mountUi(root: HTMLElement, services: UiServices): void {
  const { source, actions, tutorial, targets, layout, welcome, onFit, onLevelUp, onShopRequest } = services;
  fitToViewport(root, layout, onFit);
  mountHud(root, source, targets);
  const panels = createSidePanels(root, layout, targets);
  mountShop({ root, panels }, source, actions, targets);
  mountRecipeBook({ root, panels }, source, actions, targets);
  onShopRequest(() => panels.show('shop'));
  mountTutorial(root, tutorial, targets);
  mountLevelUpToast(root, onLevelUp);
  mountWelcomeBack(root, welcome);
}
