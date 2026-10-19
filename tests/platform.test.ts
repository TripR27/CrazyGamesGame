import { describe, expect, it, vi } from 'vitest';
import { newGame } from './flows/helpers';
import { payOfflineAgain, type OfflineReport } from '@/offline/offline';
import { type AdResult, createAds, createGameplay, createMockPlatform, CRAZYGAMES_ADS, startMenuBreaks, startPlatform } from '@/platform/platform';
import { createPokiPlatform, POKI_ADS } from '@/platform/poki';
import { num } from '@/shared/numbers';
import { createInitialState } from '@/shared/state';

function testClock(start = 1_000_000) {
  let now = start;
  return { now: () => now, advance: (ms: number) => void (now += ms) };
}

/** A platform whose ads end when the test says so. */
function adPlatform() {
  const pending: { type: string; start: () => void; end: (r: AdResult) => void }[] = [];
  const requestAd = (type: string, start: () => void): Promise<AdResult> => new Promise((end) => pending.push({ type, start, end }));
  return { pending, requestAd, hasAdblock: (): Promise<boolean> => Promise.resolve(false), adRules: CRAZYGAMES_ADS };
}
const flush = () => new Promise((r) => setTimeout(r, 0));

describe('gameplay events', () => {
  it('start once nothing pauses the game and stop for every reason, passing on changes only', () => {
    const platform = { gameplayStart: vi.fn(), gameplayStop: vi.fn() };
    const gameplay = createGameplay(platform);
    expect(platform.gameplayStart).toHaveBeenCalledTimes(1);
    gameplay.pause('hidden', true);
    gameplay.pause('ad', true);
    expect(platform.gameplayStop).toHaveBeenCalledTimes(1);
    gameplay.pause('hidden', false);
    expect(platform.gameplayStart).toHaveBeenCalledTimes(1);
    gameplay.pause('ad', false);
    expect(platform.gameplayStart).toHaveBeenCalledTimes(2);
  });

  it('wait for loading to end when told to start paused', () => {
    const platform = { gameplayStart: vi.fn(), gameplayStop: vi.fn() };
    const gameplay = createGameplay(platform, ['loading']);
    expect(platform.gameplayStart).not.toHaveBeenCalled();
    gameplay.pause('loading', false);
    expect(platform.gameplayStart).toHaveBeenCalledTimes(1);
  });
});

describe('ads', () => {
  it('play a midgame ad at most every 3 minutes, paused from the request and muted once it starts', async () => {
    const clock = testClock();
    const platform = adPlatform();
    const pauses: boolean[] = [];
    const ads = createAds(platform, clock, (p) => pauses.push(p));
    ads.midgame();
    expect(ads.busy()).toBe(true);
    expect(ads.playing()).toBe(false);
    expect(pauses).toEqual([true]);
    platform.pending[0]?.start();
    expect(ads.playing()).toBe(true);
    platform.pending[0]?.end('finished');
    await flush();
    expect(ads.playing()).toBe(false);
    expect(ads.busy()).toBe(false);
    expect(pauses).toEqual([true, false]);
    clock.advance(CRAZYGAMES_ADS.gapMs - 1000);
    ads.midgame();
    expect(platform.pending).toHaveLength(1);
    clock.advance(1000);
    ads.midgame();
    expect(platform.pending).toHaveLength(2);
  });

  it('reward only an ad that played to the end, and carry on when there was none', async () => {
    const platform = adPlatform();
    const ads = createAds(platform, testClock(), () => undefined);
    const reward = vi.fn();
    ads.rewarded(reward);
    platform.pending[0]?.end('failed');
    await flush();
    expect(reward).not.toHaveBeenCalled();
    ads.rewarded(reward);
    platform.pending[1]?.start();
    platform.pending[1]?.end('finished');
    await flush();
    expect(reward).toHaveBeenCalledTimes(1);
  });

  it('turn off for the session after an ad blocker or a Basic Launch, so no rewarded button does nothing', async () => {
    const platform = adPlatform();
    const off = vi.fn();
    const ads = createAds(platform, testClock(), () => undefined, off);
    const none = vi.fn();
    ads.rewarded(vi.fn(), none);
    platform.pending[0]?.end('failed');
    await flush();
    expect(none).toHaveBeenLastCalledWith(false);
    expect(ads.available()).toBe(true);
    ads.rewarded(vi.fn(), none);
    platform.pending[1]?.end('unavailable');
    await flush();
    expect(none).toHaveBeenLastCalledWith(true);
    expect(ads.available()).toBe(false);
    expect(off).toHaveBeenCalledTimes(1);
    ads.rewarded(vi.fn(), none);
    ads.midgame();
    expect(platform.pending).toHaveLength(2);
  });

  it('turn off when the SDK sees an ad blocker at the start', async () => {
    const off = vi.fn();
    const ads = createAds({ ...adPlatform(), hasAdblock: () => Promise.resolve(true) }, testClock(), () => undefined, off);
    await flush();
    expect(ads.available()).toBe(false);
    expect(off).toHaveBeenCalledTimes(1);
  });

  it('are asked for when a hero comes back, and happytime comes with the great achievements', () => {
    const g = newGame(createInitialState(0));
    const platform = { happytime: vi.fn() };
    const ads = { midgame: vi.fn(), rules: CRAZYGAMES_ADS };
    startPlatform(g.world, platform, ads);
    g.world.bus.emit('hero:returned', { id: 'warrior', dungeon: 'swamp', loot: {}, gear: null, xp: 40, level: 1, levelUp: false, injured: false, boss: null });
    g.world.bus.emit('achievement:unlocked', { id: 'first_pint', big: false });
    g.world.bus.emit('achievement:unlocked', { id: 'new_owner', big: true });
    expect(ads.midgame).toHaveBeenCalledTimes(1);
    expect(platform.happytime).toHaveBeenCalledTimes(1);
  });

  it('play at once to the end on the stand-in platform, so the flows can be tried locally', async () => {
    const started = vi.fn();
    expect(await createMockPlatform().requestAd('rewarded', started)).toBe('finished');
    expect(started).toHaveBeenCalled();
  });
});

describe('ads on Poki', () => {
  it('leave the pace of midgame ads to the platform: no gap of our own', async () => {
    const platform = { ...adPlatform(), adRules: POKI_ADS };
    const ads = createAds(platform, testClock(), () => undefined);
    ads.midgame();
    platform.pending[0]?.end('finished');
    await flush();
    ads.midgame();
    expect(platform.pending).toHaveLength(2);
  });

  it('stop gameplay while a menu is open and ask for an ad before it starts again', () => {
    const g = newGame(createInitialState(0));
    const calls: string[] = [];
    const ads = { midgame: () => void calls.push('ad'), rules: POKI_ADS };
    const menu = startMenuBreaks(g.world, ads, (open) => void calls.push(open ? 'stop' : 'start'));
    menu('panel', true);
    g.world.bus.emit('settings:opened', {});
    menu('panel', false);
    expect(calls).toEqual(['stop']);
    g.world.bus.emit('settings:closed', {});
    expect(calls).toEqual(['stop', 'ad', 'start']);
  });

  it('leave menus alone on CrazyGames, which forbids ads after menu buttons', () => {
    const g = newGame(createInitialState(0));
    const calls: string[] = [];
    const menu = startMenuBreaks(g.world, { midgame: () => void calls.push('ad'), rules: CRAZYGAMES_ADS }, () => void calls.push('pause'));
    menu('panel', true);
    menu('panel', false);
    expect(calls).toEqual([]);
  });
});

describe('the Poki SDK', () => {
  const withSdk = (sdk: object | undefined) => vi.stubGlobal('window', { PokiSDK: sdk });
  const fakeSdk = (init: Promise<void>, watched = true) => ({
    init: () => init,
    gameLoadingFinished: vi.fn(),
    gameplayStart: vi.fn(),
    gameplayStop: vi.fn(),
    commercialBreak: (start: () => void) => (start(), Promise.resolve()),
    rewardedBreak: (start: () => void) => (start(), Promise.resolve(watched)),
  });

  it('rewards only a video watched to the end, and counts a commercial break as played', async () => {
    withSdk(fakeSdk(Promise.resolve(), false));
    const platform = await createPokiPlatform();
    const started = vi.fn();
    expect(await platform.requestAd('midgame', started)).toBe('finished');
    expect(await platform.requestAd('rewarded', started)).toBe('failed');
    expect(started).toHaveBeenCalledTimes(2);
    expect(await platform.hasAdblock()).toBe(false);
    vi.unstubAllGlobals();
  });

  it('starts the game anyway without ads when init fails or the script is blocked (an ad blocker)', async () => {
    withSdk(fakeSdk(Promise.reject(new Error('blocked'))));
    const failed = await createPokiPlatform();
    expect(await failed.requestAd('rewarded', vi.fn())).toBe('unavailable');
    expect(await failed.hasAdblock()).toBe(true);
    withSdk(undefined);
    const missing = await createPokiPlatform();
    missing.gameplayStart();
    expect(await missing.requestAd('midgame', vi.fn())).toBe('unavailable');
    vi.unstubAllGlobals();
  });
});

describe('the rewarded ad in the welcome-back window', () => {
  it('pays the staff earnings out once more', () => {
    const g = newGame(createInitialState(0));
    const report: OfflineReport = {
      awayMs: 3_600_000, countedMs: 3_600_000, capped: false, limitHours: 2, hadStaff: true, served: 90, gold: num(1800), reputation: 90, missed: num(0), trips: 0, heroLoot: {},
    };
    payOfflineAgain(g.world, report);
    expect(g.world.store.getState().currencies.gold.toNumber()).toBe(1800);
    expect(g.world.store.getState().stats.goldEarned.toNumber()).toBe(1800);
  });
});
