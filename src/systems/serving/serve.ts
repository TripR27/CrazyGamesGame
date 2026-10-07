import { SERVING } from '@/data/brewing';
import { ONE, type Num } from '@/shared/numbers';
import { type Rng, feedbackKey } from '@/shared/random';
import type { BrewStation } from '@/systems/brewing/types';
import { startDrinking } from '@/systems/customers/drinking';
import { findCustomer, isWaiting } from '@/systems/customers/floor';
import type { CustomerCatalog, CustomerFloor } from '@/systems/customers/types';
import { drinkBonus } from '@/systems/effects/bonus';
import { rollTip } from '@/systems/effects/tip';
import { computePayout } from '@/systems/serving/payout';
import type { EconomyStore, ServeOutcome } from '@/systems/serving/types';

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
