import { SERVING } from '@/brewing/brewing';
import { type CustomerDef, VIP_SPAWN } from '@/customers/customer-data';
import { priciestRecipe, meanSpawnIntervalMs, type CustomerCatalog } from '@/customers/customers';
import { getMultipliers } from '@/economy/upgrades';
import { t } from '@/i18n/index';
import { type RecipeDef, recipes } from '@/recipes/recipe-data';
import { levelFor } from '@/reputation/reputation';
import { drinkBonus, orderWeight, tipSize } from '@/serving/effects';
import { computePayout } from '@/serving/serving';
import type { EventBus, GameEvents } from '@/shared/events';
import { type Num, num, ZERO, formatNumber } from '@/shared/numbers';
import { touchLastSeen, type GameState, type Store } from '@/shared/state';
import type { Clock } from '@/shared/time';

/** Placeholder numbers for progress while the player is away; tuned in step 13. */
export const OFFLINE = {
  /** Share of the staff's normal pace that counts while away: being there should pay a little better. */
  efficiency: 0.5,
  /** Gaps shorter than this are counted without showing the welcome-back window (a quick reload, a tab switch). */
  minWelcomeMs: 60_000,
} as const;

/** What happened while the player was away. Shown in the welcome-back window. */
export interface OfflineReport {
  /** Real time away. */
  awayMs: number;
  /** The part of it that counts: at most the offline limit. */
  countedMs: number;
  /** Staff stopped working before the player came back. */
  capped: boolean;
  limitHours: number;
  /** Both a brewer and a waitress were hired, so something could be earned. */
  hadStaff: boolean;
  served: number;
  gold: Num;
  reputation: number;
}

/** What one served drink brings on average: gold (tips counted by their chance) and reputation. */
export interface Reward {
  gold: Num;
  reputation: number;
}

const NOTHING: Reward = { gold: ZERO, reputation: 0 };

/** One drink for one customer, with the drink effects worked in as an expected value (no randomness). */
function expectedReward(recipe: RecipeDef, type: CustomerDef, sellMultiplier: Num): Reward {
  const bonus = drinkBonus(recipe, type);
  const price = computePayout(recipe, type, sellMultiplier);
  return {
    gold: price.add(tipSize(price, bonus).mul(bonus.tipChance)),
    reputation: SERVING.reputationPerServe + bonus.extraReputation + (type.reputationBonus ?? 0),
  };
}

/** Rewards averaged with weights (equal weights when none are given). */
function average(rewards: readonly Reward[], weights: readonly number[] = rewards.map(() => 1)): Reward {
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (rewards.length === 0 || total <= 0) return NOTHING;
  return {
    gold: rewards.reduce((sum, r, i) => sum.add(r.gold.mul(weights[i] ?? 0)), num(0)).div(total),
    reputation: rewards.reduce((sum, r, i) => sum + r.reputation * (weights[i] ?? 0), 0) / total,
  };
}

/** One kind of customer: what they order (a VIP the priciest drink, others liked drinks more often). */
function customerReward(recipes: readonly RecipeDef[], type: CustomerDef, sellMultiplier: Num): Reward {
  const orders = type.vip === true ? [priciestRecipe(recipes)].filter((r) => r !== undefined) : recipes;
  return average(orders.map((r) => expectedReward(r, type, sellMultiplier)), orders.map((r) => orderWeight(type, r)));
}

/**
 * What one served drink brings on average at this reputation: the regular customers of the level (evenly,
 * like the spawner picks them), and VIPs by their chance (`vipChance`) once one is open. Zero when nobody could order.
 */
export function averageReward(
  recipes: readonly RecipeDef[],
  customerTypes: readonly CustomerDef[],
  reputation: number,
  sellMultiplier: Num,
  vipChance: number = VIP_SPAWN.chance,
): Reward {
  if (recipes.length === 0) return NOTHING;
  const open = customerTypes.filter((c) => c.minLevel <= levelFor(reputation));
  const byType = (vip: boolean): Reward =>
    average(open.filter((c) => (c.vip === true) === vip).map((c) => customerReward(recipes, c, sellMultiplier)));
  const regular = byType(false);
  if (!open.some((c) => c.vip === true)) return regular;
  return average([regular, byType(true)], [1 - vipChance, vipChance]);
}

const HOUR_MS = 3_600_000;

export interface OfflineInput {
  /** Wall-clock time the player was away. */
  awayMs: number;
  /** Staff pace in actions per second (0 means nobody is hired). */
  rates: { brew: number; serve: number };
  /** How long staff keep working while away, in hours. */
  limitHours: number;
  reputation: number;
  knownRecipes: readonly RecipeDef[];
  customerTypes: readonly CustomerDef[];
  sellMultiplier: Num;
  /** Chance that a customer is a VIP once one is open (rooms can raise it); left out means the base chance. */
  vipChance?: number;
}

/**
 * What the staff earned while the player was away, worked out with a formula (never by simulating ticks).
 * Drinks per second are limited by the slowest link: brewing, serving or the customers coming in.
 * Only a share of that pace counts (`OFFLINE.efficiency`), and only up to the offline limit.
 */
export function computeOffline(input: OfflineInput): OfflineReport {
  const awayMs = Math.max(0, input.awayMs);
  const limitMs = input.limitHours * HOUR_MS;
  const countedMs = Math.min(awayMs, limitMs);
  const hadStaff = input.rates.brew > 0 && input.rates.serve > 0;

  const customersPerSecond = 1000 / meanSpawnIntervalMs(input.reputation);
  const drinksPerSecond = Math.min(input.rates.brew, input.rates.serve, customersPerSecond);
  const served = hadStaff ? Math.floor((countedMs / 1000) * drinksPerSecond * OFFLINE.efficiency) : 0;
  const reward = averageReward(input.knownRecipes, input.customerTypes, input.reputation, input.sellMultiplier, input.vipChance);

  return {
    awayMs,
    countedMs,
    capped: awayMs > limitMs,
    limitHours: input.limitHours,
    hadStaff,
    served,
    gold: reward.gold.mul(served).round(),
    reputation: Math.floor(served * reward.reputation),
  };
}

/** The part of the game state offline earnings change (interface segregation). */
export interface OfflineState {
  currencies: { gold: Num };
  reputation: number;
}

export interface OfflineStore {
  update(mutator: (state: OfflineState) => void): void;
}

/** Pay out what the staff earned. Earning nothing changes nothing. */
export function applyOffline(store: OfflineStore, report: OfflineReport): void {
  if (report.served === 0) return;
  store.update((state) => {
    state.currencies.gold = state.currencies.gold.add(report.gold);
    state.reputation += report.reputation;
  });
}

/**
 * Where reports wait for the welcome-back window. A report can arrive before the window exists
 * (the game loads, then the UI mounts), so listeners also get what is already waiting.
 */
export interface OfflineInbox {
  post(report: OfflineReport): void;
  /** The waiting report, once; null when there is none. */
  take(): OfflineReport | null;
  /** Called for each new report. Returns an unsubscribe function. */
  subscribe(listener: (report: OfflineReport) => void): () => void;
}

export function createOfflineInbox(): OfflineInbox {
  let waiting: OfflineReport | null = null;
  const listeners = new Set<(report: OfflineReport) => void>();
  return {
    post(report) {
      waiting = report;
      for (const listener of [...listeners]) listener(report);
    },
    take() {
      const report = waiting;
      waiting = null;
      return report;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

const MINUTE_MS = 60_000;

/** "1h 23m", "45m" or "50s": the two biggest units that are not zero. */
export function formatDuration(ms: number): string {
  const hours = Math.floor(ms / HOUR_MS);
  const minutes = Math.floor((ms % HOUR_MS) / MINUTE_MS);
  const seconds = Math.floor((ms % MINUTE_MS) / 1000);
  const parts = [
    hours > 0 ? t('time.hours', { n: hours }) : '',
    minutes > 0 ? t('time.minutes', { n: minutes }) : '',
    hours === 0 && minutes === 0 ? t('time.seconds', { n: seconds }) : '',
  ];
  return parts.filter((p) => p !== '').join(' ');
}

export interface WelcomeView {
  title: string;
  lines: string[];
  button: string;
}

/** The welcome-back window as plain strings: what was earned, or why nothing was. */
export function toWelcomeView(report: OfflineReport): WelcomeView {
  const earned = report.served > 0;
  const lines = [
    t('welcome.away', { time: formatDuration(report.awayMs) }),
    ...(earned
      ? [
          t('welcome.served', { served: report.served }),
          t('welcome.gold', { gold: formatNumber(report.gold) }),
        ]
      : [t('welcome.nobody')]),
    ...(report.capped && report.hadStaff ? [t('welcome.capped', { limit: formatDuration(report.countedMs) })] : []),
  ];
  return { title: t('welcome.title'), lines, button: t('welcome.collect') };
}

export interface OfflineDeps {
  store: Store<GameState>;
  bus: EventBus<GameEvents>;
  clock: Clock;
  catalog: CustomerCatalog;
}

export interface OfflineServices {
  /** The player was away for this long: pay out what the staff earned and, for a longer absence, welcome them back. */
  handleAway(awayMs: number): void;
  inbox: OfflineInbox;
}

/** Connects the offline formulas to the saved state: a gap in the clock becomes gold and a report. */
export function createOffline({ store, bus, clock, catalog }: OfflineDeps): OfflineServices {
  const inbox = createOfflineInbox();
  return {
    inbox,
    handleAway(awayMs) {
      if (awayMs <= 0) return;
      const state = store.getState();
      const stats = getMultipliers(state);
      const report = computeOffline({
        awayMs,
        rates: { brew: stats.autoBrew.toNumber(), serve: stats.autoServe.toNumber() },
        limitHours: stats.offlineHours.toNumber(),
        reputation: state.reputation,
        knownRecipes: recipes.filter((r) => state.recipesDiscovered.includes(r.id)),
        customerTypes: catalog.customerTypes,
        sellMultiplier: stats.sellPrice,
        vipChance: stats.vipChance.toNumber(),
      });
      applyOffline(store, report);
      // The time is accounted for now; without this the same gap would count again at the next save.
      store.update((s) => touchLastSeen(s, clock.now()));
      if (awayMs >= OFFLINE.minWelcomeMs) inbox.post(report);
      if (report.served > 0) bus.emit('saveRequested', {});
    },
  };
}
