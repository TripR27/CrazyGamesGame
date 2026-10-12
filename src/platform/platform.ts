import type { World } from '@/app/world';
import type { StorageAdapter } from '@/shared/save';
import { debug } from '@/shared/events';
import type { Clock } from '@/shared/time';

export type AdType = 'midgame' | 'rewarded';
/** `finished`: the ad played to the end (a rewarded ad then pays out); `failed`: no ad, adblock, cooldown or an error. */
export type AdResult = 'finished' | 'failed';

/**
 * The game's platform (one of the real seams, like time and storage): CrazyGames through its SDK, or a stand-in when
 * there is no SDK (tests, the simulator, development without internet). Only `platform/crazygames.ts` touches the SDK.
 */
export interface Platform {
  /** 'crazygames', 'local' (the SDK's own test mode on localhost) or 'none' (the stand-in). */
  environment: string;
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
  /** The platform muted the game; its setting goes before the game's own (read when a sound plays). */
  muted(): boolean;
  /** The CrazyGames user name, or null (not signed in, or no platform). */
  username(): Promise<string | null>;
}

/** The stand-in without an SDK: it logs, and an ad "plays" at once to the end, so the flows can be tried locally. */
export function createMockPlatform(): Platform {
  return {
    environment: 'none',
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

/** Placeholder rules for ads (CrazyGames: at least 3 minutes between midgame ads, rewarded ones count too). */
export const ADS = { gapMs: 180_000 } as const;

export interface Ads {
  /** An ad is on screen: the game is paused and muted. */
  playing(): boolean;
  /** A midgame ad at a natural moment, unless one played less than `gapMs` ago or one is playing. */
  midgame(): void;
  /** A rewarded ad the player asked for; `onReward` only when it played to the end. */
  rewarded(onReward: () => void): void;
}

/** Ads with the 3-minute rule; `onPause` is told when an ad starts and ends (pause the game, gameplayStop). */
export function createAds(platform: Pick<Platform, 'requestAd'>, clock: Clock, onPause: (paused: boolean) => void): Ads {
  let playing = false;
  let lastAt = -Infinity;
  const show = (type: AdType): Promise<AdResult> => {
    lastAt = clock.now();
    return platform
      .requestAd(type, () => {
        playing = true;
        onPause(true);
      })
      .catch((): AdResult => 'failed')
      .then((result) => {
        if (playing) onPause(false);
        playing = false;
        lastAt = clock.now();
        return result;
      });
  };
  return {
    playing: () => playing,
    midgame() {
      if (!playing && clock.now() - lastAt >= ADS.gapMs) void show('midgame');
    },
    rewarded(onReward) {
      if (playing) return;
      void show('rewarded').then((result) => {
        if (result === 'finished') onReward();
      });
    },
  };
}

/**
 * The game's moments for the platform: a midgame ad when a hero comes back (a natural pause; at most every 3 minutes),
 * and happytime for the great achievements. One call in main.ts, after the world is built.
 */
export function startPlatform({ bus }: Pick<World, 'bus'>, platform: Pick<Platform, 'happytime'>, ads: Pick<Ads, 'midgame'>): void {
  bus.on('hero:returned', () => ads.midgame());
  bus.on('achievement:unlocked', ({ big }) => {
    if (big) platform.happytime();
  });
}
