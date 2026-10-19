import { type AdResult, type AdType, CRAZYGAMES_ADS, type Platform } from '@/platform/platform';
import { debug } from '@/shared/events';
import type { StorageAdapter } from '@/shared/save';

/** The parts of the CrazyGames HTML5 SDK v3 the game uses (docs.crazygames.com/sdk, checked 2026-10-12). */
interface CrazySdk {
  init(): Promise<void>;
  environment: 'local' | 'crazygames' | 'disabled';
  game: {
    loadingStart(): void;
    loadingStop(): void;
    gameplayStart(): void;
    gameplayStop(): void;
    happytime(): void;
    settings: { muteAudio: boolean };
  };
  ad: {
    requestAd(type: AdType, callbacks: { adStarted?: () => void; adFinished?: () => void; adError?: (error: { code: string }) => void }): void;
    hasAdblock(): Promise<boolean>;
  };
  data: StorageAdapter & { clear(): void };
  user: { isUserAccountAvailable: boolean; getUser(): Promise<{ username: string } | null> };
}

const sdk = (): CrazySdk | undefined => (window as unknown as { CrazyGames?: { SDK?: CrazySdk } }).CrazyGames?.SDK;

/** The save key the game used before the data module existed (copied over once for a returning player). */
const LEGACY_KEYS = ['bt_save'];
/** Ad errors that last the whole session (docs.crazygames.com/sdk/video-ads, checked 2026-10-12). */
const UNAVAILABLE_CODES = ['adblock', 'adsDisabledBasicLaunch'];

/** On CrazyGames the data module keeps the save (and syncs it with the account); a save in localStorage moves over once. */
function dataStorage(s: CrazySdk): StorageAdapter {
  for (const key of LEGACY_KEYS) {
    const local = window.localStorage.getItem(key);
    if (s.data.getItem(key) === null && local !== null) s.data.setItem(key, local);
  }
  return s.data;
}

/**
 * The CrazyGames platform, once the SDK script (in index.html) is there and initialized; null without it (no internet,
 * or a domain where the SDK is disabled), so the game falls back to the stand-in.
 */
export async function createCrazyGamesPlatform(): Promise<Platform | null> {
  const s = sdk();
  if (s === undefined) return null;
  try {
    await s.init();
  } catch (error) {
    debug('CrazyGames SDK did not start', error);
    return null;
  }
  if (s.environment === 'disabled') return null;
  return {
    environment: s.environment,
    adRules: CRAZYGAMES_ADS,
    storage: s.environment === 'crazygames' ? dataStorage(s) : null,
    loadingStart: () => s.game.loadingStart(),
    loadingStop: () => s.game.loadingStop(),
    gameplayStart: () => s.game.gameplayStart(),
    gameplayStop: () => s.game.gameplayStop(),
    happytime: () => s.game.happytime(),
    requestAd: (type, onStart) =>
      new Promise<AdResult>((resolve) => {
        s.ad.requestAd(type, {
          adStarted: onStart,
          adFinished: () => resolve('finished'),
          // Unfilled, cooldown, an error: just carry on (a rewarded ad then gives nothing). An ad blocker or a Basic
          // Launch means no ads for the rest of the session, so the game hides its rewarded offers.
          adError: (error) => {
            debug('ad not shown', error.code);
            resolve(UNAVAILABLE_CODES.includes(error.code) ? 'unavailable' : 'failed');
          },
        });
      }),
    hasAdblock: () => s.ad.hasAdblock(),
    muted: () => s.game.settings.muteAudio,
    username: async () => (s.user.isUserAccountAvailable ? ((await s.user.getUser())?.username ?? null) : null),
  };
}
