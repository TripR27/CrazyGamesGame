import type { World } from '@/app/world';
import { DAILY } from '@/daily/daily';
import type { UpgradeEffect } from '@/economy/upgrade-data';
import { levelFor } from '@/reputation/reputation';
import { num, type Num } from '@/shared/numbers';
import type { GameState } from '@/shared/state';

/**
 * Rewarded ads: the player chooses to watch one for a bag of gold, a power-up for a few minutes, or the rest of the price
 * of something in the shop. Nothing here is only for ads: it is what playing brings too, just sooner. Placeholder numbers.
 */
export const REWARDS = {
  /** A bag of gold is about this many minutes of what the tavern earned lately (at least a day-1 daily bonus). */
  goldMinutes: 3,
  /** The peddler: the first visit after this much play in a session, then one every `everyMs`, staying `staysMs`. */
  peddler: { firstAfterMs: 300_000, everyMs: 300_000, staysMs: 30_000 },
  /** A shop row whose price the player has at least this share of gets a 🎬 button; at most once per `cooldownMs`. */
  shop: { share: 0.7, cooldownMs: 300_000 },
} as const;

/** A power-up for a few minutes; its effects count like upgrades in `getMultipliers`. Texts: `rewards.<id>.name`, `.does`. */
export interface BoostDef {
  id: string;
  minutes: number;
  effects: readonly UpgradeEffect[];
}

export const BOOSTS: readonly BoostDef[] = [
  { id: 'happy_hour', minutes: 3, effects: [{ stat: 'sellPrice', mode: 'multiply', perLevel: 1 }] },
  {
    id: 'extra_hands',
    minutes: 5,
    effects: [
      { stat: 'autoBrew', mode: 'multiply', perLevel: 1 },
      { stat: 'autoServe', mode: 'multiply', perLevel: 1 },
    ],
  },
  { id: 'rush', minutes: 3, effects: [{ stat: 'brewSpeed', mode: 'multiply', perLevel: 1 }] },
];

/** What the peddler offers, in turn: no chance involved, so the game's random numbers (and the simulator) stay the same. */
export const PEDDLER_OFFERS: readonly string[] = ['gold', 'happy_hour', 'gold', 'extra_hands', 'gold', 'rush'];

const boostById = (id: string): BoostDef | undefined => BOOSTS.find((b) => b.id === id);

/** The power-up running now adds its effects once (an ended one is cleared on the tick, see `startRewards`). */
export function boostBonuses(rewards: Pick<GameState['rewards'], 'boost'> | undefined): { effect: UpgradeEffect; times: number }[] {
  const boost = rewards === undefined ? undefined : boostById(rewards.boost);
  return boost === undefined ? [] : boost.effects.map((effect) => ({ effect, times: 1 }));
}

/** A bag of gold: what the tavern earned in the last few minutes, but at least the day-1 daily bonus of the level. */
export function goldBag(reputation: number, earnedLately: number): Num {
  const least = DAILY.goldByLevel[levelFor(reputation) - 1] ?? DAILY.goldByLevel[0];
  return num(Math.round(Math.max(least, earnedLately)));
}

/** Whether a shop row gets the 🎬 button: most of the price is there, not all of it, and the last one was long enough ago. */
export function shopAdOffered(cost: Num, gold: Num, now: number, lastAt: number): boolean {
  return gold.lt(cost) && gold.gte(cost.mul(REWARDS.shop.share)) && now - lastAt >= REWARDS.shop.cooldownMs;
}

/** After the ad: the gold that was missing, so the normal purchase that follows goes through. */
export function topUpForShop({ store, clock }: Pick<World, 'store' | 'clock'>, cost: Num): void {
  store.update((s) => {
    if (s.currencies.gold.lt(cost)) s.currencies.gold = cost;
    s.rewards.shopAdAt = clock.now();
  });
}

/** The peddler in the tavern right now: what he offers and when he leaves. Runtime only. */
export interface PeddlerVisit {
  offer: string;
  leavesAt: number;
}

export interface RewardServices {
  /** The peddler while he is in the tavern, or null. */
  peddler(): PeddlerVisit | null;
  /** The bag of gold an ad would bring now. */
  goldOffer(): Num;
  /** After the ad: the peddler's offer (gold or a power-up), and he leaves. */
  accept(): void;
  /** No thanks: he leaves. */
  dismiss(): void;
  /** No ads in this session (an ad blocker, a Basic Launch): the peddler leaves for good and his lesson is skipped. */
  disable(): void;
  /** False once `disable` was called. */
  enabled(): boolean;
}

const PEDDLER_LESSON = 'peddler';

type RewardWorld = Pick<World, 'store' | 'bus' | 'clock' | 'tutorial'>;

/** Gold earned by serving lately, for the bag of gold. Keeps only the last `goldMinutes` of serves. */
function trackEarnings({ bus, clock }: RewardWorld): () => number {
  const serves: { at: number; gold: number }[] = [];
  const windowMs = REWARDS.goldMinutes * 60_000;
  bus.on('customer:served', ({ gold, tip }) => serves.push({ at: clock.now(), gold: gold.add(tip).toNumber() }));
  return () => {
    while (serves.length > 0 && (serves[0]?.at ?? 0) < clock.now() - windowMs) serves.shift();
    return serves.reduce((sum, s) => sum + s.gold, 0);
  };
}

/** Give the player a reward the ad paid for: a bag of gold, or a power-up for its minutes (in place of one that runs). */
export function grantReward({ store, bus, clock }: Pick<World, 'store' | 'bus' | 'clock'>, offer: string, gold: Num): void {
  const boost = boostById(offer);
  store.update((s) => {
    if (boost === undefined) s.currencies.gold = s.currencies.gold.add(gold);
    else s.rewards = { ...s.rewards, boost: boost.id, boostEndsAt: clock.now() + boost.minutes * 60_000 };
  });
  bus.emit('reward:granted', { offer, gold: boost === undefined ? gold : num(0) });
  bus.emit('saveRequested', {});
}

/**
 * The rewards on the tick: an ended power-up is cleared, and the peddler comes by now and then (not while a lesson is on
 * screen; a power-up he would offer while one runs becomes gold). One line in createWorld; returns the services.
 */
export function startRewards(world: RewardWorld): RewardServices {
  const { store, bus, clock, tutorial } = world;
  const earnedLately = trackEarnings(world);
  let visit: PeddlerVisit | null = null;
  let nextAt = clock.now() + REWARDS.peddler.firstAfterMs;
  let turn = 0;
  let enabled = true;
  const leave = (): void => {
    visit = null;
    nextAt = clock.now() + REWARDS.peddler.everyMs;
    bus.emit('peddler:left', {});
  };
  bus.on('tick', () => {
    const now = clock.now();
    const rewards = store.getState().rewards;
    if (rewards.boost !== '' && now >= rewards.boostEndsAt) store.update((s) => void (s.rewards = { ...s.rewards, boost: '', boostEndsAt: 0 }));
    if (visit !== null && now >= visit.leavesAt) leave();
    if (!enabled || visit !== null || now < nextAt || tutorial.machine.visibleStep() !== null) return;
    const planned = PEDDLER_OFFERS[turn % PEDDLER_OFFERS.length] ?? 'gold';
    turn++;
    visit = { offer: rewards.boost !== '' && planned !== 'gold' ? 'gold' : planned, leavesAt: now + REWARDS.peddler.staysMs };
    bus.emit('peddler:arrived', { offer: visit.offer });
  });
  const goldOffer = (): Num => goldBag(store.getState().reputation, earnedLately());
  return {
    peddler: () => visit,
    goldOffer,
    accept() {
      if (visit === null) return;
      grantReward(world, visit.offer, goldOffer());
      leave();
    },
    dismiss() {
      if (visit !== null) leave();
    },
    disable() {
      if (!enabled) return;
      enabled = false;
      if (visit !== null) leave();
      bus.emit('rewards:off', {});
      // Waiting for a peddler who never comes would hold back every later lesson (also after "play it again").
      tutorial.machine.skipLesson(PEDDLER_LESSON);
      tutorial.machine.subscribe(() => tutorial.machine.skipLesson(PEDDLER_LESSON));
    },
    enabled: () => enabled,
  };
}
