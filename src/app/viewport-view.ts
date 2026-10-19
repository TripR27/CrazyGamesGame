import { toAchievementToast } from '@/achievements/achievements';
import { mountTrophies } from '@/achievements/achievements-view';
import type { World } from '@/app/world';
import { mountAudio } from '@/audio/audio-view';
import { mountDailyBonus } from '@/daily/daily-view';
import { mountHud } from '@/app/hud-view';
import { createSidePanels } from '@/app/panels-view';
import { computeFit, type Fit, minFontPx, type SideLayout } from '@/app/ui-model';
import { GAME_HEIGHT, GAME_WIDTH } from '@/config';
import { t } from '@/i18n/translator';
import { mountNewBadges, mountShop } from '@/economy/shop-view';
import { mountBossFight } from '@/heroes/boss-view';
import { mountTripCards } from '@/heroes/cards-view';
import { mountHeroes } from '@/heroes/heroes-view';
import { mountWelcomeBack } from '@/offline/welcome-view';
import { mountRewards } from '@/rewards/rewards-view';
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
    // Small windows (and an open side panel) shrink everything; text grows back to stay readable (CrazyGames rule).
    root.style.setProperty('--min-font', `${minFontPx(fit.scale)}px`);
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

const SHIELD_CHECK_MS = 100;

/**
 * A see-through cover over the whole frame while an ad is on its way or playing: CrazyGames does not let the player act
 * then (the game itself is paused by main.ts).
 */
function mountAdShield(root: HTMLElement, ads: Pick<Ads, 'busy'>): void {
  const shield = document.createElement('div');
  shield.className = 'ad-shield';
  shield.hidden = true;
  root.append(shield);
  window.setInterval(() => void (shield.hidden = !ads.busy()), SHIELD_CHECK_MS);
}

/**
 * The game is landscape: on a touch screen held upright the whole window says to turn it, instead of a thin strip of
 * tavern (Poki wants the game to fill the screen on phones). Gone again once the device is turned.
 */
function mountTurnNotice(): void {
  const notice = document.createElement('div');
  notice.className = 'turn-notice';
  notice.textContent = t('viewport.turn');
  document.body.append(notice);
  const touch = window.matchMedia('(pointer: coarse)');
  const apply = (): void => void (notice.hidden = !touch.matches || window.innerWidth >= window.innerHeight);
  apply();
  window.addEventListener('resize', apply);
}

/** What the overlay gets from main.ts besides the world: saves as text, ads, and the platform's mute and user name. */
export interface UiServices {
  saves: SaveCodes;
  ads: Pick<Ads, 'rewarded' | 'available' | 'busy' | 'rules'>;
  /** True while sound must be off for the platform: muted by the platform (CrazyGames), or an ad is playing. */
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
  mountShop({ root, panels, ads: services.ads }, world);
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
  mountRewards(root, world, services.ads);
  mountSettings(root, world, services);
  mountAudio(root, world, services.silenced);
  mountAdShield(root, services.ads);
  mountTurnNotice();
}
