import { type CustomerDef, SPAWNING, VIP_SPAWN } from '@/customers/customer-data';
import type { RecipeDef } from '@/recipes/recipe-data';
import { levelFor } from '@/reputation/reputation';
import { orderWeight, isLiked } from '@/serving/effects';
import type { LeaveReason, EventBus, GameEvents } from '@/shared/events';
import { type Rng, pickRandom, pickWeighted } from '@/shared/random';

/** A customer currently in the tavern. Not saved: the floor starts empty on every launch. */
export interface CustomerInstance {
  id: number;
  typeId: string;
  /** The drink this customer ordered. */
  recipeId: string;
  /** Seat number, 0 to capacity - 1. The scene maps it to a spot; the system never knows positions. */
  seat: number;
  patienceMs: number;
  patienceMaxMs: number;
  /** The customer likes the effect of the drink they ordered (it counts double). */
  liked: boolean;
  /** A VIP: pays a lot and orders the most expensive known drink. */
  vip: boolean;
  /** Set once served: time left to finish the drink. Undefined while still waiting for it. */
  drinkMsLeft?: number;
}

export interface CustomerFloor {
  capacity: number;
  customers: CustomerInstance[];
  nextId: number;
  spawnInMs: number;
}

/** What the system needs to know about the player (interface segregation: not the whole state). */
export interface CustomerContext {
  reputation: number;
  unlockedRecipeIds: readonly string[];
  /** Most customers allowed in the tavern at once (the tutorial lowers this to one). */
  maxCustomers: number;
  /** Seat numbers customers may use (bought seats downstairs, built rooms); left out means every seat. */
  openSeats?: readonly number[];
  /** Chance that a new customer is a VIP, once one is open; left out means the base chance. */
  vipChance?: number;
  /** Patience stops running down (the tutorial freezes it so nobody leaves in the middle of a lesson). */
  freezePatience: boolean;
}

/** The content tables, passed in so tests and the simulator can use their own. */
export interface CustomerCatalog {
  customerTypes: readonly CustomerDef[];
  recipes: readonly RecipeDef[];
}

export type CustomerChange =
  | { kind: 'arrived'; id: number; liked: boolean; vip: boolean }
  | { kind: 'left'; id: number; reason: LeaveReason };

export function createFloor(capacity: number): CustomerFloor {
  return { capacity, customers: [], nextId: 1, spawnInMs: SPAWNING.firstDelayMs };
}

export function findCustomer(floor: CustomerFloor, id: number): CustomerInstance | undefined {
  return floor.customers.find((c) => c.id === id);
}

/** Still waiting for a drink (not drinking yet). */
export const isWaiting = (customer: CustomerInstance): boolean => customer.drinkMsLeft === undefined;

/** The customers still waiting for their drink, oldest first. Drinking customers only hold a seat. */
export const waitingCustomers = (floor: CustomerFloor): CustomerInstance[] => floor.customers.filter(isWaiting);

/** Seats nobody sits in; only among `open` when given (rooms that are not built have no usable seats). */
export function freeSeats(floor: CustomerFloor, open?: readonly number[]): number[] {
  const taken = new Set(floor.customers.map((c) => c.seat));
  const all = Array.from({ length: floor.capacity }, (_, seat) => seat);
  return all.filter((s) => !taken.has(s) && (open === undefined || open.includes(s)));
}

/** Remove a customer from the floor. Returns the change to announce, or undefined if they were not there. */
export function dismiss(floor: CustomerFloor, id: number, reason: LeaveReason): CustomerChange | undefined {
  const index = floor.customers.findIndex((c) => c.id === id);
  if (index === -1) return undefined;
  floor.customers.splice(index, 1);
  return { kind: 'left', id, reason };
}

/** A served customer stays in their seat to drink; the seat frees up once the drink is finished. */
export function startDrinking(customer: CustomerInstance, drinkMs: number): void {
  customer.drinkMsLeft = Math.max(0, drinkMs);
}

/** Drinking customers get closer to finishing; those who are done leave happy. */
export function advanceDrinking(floor: CustomerFloor, deltaMs: number): CustomerChange[] {
  const drinking = floor.customers.filter((c) => c.drinkMsLeft !== undefined);
  for (const customer of drinking) customer.drinkMsLeft = (customer.drinkMsLeft ?? 0) - deltaMs;
  const finished = drinking.filter((c) => (c.drinkMsLeft ?? 0) <= 0);
  return finished.flatMap((c) => dismiss(floor, c.id, 'served') ?? []);
}

/** Lower the patience of everyone still waiting; customers who run out leave. Drinking customers are happy. */
export function advancePatience(floor: CustomerFloor, deltaMs: number): CustomerChange[] {
  const waiting = waitingCustomers(floor);
  for (const customer of waiting) customer.patienceMs -= deltaMs;
  const expired = waiting.filter((c) => c.patienceMs <= 0);
  return expired.flatMap((c) => dismiss(floor, c.id, 'impatient') ?? []);
}

/** The average time between customers at this reputation, without the random jitter. */
export function meanSpawnIntervalMs(reputation: number): number {
  const speedup = 1 + Math.max(0, reputation) * SPAWNING.reputationSpeedup;
  return Math.max(SPAWNING.minIntervalMs, SPAWNING.baseIntervalMs / speedup);
}

/** Time until the next customer: shorter with higher reputation, never below the minimum, with some jitter. */
export function nextSpawnDelayMs(reputation: number, rng: Rng): number {
  const spread = 1 + (rng() * 2 - 1) * SPAWNING.jitter;
  return Math.max(SPAWNING.minIntervalMs * (1 - SPAWNING.jitter), meanSpawnIntervalMs(reputation) * spread);
}

const isVip = (type: CustomerDef): boolean => type.vip === true;

/**
 * Who walks in at this level: now and then a VIP (once one is open), otherwise a regular customer.
 * Without an open VIP no chance is rolled, so the random sequence stays as it was before VIPs.
 */
export function pickCustomerType(
  rng: Rng,
  types: readonly CustomerDef[],
  level: number,
  vipChance: number = VIP_SPAWN.chance,
): CustomerDef | undefined {
  const open = types.filter((c) => c.minLevel <= level);
  const vips = open.filter(isVip);
  if (vips.length > 0 && rng() < vipChance) return pickRandom(rng, vips);
  return pickRandom(rng, open.filter((c) => !isVip(c)));
}

/** A VIP orders the most expensive drink the player knows. */
export function priciestRecipe(recipes: readonly RecipeDef[]): RecipeDef | undefined {
  return recipes.reduce<RecipeDef | undefined>((best, r) => (best === undefined || r.basePrice > best.basePrice ? r : best), undefined);
}

/** What this customer orders: a VIP the most expensive drink, anyone else a drink they like more often than another. */
export function pickOrder(rng: Rng, type: CustomerDef, known: readonly RecipeDef[]): RecipeDef | undefined {
  return isVip(type) ? priciestRecipe(known) : pickWeighted(rng, known, (r) => orderWeight(type, r));
}

/**
 * Seat one new customer if there is a free seat, a customer type the reputation level allows,
 * and a known recipe to order. Returns the change to announce, or undefined when nothing could spawn.
 */
export function trySpawn(
  floor: CustomerFloor,
  context: CustomerContext,
  catalog: CustomerCatalog,
  rng: Rng,
): CustomerChange | undefined {
  if (floor.customers.length >= context.maxCustomers) return undefined;
  const type = pickCustomerType(rng, catalog.customerTypes, levelFor(context.reputation), context.vipChance);
  const known = catalog.recipes.filter((r) => context.unlockedRecipeIds.includes(r.id));
  const recipe = type === undefined ? undefined : pickOrder(rng, type, known);
  const seat = pickRandom(rng, freeSeats(floor, context.openSeats));
  if (type === undefined || recipe === undefined || seat === undefined) return undefined;

  const patienceMaxMs = type.patienceSeconds * 1000;
  const id = floor.nextId++;
  const liked = isLiked(type, recipe);
  const vip = type.vip === true;
  floor.customers.push({ id, typeId: type.id, recipeId: recipe.id, seat, patienceMs: patienceMaxMs, patienceMaxMs, liked, vip });
  return { kind: 'arrived', id, liked, vip };
}

/**
 * One simulation step: drinks are finished, patience runs down, then a new customer may arrive.
 * While the tavern is full the timer does not drop below the refill delay, so when a seat frees up the
 * next customer still needs a moment to walk in: customers come gradually, not in a stream.
 */
export function updateCustomers(
  floor: CustomerFloor,
  context: CustomerContext,
  catalog: CustomerCatalog,
  rng: Rng,
  deltaMs: number,
): CustomerChange[] {
  // Drinking goes on during a lesson too, otherwise a served customer would hold the only seat.
  const changes = [...advanceDrinking(floor, deltaMs), ...(context.freezePatience ? [] : advancePatience(floor, deltaMs))];
  const full = floor.customers.length >= context.maxCustomers || freeSeats(floor, context.openSeats).length === 0;
  floor.spawnInMs = Math.max(full ? SPAWNING.refillDelayMs : 0, floor.spawnInMs - deltaMs);
  if (floor.spawnInMs > 0) return changes;

  const arrived = trySpawn(floor, context, catalog, rng);
  if (arrived === undefined) return changes;
  floor.spawnInMs = nextSpawnDelayMs(context.reputation, rng);
  return [...changes, arrived];
}

export interface CustomerSystemDeps {
  floor: CustomerFloor;
  bus: EventBus<GameEvents>;
  rng: Rng;
  catalog: CustomerCatalog;
  /** Read fresh on every step, so reputation and new recipes take effect immediately. */
  getContext(): CustomerContext;
}

export function publishChange(bus: EventBus<GameEvents>, change: CustomerChange): void {
  if (change.kind === 'left') {
    bus.emit('customer:left', { id: change.id, reason: change.reason });
    return;
  }
  bus.emit('customer:arrived', { id: change.id });
  if (change.liked) bus.emit('likes:ordered', { id: change.id });
  if (change.vip) bus.emit('vip:arrived', { id: change.id });
}

/** Runs the customer simulation on every game tick. Returns a stop function. */
export function startCustomerSystem(deps: CustomerSystemDeps): () => void {
  return deps.bus.on('tick', ({ deltaMs }) => {
    const context = deps.getContext();
    for (const change of updateCustomers(deps.floor, context, deps.catalog, deps.rng, deltaMs)) {
      publishChange(deps.bus, change);
    }
  });
}
