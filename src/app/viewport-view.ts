import { toAchievementToast } from '@/achievements/achievements';
import { mountTrophies } from '@/achievements/achievements-view';
import type { World } from '@/app/world';
import { mountAudio } from '@/audio/audio-view';
import { mountDailyBonus } from '@/daily/daily-view';
import { mountHud } from '@/app/hud-view';
import { createSidePanels } from '@/app/panels-view';
import { computeFit, type Fit, type SideLayout } from '@/app/ui-model';
import { GAME_HEIGHT, GAME_WIDTH } from '@/config';
import { mountNewBadges, mountShop } from '@/economy/shop-view';
import { mountBossFight } from '@/heroes/boss-view';
import { mountTripCards } from '@/heroes/cards-view';
import { mountHeroes } from '@/heroes/heroes-view';
import { mountWelcomeBack } from '@/offline/welcome-view';
import type { Ads } from '@/platform/platform';
import { mountSettings, type SaveCodes } from '@/settings/settings-view';
import { mountLegacy } from '@/prestige/prestige-view';
import { mountRecipeBook } from '@/recipes/recipe-book-view';
import { mountLevelUpToast } from '@/reputation/level-up-view';
import { toLevelUpView } from '@/reputation/level-up-model';
import { mountTutorial } from '@/tutorial/tutorial-view';
import { installPixelCss, installPixelIcons } from '@/app/pixel-dom-view';

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

/** What the overlay gets from main.ts besides the world: saves as text, ads, and the platform's mute and user name. */
export interface UiServices {
  saves: SaveCodes;
  ads: Pick<Ads, 'rewarded'>;
  /** True while sound must be off for the platform: muted by CrazyGames, or an ad is playing. */
  silenced(): boolean;
  username(): Promise<string | null>;
}

/** Builds the DOM overlay on top of the canvas. */
export function mountUi(root: HTMLElement, world: World, layout: SideLayout, onFit: (fit: Fit) => void, services: UiServices): void {
  installPixelCss();
  installPixelIcons(root);
  fitToViewport(root, layout, onFit);
  mountHud(root, world.store, world.targets);
  const panels = createSidePanels(root, layout, world.targets);
  mountShop({ root, panels }, world);
  mountRecipeBook({ root, panels }, world);
  mountHeroes({ root, panels }, world);
  mountLegacy({ root, panels }, world);
  mountTrophies({ root, panels }, world);
  mountNewBadges(panels, world);
  world.bus.on('shop:requested', () => panels.show('shop'));
  world.bus.on('heroes:requested', () => panels.show('heroes'));
  mountTripCards(root, world);
  mountBossFight(root, world);
  mountTutorial(root, world.tutorial, world.targets);
  // A new reputation level and a new achievement share the toast at the top of the game.
  mountLevelUpToast(root, (show) => {
    const stopLevels = world.bus.on('reputation:levelUp', ({ level }) => show(toLevelUpView(level, world.content.customerTypes)));
    const stopTrophies = world.bus.on('achievement:unlocked', ({ id }) => show(toAchievementToast(id)));
    return () => {
      stopLevels();
      stopTrophies();
    };
  });
  mountWelcomeBack(root, world, services.ads);
  mountDailyBonus(root, world);
  mountSettings(root, world, services);
  mountAudio(root, world, services.silenced);
}
