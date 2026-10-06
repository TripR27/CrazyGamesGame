import { ONE, type Num } from '@/core/numbers';
import type { Rng } from '@/core/rng';
import { SERVING } from '@/data/brewing';
import { findCustomer, isWaiting, startDrinking, type CustomerCatalog, type CustomerFloor } from '@/systems/customers';
import type { BrewStation } from '@/systems/brewing';
import { drinkBonus, rollTip } from '@/systems/effects';
import { feedbackKey } from '@/systems/feedback';
import { computePayout } from './payout';
import type { EconomyStore, ServeOutcome } from './types';

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
 * otherwise they complain. Wrong drinks are refused and stay on the bar. The drink's effect always works,
 * and counts double when the customer likes it.
 */
export function serveCustomer(deps: ServeDeps, customerId: number): ServeOutcome {
  const { floor, station, economy, catalog, rng } = deps;
  const customer = findCustomer(floor, customerId);
  const recipe = catalog.recipes.find((r) => r.id === customer?.recipeId);
  const type = catalog.customerTypes.find((c) => c.id === customer?.typeId);
  if (customer === undefined || !isWaiting(customer) || recipe === undefined || type === undefined) return { kind: 'ignored' };

  const base = { id: customer.id, seat: customer.seat, recipeId: recipe.id };
  const index = station.ready.indexOf(recipe.id);
  if (index === -1) {
    const reason = station.ready.length === 0 ? 'nothing-ready' : 'wrong-drink';
    const messageKey = feedbackKey(reason === 'nothing-ready' ? 'nothing' : 'wrong', rng);
    return { kind: 'refused', event: { ...base, reason, messageKey } };
  }

  station.ready.splice(index, 1);
  const bonus = drinkBonus(recipe, type);
  const gold = computePayout(recipe, type, deps.getSellMultiplier?.() ?? ONE);
  const tip = rollTip(gold, bonus, rng);
  startDrinking(customer, SERVING.drinkMs * bonus.drinkTimeFactor);
  economy.update((state) => {
    state.currencies.gold = state.currencies.gold.add(gold).add(tip);
    state.reputation += SERVING.reputationPerServe + bonus.extraReputation;
  });
  const event = { ...base, gold, tip, extraReputation: bonus.extraReputation, liked: customer.liked };
  return { kind: 'served', event: { ...event, messageKey: feedbackKey('served', rng) } };
}
