import type { Rng } from '@/core/rng';
import { SERVING } from '@/data/brewing';
import { dismiss, findCustomer, type CustomerCatalog, type CustomerFloor } from '@/systems/customers';
import type { BrewStation } from '@/systems/brewing';
import { feedbackKey } from '@/systems/feedback';
import { computePayout } from './payout';
import type { EconomyStore, ServeOutcome } from './types';

export interface ServeDeps {
  floor: CustomerFloor;
  station: BrewStation;
  economy: EconomyStore;
  catalog: CustomerCatalog;
  rng: Rng;
}

/**
 * The player clicks a customer: if their drink is ready on the bar they get it and pay,
 * otherwise they complain. Wrong drinks are refused and stay on the bar.
 */
export function serveCustomer(deps: ServeDeps, customerId: number): ServeOutcome {
  const { floor, station, economy, catalog, rng } = deps;
  const customer = findCustomer(floor, customerId);
  const recipe = catalog.recipes.find((r) => r.id === customer?.recipeId);
  const type = catalog.customerTypes.find((c) => c.id === customer?.typeId);
  if (customer === undefined || recipe === undefined || type === undefined) return { kind: 'ignored' };

  const base = { id: customer.id, seat: customer.seat, recipeId: recipe.id };
  const index = station.ready.indexOf(recipe.id);
  if (index === -1) {
    const reason = station.ready.length === 0 ? 'nothing-ready' : 'wrong-drink';
    const messageKey = feedbackKey(reason === 'nothing-ready' ? 'nothing' : 'wrong', rng);
    return { kind: 'refused', event: { ...base, reason, messageKey } };
  }

  const change = dismiss(floor, customer.id, 'served');
  if (change === undefined) return { kind: 'ignored' };
  station.ready.splice(index, 1);
  const gold = computePayout(recipe, type);
  economy.update((state) => {
    state.currencies.gold = state.currencies.gold.add(gold);
    state.reputation += SERVING.reputationPerServe;
  });
  return { kind: 'served', change, event: { ...base, gold, messageKey: feedbackKey('served', rng) } };
}
