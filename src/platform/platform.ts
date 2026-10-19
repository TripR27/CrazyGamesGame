import type { World } from '@/app/world';
import { currentBoss } from '@/heroes/boss-fight';
import { currentCard } from '@/heroes/trip-cards';
import type { StorageAdapter } from '@/shared/save';
import { debug } from '@/shared/events';
import type { Clock } from '@/shared/time';

export type AdType = 'midgame' | 'rewarded';
/**
 * `finished`: the ad played to the end (a rewarded ad then pays out); `failed`: no ad this time (unfilled, cooldown, an
 * error); `unavailable`: no ads at all in this session (an ad blocker, or ads are off during a Basic Launch).
 */
export type AdResult = 'finished' | 'failed' | 'unavailable';

/** How ads go on a platform: its rules as data, so the game asks no questions about which platform it is on. */
export interface AdRules {
  /** Least time between two midgame ads (a rewarded ad counts too); 0 when the platform sets the pace itself. */
  gapMs: number;
  /** No midgame ad in a new game's first minutes; 0 when the platform decides that itself. */
  newPlayerMs: number;
  /** A menu (the side panel, the settings) stops gameplay, and coming back from it is a moment for a midgame ad. */
  menuBreaks: boolean;
  /** Say why the rewarded offers are gone when ads are off for the session (a notice, never a popup). */
  explainOff: boolean;
}

/**
 * CrazyGames asks for at least 3 minutes between midgame ads (we keep 4), forbids midgame ads after menu and shop
 * buttons, and wants a feature that an ad blocker switched off to say why. No midgame ad in a new game's first minutes.
 */
export const CRAZYGAMES_ADS: AdRules = { gapMs: 240_000, newPlayerMs: 300_000, menuBreaks: false, explainOff: true };

/** After a new level the midgame ad waits until its message is gone (on every platform). */
export const ADS = { afterLevelMs: 5_000 } as const;

/**
 * The game's platform (one of the real seams, like time and storage): CrazyGames or Poki through their SDK, or a
 * stand-in when there is no SDK (tests, the simulator, development without internet). Only `platform/crazygames.ts`
 * and `platform/poki.ts` touch an SDK.
 */
export interface Platform {
  /** 'crazygames', 'local' (the CrazyGames SDK's test mode on localhost), 'poki' or 'none' (the stand-in). */
  environment: string;
  /** The platform's rules for ads. */
  adRules: AdRules;
  /** Where saves go on CrazyGames (the data module, synced with the account); null means localStorage. */
  storage: StorageAdapter | null;
  loadingStart(): void;
  loadingStop(): void;
  gameplayStart(): void;
  gameplayStop(): void;
  /** For the great moments only (a big achievement). */
  happytime(): void;
  /** Plays an ad. `onStart` runs when it really starts: pause and mute then. */
  requestAd(type: AdType, onStart: () => void): Promise<AdResult>;
  /** An ad blocker is there (the SDK's guess, not foolproof). */
  hasAdblock(): Promise<boolean>;
  /** The platform muted the game; its setting goes before the game's own (read when a sound plays). */
  muted(): boolean;
  /** The CrazyGames user name, or null (not signed in, or no platform). */
  username(): Promise<string | null>;
}

/** The stand-in without an SDK: it logs, and an ad "plays" at once to the end, so the flows can be tried locally. */
export function createMockPlatform(): Platform {
  return {
    environment: 'none',
    adRules: CRAZYGAMES_ADS,
    storage: null,
    loadingStart: () => debug('platform: loadingStart'),
    loadingStop: () => debug('platform: loadingStop'),
    gameplayStart: () => debug('platform: gameplayStart'),
    gameplayStop: () => debug('platform: gameplayStop'),
    happytime: () => debug('platform: happytime'),
    requestAd: (type, onStart) => {
      debug('platform: ad', type);
      onStart();
      return Promise.resolve('finished');
    },
    hasAdblock: () => Promise.resolve(false),
    muted: () => false,
    username: () => Promise.resolve(null),
  };
}

/**
 * Tells the platform when the player really plays: gameplay stops for every reason to pause (the tab is hidden, an ad
 * plays, still loading: `startPaused`) and starts again once none is left. Only changes are passed on.
 */
export function createGameplay(
  platform: Pick<Platform, 'gameplayStart' | 'gameplayStop'>,
  startPaused: readonly string[] = [],
): { pause(reason: string, on: boolean): void } {
  const reasons = new Set<string>(startPaused);
  let playing = false;
  const sync = (): void => {
    const should = reasons.size === 0;
    if (should === playing) return;
    playing = should;
    if (playing) platform.gameplayStart();
    else platform.gameplayStop();
  };
  sync();
  return {
    pause(reason, on) {
      if (on) reasons.add(reason);
      else reasons.delete(reason);
      sync();
    },
  };
}

export interface Ads {
  /** The platform's rules for ads. */
  rules: AdRules;
  /** An ad is on screen: the game is muted (CrazyGames: mute only once the ad really starts). */
  playing(): boolean;
  /** From the request until the ad is over: the game is paused and the player cannot act (CrazyGames asks for both). */
  busy(): boolean;
  /** Ads can play in this session; false after an ad blocker or a Basic Launch, so rewarded offers are hidden. */
  available(): boolean;
  /** A midgame ad at a natural moment, unless one played less than `gapMs` ago or one is on its way (Poki: commercialBreak). */
  midgame(): void;
  /**
   * A rewarded ad the player asked for; `onReward` only when it played to the end, otherwise `onNone`, with `unavailable`
   * true when ads turned out to be off for the whole session.
   */
  rewarded(onReward: () => void, onNone?: (unavailable: boolean) => void): void;
}

/**
 * Ads with the platform's gap between midgame ads. `onPause` is told when an ad is requested and when it is over (pause
 * the game, gameplayStop); `onUnavailable` once, when ads turn out to be off for the session (an ad blocker, a Basic Launch).
 */
export function createAds(
  platform: Pick<Platform, 'requestAd' | 'hasAdblock' | 'adRules'>,
  clock: Clock,
  onPause: (paused: boolean) => void,
  onUnavailable: () => void = () => undefined,
): Ads {
  let busy = false;
  let playing = false;
  let available = true;
  let lastAt = -Infinity;
  const turnOff = (): void => {
    if (!available) return;
    available = false;
    onUnavailable();
  };
  void platform.hasAdblock().then(
    (blocked) => blocked && turnOff(),
    () => undefined,
  );
  const show = (type: AdType): Promise<AdResult> => {
    lastAt = clock.now();
    busy = true;
    onPause(true);
    return platform
      .requestAd(type, () => void (playing = true))
      .catch((): AdResult => 'failed')
      .then((result) => {
        busy = false;
        playing = false;
        onPause(false);
        lastAt = clock.now();
        if (result === 'unavailable') turnOff();
        return result;
      });
  };
  return {
    rules: platform.adRules,
    playing: () => playing,
    busy: () => busy,
    available: () => available,
    midgame() {
      if (available && !busy && clock.now() - lastAt >= platform.adRules.gapMs) void show('midgame');
    },
    rewarded(onReward, onNone) {
      if (busy || !available) return onNone?.(!available);
      void show('rewarded').then((result) => {
        if (result === 'finished') onReward();
        else onNone?.(result === 'unavailable');
      });
    },
  };
}

type AdWorld = Pick<World, 'bus' | 'store' | 'clock' | 'tutorial'>;

/** A natural pause for a midgame ad: not in a new game's first minutes, and never during a lesson, a choice card or a boss fight. */
export function quietMoment({ store, clock, tutorial }: Omit<AdWorld, 'bus'>, rules: AdRules): boolean {
  const state = store.getState();
  const now = clock.now();
  if (now - state.meta.createdAt < rules.newPlayerMs || tutorial.machine.visibleStep() !== null) return false;
  return currentCard(state, now) === undefined && currentBoss(state, now) === undefined;
}

/**
 * The game's moments for the platform: a midgame ad at a natural pause (a hero comes back, a new level once its message
 * is gone; on CrazyGames at most every 4 minutes), and happytime for the great achievements. On CrazyGames never straight
 * after a button: it forbids midgame ads on shop and menu buttons (Poki's menus: `startMenuBreaks`). One call in main.ts.
 */
export function startPlatform(world: AdWorld, platform: Pick<Platform, 'happytime'>, ads: Pick<Ads, 'midgame' | 'rules'>): void {
  const { bus, clock } = world;
  const maybe = (): void => {
    if (quietMoment(world, ads.rules)) ads.midgame();
  };
  let levelAdAt = 0;
  bus.on('hero:returned', maybe);
  bus.on('reputation:levelUp', () => void (levelAdAt = clock.now() + ADS.afterLevelMs));
  bus.on('tick', () => {
    if (levelAdAt === 0 || clock.now() < levelAdAt) return;
    levelAdAt = 0;
    maybe();
  });
  bus.on('achievement:unlocked', ({ big }) => {
    if (big) platform.happytime();
  });
}

/**
 * Menus as a stop in gameplay (`menuBreaks`, Poki): while the side panel or the settings are open the platform hears
 * gameplayStop, and closing the last one is the moment for a midgame ad before gameplay starts again (Poki wants its
 * commercialBreak exactly there). Without `menuBreaks` (CrazyGames) menus change nothing. Returns what the side panel
 * reports to: `menu(id, open)`.
 */
export function startMenuBreaks(
  world: AdWorld,
  ads: Pick<Ads, 'midgame' | 'rules'>,
  pause: (on: boolean) => void,
): (id: string, open: boolean) => void {
  const open = new Set<string>();
  const menu = (id: string, isOpen: boolean): void => {
    if (!ads.rules.menuBreaks || isOpen === open.has(id)) return;
    if (isOpen) {
      open.add(id);
      if (open.size === 1) pause(true);
      return;
    }
    open.delete(id);
    if (open.size > 0) return;
    // The ad is asked for first, so gameplay only starts again once it is over.
    if (quietMoment(world, ads.rules)) ads.midgame();
    pause(false);
  };
  world.bus.on('settings:opened', () => menu('settings', true));
  world.bus.on('settings:closed', () => menu('settings', false));
  return menu;
}
