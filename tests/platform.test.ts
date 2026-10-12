import { describe, expect, it, vi } from 'vitest';
import { newGame } from './flows/helpers';
import { payOfflineAgain, type OfflineReport } from '@/offline/offline';
import { ADS, type AdResult, createAds, createGameplay, createMockPlatform, startPlatform } from '@/platform/platform';
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
  return { pending, requestAd };
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
});

describe('ads', () => {
  it('play a midgame ad at most every 3 minutes, pausing while it plays', async () => {
    const clock = testClock();
    const platform = adPlatform();
    const pauses: boolean[] = [];
    const ads = createAds(platform, clock, (p) => pauses.push(p));
    ads.midgame();
    platform.pending[0]?.start();
    expect(ads.playing()).toBe(true);
    platform.pending[0]?.end('finished');
    await flush();
    expect(ads.playing()).toBe(false);
    expect(pauses).toEqual([true, false]);
    clock.advance(ADS.gapMs - 1000);
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

  it('are asked for when a hero comes back, and happytime comes with the great achievements', () => {
    const g = newGame(createInitialState(0));
    const platform = { happytime: vi.fn() };
    const ads = { midgame: vi.fn() };
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
