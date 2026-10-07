import type { World } from '@/app/world';
import { DECORATIONS, type DecorDef } from '@/decor/decor';
import { type UpgradeDef, BASE_STATS, upgrades, UPGRADE_STATS, type UpgradeEffect, type UpgradeStat } from '@/economy/upgrade-data';
import { ROOMS, type RoomDef } from '@/rooms/rooms';
import type { EventBus, GameEvents } from '@/shared/events';
import { num, type Num, ZERO } from '@/shared/numbers';
import type { UpgradeLevels } from '@/shared/state';

/** Owned level of an upgrade; never above its max, even if an old save or a content change says so. */
export function levelOf(levels: UpgradeLevels, def: UpgradeDef): number {
  const owned = Math.max(0, Math.floor(levels[def.id] ?? 0));
  return def.maxLevel === undefined ? owned : Math.min(owned, def.maxLevel);
}

/** Whether an upgrade is for sale yet: it has no `unlockedBy`, or the player owns a level of one of those. */
export const isUnlocked = (levels: UpgradeLevels, def: UpgradeDef): boolean =>
  def.unlockedBy === undefined || def.unlockedBy.some((id) => (levels[id] ?? 0) > 0);

/** Levels still to buy: Infinity when there is no cap. */
export function levelsLeft(levels: UpgradeLevels, def: UpgradeDef): number {
  return def.maxLevel === undefined ? Infinity : def.maxLevel - levelOf(levels, def);
}

/** Cost of one level: `baseCost * growth^level`, in whole coins (at least 1). */
export function levelCost(def: UpgradeDef, level: number): Num {
  return num(def.baseCost).mul(num(def.growth).pow(level)).round().max(1);
}

/**
 * Cost of `count` levels in a row starting at `level`: the sum of the geometric series in one go.
 * The price shown for a pack is exactly what is paid, with no loop even for huge counts.
 */
export function packCost(def: UpgradeDef, level: number, count: number): Num {
  if (count <= 1) return levelCost(def, level);
  const first = num(def.baseCost).mul(num(def.growth).pow(level));
  return first.mul(num(def.growth).pow(count).sub(1)).div(def.growth - 1).round().max(1);
}

/** How many levels in a row `gold` pays for, at most `limit`. */
export function affordableCount(def: UpgradeDef, level: number, gold: Num, limit: number): number {
  if (gold.lt(levelCost(def, level))) return 0;
  const first = num(def.baseCost).mul(num(def.growth).pow(level));
  const estimate = Math.floor(gold.mul(def.growth - 1).div(first).add(1).log10() / Math.log10(def.growth));
  let count = Math.min(Math.max(estimate, 1), limit);
  // The estimate ignores rounding; nudge it until it is exactly right.
  while (count < limit && packCost(def, level, count + 1).lte(gold)) count++;
  while (count > 0 && packCost(def, level, count).gt(gold)) count--;
  return count;
}

/** How many levels the player wants in one click. */
export type BuyAmount = 1 | 10 | 'max';

export interface Quote {
  /** Levels this click would buy; 0 when the upgrade is maxed. */
  count: number;
  /** Price of those levels. */
  cost: Num;
  affordable: boolean;
}

/**
 * What a click would buy and what it costs. A fixed amount is capped at the levels left and is
 * all or nothing; "max" buys as many as the gold allows (or shows the next level if it cannot afford any).
 */
export function quote(def: UpgradeDef, level: number, gold: Num, amount: BuyAmount, left: number): Quote {
  if (left <= 0) return { count: 0, cost: ZERO, affordable: false };
  if (amount !== 'max') {
    const count = Math.min(amount, left);
    const cost = packCost(def, level, count);
    return { count, cost, affordable: gold.gte(cost) };
  }
  const count = affordableCount(def, level, gold, left);
  if (count === 0) return { count: 1, cost: packCost(def, level, 1), affordable: false };
  return { count, cost: packCost(def, level, count), affordable: true };
}

/** The part of the game state that buying changes (interface segregation: not the whole state). */
export interface UpgradeState {
  currencies: { gold: Num };
  upgrades: UpgradeLevels;
}

export interface UpgradeStore {
  getState(): UpgradeState;
  update(mutator: (state: UpgradeState) => void): void;
}

/** Quote for an upgrade against the current state. An upgrade that is not unlocked yet has nothing to buy. */
export function quoteFor(state: UpgradeState, def: UpgradeDef, amount: BuyAmount): Quote {
  const left = isUnlocked(state.upgrades, def) ? levelsLeft(state.upgrades, def) : 0;
  return quote(def, levelOf(state.upgrades, def), state.currencies.gold, amount, left);
}

/** Buys what `quoteFor` promised. Returns the number of levels bought (0 when it cannot be afforded). */
export function buyUpgrade(store: UpgradeStore, def: UpgradeDef, amount: BuyAmount): number {
  const deal = quoteFor(store.getState(), def, amount);
  if (!deal.affordable) return 0;
  store.update((state) => {
    state.currencies.gold = state.currencies.gold.sub(deal.cost);
    state.upgrades[def.id] = levelOf(state.upgrades, def) + deal.count;
  });
  return deal.count;
}

/**
 * Staff and seats each have their own tutorial hint; every other upgrade belongs to the first-upgrade hint.
 * A new hint group is one more function here plus an event name in `AffordableEvent`.
 */
const isStaff = (d: UpgradeDef): boolean => d.kind === 'staff';
const isSeats = (d: UpgradeDef): boolean => d.effect.stat === 'seats';

export const staffOnly = (defs: readonly UpgradeDef[]): UpgradeDef[] => defs.filter(isStaff);
export const seatsOnly = (defs: readonly UpgradeDef[]): UpgradeDef[] => defs.filter(isSeats);
export const generalOnly = (defs: readonly UpgradeDef[]): UpgradeDef[] => defs.filter((d) => !isStaff(d) && !isSeats(d));

/** The first upgrade the player can pay for with one more level right now, or undefined. */
export function firstAffordable(state: UpgradeState, defs: readonly UpgradeDef[]): UpgradeDef | undefined {
  return defs.find((def) => quoteFor(state, def, 1).affordable);
}

/** Which event announces the moment: one for the shop upgrades, one for staff. */
export type AffordableEvent = 'upgrade:affordable' | 'staff:affordable' | 'seats:affordable';

export interface AffordableSource {
  getState(): UpgradeState;
  subscribe(listener: () => void): () => void;
}

/**
 * Publishes `upgrade:affordable` each time the player goes from "cannot buy anything" to "can buy something".
 * The tutorial uses this to know when the shop becomes useful. Returns a stop function.
 */
export function watchAffordable(
  source: AffordableSource,
  bus: EventBus<GameEvents>,
  defs: readonly UpgradeDef[],
  event: AffordableEvent = 'upgrade:affordable',
): () => void {
  let could = firstAffordable(source.getState(), defs) !== undefined;
  return source.subscribe(() => {
    const can = firstAffordable(source.getState(), defs) !== undefined;
    if (can && !could) bus.emit(event, {});
    could = can;
  });
}

/** The final value of every stat: what the rest of the game reads. */
export type Multipliers = Record<UpgradeStat, Num>;

/** The part of the state the multipliers depend on (interface segregation). */
export interface MultiplierState {
  upgrades: UpgradeLevels;
  /** Built rooms; left out means none. */
  roomsBuilt?: readonly string[];
  /** Bought decorations; left out means none. */
  decorBought?: readonly string[];
}

/** One bonus and how many times it counts (an upgrade's level, or 1 for a built room or a bought decoration). */
interface Source {
  effect: UpgradeEffect;
  times: number;
}

/** Added amounts count first, then factors, so the order of the sources never changes the result. */
function applySources(stat: UpgradeStat, sources: readonly Source[]): Num {
  const own = sources.filter((s) => s.effect.stat === stat);
  let value = num(BASE_STATS[stat]);
  for (const s of own.filter((o) => o.effect.mode === 'add')) value = value.add(s.effect.perLevel * s.times);
  for (const s of own.filter((o) => o.effect.mode === 'multiply')) value = value.mul(num(1 + s.effect.perLevel).pow(s.times));
  return value;
}

/**
 * The one place where every source of a bonus is added up: upgrades, built rooms and decorations; prestige, achievements and
 * events join here later without the callers changing.
 */
export function getMultipliers(
  state: MultiplierState,
  defs: readonly UpgradeDef[] = upgrades,
  rooms: readonly RoomDef[] = ROOMS,
  decor: readonly DecorDef[] = DECORATIONS,
): Multipliers {
  const built = rooms.filter((r) => (state.roomsBuilt ?? []).includes(r.id));
  const decorated = decor.filter((d) => (state.decorBought ?? []).includes(d.id));
  const sources: Source[] = [
    ...defs.map((def) => ({ effect: def.effect, times: levelOf(state.upgrades, def) })),
    ...[...built, ...decorated].flatMap((owned) => owned.effects.map((effect) => ({ effect, times: 1 }))),
  ];
  const entries = UPGRADE_STATS.map((stat) => [stat, applySources(stat, sources)] as const);
  return Object.fromEntries(entries) as Multipliers;
}

/** Buy levels of an upgrade; does nothing when it cannot be afforded. */
export function buyUpgradeById({ bus, store, content }: Pick<World, 'bus' | 'store' | 'content'>, id: string, amount: BuyAmount): void {
  const def = content.upgrades.find((u) => u.id === id);
  const count = def === undefined ? 0 : buyUpgrade(store, def, amount);
  if (def === undefined || count === 0) return;
  bus.emit('upgrade:bought', { id: def.id, count });
  if (def.kind === 'staff') bus.emit('staff:hired', { id: def.id });
  if (def.effect.stat === 'seats') bus.emit('seats:bought', { id: def.id });
  bus.emit('saveRequested', {});
}
