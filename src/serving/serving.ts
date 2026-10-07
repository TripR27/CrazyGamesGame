import type { World } from '@/app/world';
import { getMultipliers } from '@/economy/upgrades';
import type { BrewStation } from '@/brewing/brewing';
import type { CustomerDef } from '@/customers/customer-data';
import { startDrinking, findCustomer, isWaiting, type CustomerCatalog, type CustomerFloor } from '@/customers/customers';
import type { RecipeDef } from '@/recipes/recipe-data';
import { drinkBonus, rollTip, SERVING } from '@/serving/effects';
import type { GameEvents, EventBus } from '@/shared/events';
import { type Num, num, ONE } from '@/shared/numbers';
import { type Rng, feedbackKey } from '@/shared/random';

/** The part of the game state that serving changes (interface segregation: not the whole state). */
export interface EconomyState {
  currencies: { gold: Num };
  reputation: number;
}

export interface EconomyStore {
  update(mutator: (state: EconomyState) => void): void;
}

export type ServeOutcome =
  /** The customer got the drink and now stays to drink it; they leave later through the customer system. */
  | { kind: 'served'; event: GameEvents['customer:served'] }
  | { kind: 'refused'; event: GameEvents['customer:refused'] }
  /** The customer is already gone or the content is unknown: nothing happens. */
  | { kind: 'ignored' };

/**
 * Gold for serving a drink: its base price times what this kind of customer spends, the strength of the
 * drink and the sell-price multiplier, in whole coins (at least 1). Tips come on top (see `rollTip`).
 */
export function computePayout(recipe: RecipeDef, customerType: CustomerDef, sellMultiplier: Num = ONE): Num {
  const strength = drinkBonus(recipe, customerType).priceFactor;
  return num(recipe.basePrice).mul(customerType.spendMultiplier).mul(strength).mul(sellMultiplier).round().max(1);
}

/**
 * The drink the player picked up from the bar, waiting to be handed to a customer. Runtime only. A pick is a
 * kind of drink (a recipe id): it stays valid while such a drink stands on the bar, and lapses by itself when
 * the last one is gone (for example because the waitress served it).
 */
export interface DrinkSelection {
  /** The picked recipe id, or null. */
  selected(): string | null;
  /** Pick this drink, or put it back when it was already picked. Returns the pick afterwards. */
  toggle(recipeId: string): string | null;
  clear(): void;
}

export function createDrinkSelection(station: Pick<BrewStation, 'ready'>): DrinkSelection {
  let picked: string | null = null;
  const selected = (): string | null => {
    if (picked !== null && !station.ready.includes(picked)) picked = null;
    return picked;
  };
  return {
    selected,
    toggle(recipeId) {
      picked = selected() === recipeId || !station.ready.includes(recipeId) ? null : recipeId;
      return picked;
    },
    clear() {
      picked = null;
    },
  };
}

export interface ServeDeps {
  floor: CustomerFloor;
  station: BrewStation;
  economy: EconomyStore;
  catalog: CustomerCatalog;
  rng: Rng;
  /** Sell-price multiplier from upgrades; read at the moment of serving. */
  getSellMultiplier?(): Num;
}

/**
 * The player clicks a customer: if their drink is ready on the bar they get it, pay, and stay to drink it;
 * otherwise they complain. `offered` is the drink the player picked from the bar first: a different one is
 * refused and stays on the bar. The drink's effect always works, and counts double when the customer likes it.
 */
export function serveCustomer(deps: ServeDeps, customerId: number, offered?: string): ServeOutcome {
  const { floor, station, economy, catalog, rng } = deps;
  const customer = findCustomer(floor, customerId);
  const recipe = catalog.recipes.find((r) => r.id === customer?.recipeId);
  const type = catalog.customerTypes.find((c) => c.id === customer?.typeId);
  if (customer === undefined || !isWaiting(customer) || recipe === undefined || type === undefined) return { kind: 'ignored' };

  const base = { id: customer.id, seat: customer.seat, recipeId: recipe.id };
  const index = offered === undefined || offered === recipe.id ? station.ready.indexOf(recipe.id) : -1;
  if (index === -1) {
    const reason = station.ready.length === 0 ? 'nothing-ready' : 'wrong-drink';
    const messageKey = feedbackKey(reason === 'nothing-ready' ? 'nothing' : 'wrong', rng);
    return { kind: 'refused', event: { ...base, reason, messageKey } };
  }

  station.ready.splice(index, 1);
  const bonus = drinkBonus(recipe, type);
  const gold = computePayout(recipe, type, deps.getSellMultiplier?.() ?? ONE);
  const tip = rollTip(gold, bonus, rng);
  // Charm and a VIP's own bonus both come on top of the normal reputation.
  const extraReputation = bonus.extraReputation + (type.reputationBonus ?? 0);
  startDrinking(customer, SERVING.drinkMs * bonus.drinkTimeFactor);
  economy.update((state) => {
    state.currencies.gold = state.currencies.gold.add(gold).add(tip);
    state.reputation += SERVING.reputationPerServe + extraReputation;
  });
  const event = { ...base, gold, tip, extraReputation, liked: customer.liked, vip: customer.vip };
  return { kind: 'served', event: { ...event, messageKey: feedbackKey('served', rng) } };
}

/** Serves a customer and announces what happened. The player (a click) and the waitress both use this. */
export function serveAndPublish(
  deps: ServeDeps & { bus: EventBus<GameEvents> },
  customerId: number,
  offered?: string,
): ServeOutcome {
  const outcome = serveCustomer(deps, customerId, offered);
  if (outcome.kind === 'served') {
    deps.bus.emit('customer:served', outcome.event);
    if (outcome.event.liked) deps.bus.emit('likes:served', { id: customerId });
    if (outcome.event.vip) deps.bus.emit('vip:served', { id: customerId });
  } else if (outcome.kind === 'refused') {
    deps.bus.emit('customer:refused', outcome.event);
  }
  return outcome;
}

type ServeWorld = Pick<World, 'bus' | 'floor' | 'station' | 'store' | 'content' | 'rng'>;

/** What serving needs from the world; the price multiplier is read at the moment of serving. */
export function serveContext(world: ServeWorld): ServeDeps & { bus: EventBus<GameEvents> } {
  const { bus, floor, station, store, content, rng } = world;
  return { bus, floor, station, economy: store, catalog: content, rng, getSellMultiplier: () => getMultipliers(store.getState()).sellPrice };
}

/** Click a customer: they get the picked drink, or (with nothing picked) their own order if it is ready. */
export function clickCustomer(world: ServeWorld & Pick<World, 'selection'>, customerId: number): void {
  const outcome = serveAndPublish(serveContext(world), customerId, world.selection.selected() ?? undefined);
  // A refused drink stays picked, so the player can try the right customer next.
  if (outcome.kind === 'served') world.selection.clear();
}

/** Click the drink in this bar slot: pick it up, or put it back when it was already picked. */
export function clickReadyDrink({ bus, station, selection }: Pick<World, 'bus' | 'station' | 'selection'>, slot: number): void {
  const recipeId = station.ready[slot];
  if (recipeId === undefined) return;
  const picked = selection.toggle(recipeId);
  if (picked !== null) bus.emit('drink:picked', { recipeId: picked });
}

/** Put the picked drink back (a click on an empty spot). */
export function cancelSelection({ selection }: Pick<World, 'selection'>): void {
  selection.clear();
}
