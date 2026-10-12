import { describe, expect, it, vi } from 'vitest';
import { DAILY } from '@/daily/daily';
import { getMultipliers } from '@/economy/upgrades';
import { ADS, startPlatform } from '@/platform/platform';
import { BOOSTS, goldBag, PEDDLER_OFFERS, REWARDS, shopAdOffered, topUpForShop } from '@/rewards/rewards';
import { num } from '@/shared/numbers';
import { createInitialState } from '@/shared/state';
import { newGame } from './flows/helpers';

const MINUTE = 60_000;

/** A game with a clock we move by hand; the tutorial is skipped so nothing holds the peddler back. */
function game(createdAt = 0) {
  let now = createdAt;
  const state = createInitialState(createdAt);
  state.tutorial.skipped = true;
  const g = newGame(state, { now: () => now });
  const tick = (ms: number): void => {
    for (let t = 0; t < ms; t += 100) {
      now += 100;
      g.world.bus.emit('tick', { deltaMs: 100 });
    }
  };
  return { ...g, tick, at: (ms: number) => void (now = ms) };
}

describe('the peddler', () => {
  it('comes by after a while with the offers in turn, and leaves after a short stay', () => {
    const g = game();
    const arrived = vi.fn();
    g.world.bus.on('peddler:arrived', arrived);
    g.tick(REWARDS.peddler.firstAfterMs - 1000);
    expect(g.world.rewards.peddler()).toBeNull();
    g.tick(1100);
    expect(g.world.rewards.peddler()?.offer).toBe(PEDDLER_OFFERS[0]);
    g.tick(REWARDS.peddler.staysMs);
    expect(g.world.rewards.peddler()).toBeNull();
    g.tick(REWARDS.peddler.everyMs + 200);
    expect(arrived).toHaveBeenLastCalledWith({ offer: PEDDLER_OFFERS[1] });
  });

  it('hands over a bag of gold, or a power-up that counts in the multipliers until it runs out', () => {
    const g = game();
    g.tick(REWARDS.peddler.firstAfterMs + 100);
    g.world.rewards.accept();
    expect(g.state.currencies.gold.toNumber()).toBe(DAILY.goldByLevel[0]);
    expect(g.world.rewards.peddler()).toBeNull();
    g.tick(REWARDS.peddler.everyMs + 200);
    expect(g.world.rewards.peddler()?.offer).toBe('happy_hour');
    g.world.rewards.accept();
    expect(g.state.rewards.boost).toBe('happy_hour');
    expect(getMultipliers(g.state).sellPrice.toNumber()).toBe(2);
    g.tick((BOOSTS[0]?.minutes ?? 0) * MINUTE + 200);
    expect(g.state.rewards.boost).toBe('');
    expect(getMultipliers(g.state).sellPrice.toNumber()).toBe(1);
  });

  it('stays away for good without ads in the session, and his lesson does not hold back the later ones', () => {
    const g = newGame(createInitialState(0), { now: () => 0 });
    const off = vi.fn();
    g.world.bus.on('rewards:off', off);
    g.world.rewards.disable();
    expect(off).toHaveBeenCalledTimes(1);
    expect(g.world.rewards.enabled()).toBe(false);
    expect(g.state.tutorial.completedSteps).toContain('peddler_spot');
    g.world.tutorial.machine.restart();
    expect(g.state.tutorial.completedSteps).toEqual(['peddler_spot']);
  });

  it('leaves at once when ads turn out to be off while he is there', () => {
    const g = game();
    g.tick(REWARDS.peddler.firstAfterMs + 100);
    expect(g.world.rewards.peddler()).not.toBeNull();
    g.world.rewards.disable();
    expect(g.world.rewards.peddler()).toBeNull();
    g.tick(REWARDS.peddler.everyMs * 3);
    expect(g.world.rewards.peddler()).toBeNull();
  });

  it('offers gold instead of a second power-up while one runs, and leaves when sent off', () => {
    const g = game();
    g.store.update((s) => void (s.rewards = { boost: 'rush', boostEndsAt: 1e12, shopAdAt: 0 }));
    g.tick(REWARDS.peddler.firstAfterMs + REWARDS.peddler.staysMs + REWARDS.peddler.everyMs + 500);
    expect(g.world.rewards.peddler()?.offer).toBe('gold');
    g.world.rewards.dismiss();
    expect(g.world.rewards.peddler()).toBeNull();
  });
});

describe('the bag of gold', () => {
  it('is what the tavern earned lately, but at least a day-1 daily bonus of the level', () => {
    expect(goldBag(0, 10).toNumber()).toBe(DAILY.goldByLevel[0]);
    expect(goldBag(0, 5000).toNumber()).toBe(5000);
  });
});

describe('the shop 📺 button', () => {
  it('shows with most of the price there, not all of it, and not again too soon', () => {
    const cost = num(100);
    expect(shopAdOffered(cost, num(69), 1e9, 0)).toBe(false);
    expect(shopAdOffered(cost, num(70), 1e9, 0)).toBe(true);
    expect(shopAdOffered(cost, num(100), 1e9, 0)).toBe(false);
    expect(shopAdOffered(cost, num(80), 1e9, 1e9 - REWARDS.shop.cooldownMs + 1)).toBe(false);
  });

  it('adds the missing gold after the ad, so the purchase goes through', () => {
    const g = game();
    g.store.update((s) => void (s.currencies.gold = num(80)));
    topUpForShop(g.world, num(100));
    expect(g.state.currencies.gold.toNumber()).toBe(100);
    expect(g.state.rewards.shopAdAt).toBeGreaterThanOrEqual(0);
  });
});

describe('midgame ads at natural moments', () => {
  const hero = { id: 'warrior', dungeon: 'swamp', loot: {}, gear: null, xp: 40, level: 1, levelUp: false, injured: false, boss: null };

  it("wait out a new game's first minutes, then come with a hero and (a moment later) a new level, never after a shop button", () => {
    const g = game(0);
    const ads = { midgame: vi.fn() };
    startPlatform(g.world, { happytime: vi.fn() }, ads);
    g.world.bus.emit('hero:returned', hero);
    expect(ads.midgame).not.toHaveBeenCalled();
    g.at(ADS.newPlayerMs);
    g.world.bus.emit('room:built', { id: 'extension' });
    expect(ads.midgame).not.toHaveBeenCalled();
    g.world.bus.emit('hero:returned', hero);
    expect(ads.midgame).toHaveBeenCalledTimes(1);
    g.world.bus.emit('reputation:levelUp', { level: 2 });
    expect(ads.midgame).toHaveBeenCalledTimes(1);
    g.tick(ADS.afterLevelMs + 100);
    expect(ads.midgame).toHaveBeenCalledTimes(2);
  });

  it('never come while a lesson is on screen', () => {
    const g = newGame(createInitialState(0), { now: () => ADS.newPlayerMs * 2 });
    g.world.floor.customers.length = 0;
    const ads = { midgame: vi.fn() };
    startPlatform(g.world, { happytime: vi.fn() }, ads);
    g.tick(4_000); // the first customer arrives and the first lesson shows
    expect(g.shown()).not.toBeNull();
    g.world.bus.emit('hero:returned', hero);
    expect(ads.midgame).not.toHaveBeenCalled();
  });
});
