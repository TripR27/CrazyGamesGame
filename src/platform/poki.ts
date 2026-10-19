import type { AdResult, AdRules, Platform } from '@/platform/platform';
import { debug } from '@/shared/events';

/** The parts of the Poki HTML5 SDK v2 the game uses (developers.poki.com/guide/sdk-html5, checked 2026-10-19). */
interface PokiSdk {
  init(): Promise<void>;
  gameLoadingFinished(): void;
  gameplayStart(): void;
  gameplayStop(): void;
  /** Resolves when the break is over, also when Poki decided not to show an ad; `onStart` only runs when one plays. */
  commercialBreak(onStart?: () => void): Promise<void>;
  /** Resolves true only when the player watched the video to the end. */
  rewardedBreak(onStart?: () => void): Promise<boolean>;
}

/**
 * Poki sets the pace of ads itself (no timers of our own, also not for new players), wants a commercialBreak when the
 * player comes back from a menu, and shows its own message to players with an ad blocker (no notice of ours).
 */
export const POKI_ADS: AdRules = { gapMs: 0, newPlayerMs: 0, menuBreaks: true, explainOff: false };

const sdk = (): PokiSdk | undefined => (window as unknown as { PokiSDK?: PokiSdk }).PokiSDK;

/**
 * The Poki platform. The SDK script is in index.html in the Poki build (`--mode poki`). Poki's rule is to start the game
 * whatever `init()` says; when it fails or the script is blocked, there is an ad blocker, so there are no ads this
 * session (and no rewards). Saves stay in localStorage; Poki has no mute setting, account or happytime.
 */
export async function createPokiPlatform(): Promise<Platform> {
  const s = sdk();
  let blocked = s === undefined;
  try {
    await s?.init();
  } catch (error) {
    debug('Poki SDK: no ads this session', error);
    blocked = true;
  }
  // A midgame break counts as played even when Poki showed nothing; a rewarded one only when it was watched to the end.
  const ad = (play: (poki: PokiSdk) => Promise<boolean>): Promise<AdResult> =>
    s === undefined || blocked ? Promise.resolve('unavailable') : play(s).then((watched) => (watched ? 'finished' : 'failed'));
  return {
    environment: 'poki',
    adRules: POKI_ADS,
    storage: null,
    loadingStart: () => undefined,
    loadingStop: () => s?.gameLoadingFinished(),
    gameplayStart: () => s?.gameplayStart(),
    gameplayStop: () => s?.gameplayStop(),
    happytime: () => undefined,
    requestAd: (type, onStart) =>
      ad((poki) => (type === 'rewarded' ? poki.rewardedBreak(onStart) : poki.commercialBreak(onStart).then(() => true))),
    hasAdblock: () => Promise.resolve(blocked),
    muted: () => false,
    username: () => Promise.resolve(null),
  };
}
