import type { GameState } from '@/core/state';
import type { Store } from '@/core/store';
import type { TutorialEvent } from '@/data/tutorial';
import { upgrades, type UpgradeDef } from '@/data/upgrades';
import { waitingCustomers, type CustomerFloor } from '@/systems/customers';
import { levelFor } from '@/systems/reputation';
import type { AlreadyHolds } from '@/systems/tutorial';
import { firstAffordable, generalOnly, seatsOnly, staffOnly } from '@/systems/upgrades';

type Check = (store: Store<GameState>, floor: CustomerFloor) => boolean;

const canBuy = (group: (defs: readonly UpgradeDef[]) => UpgradeDef[]): Check => (store) =>
  firstAffordable(store.getState(), group(upgrades)) !== undefined;

/**
 * For each start event, whether what it announces is already true. A lesson that starts on such an event shows
 * at once when it holds: a customer who sat down before the tutorial (re)started, gold that was already enough,
 * a level reached before this session. New start event = one more entry.
 */
const CHECKS: Partial<Record<TutorialEvent, Check>> = {
  'customer:arrived': (_store, floor) => floor.customers.length > 0,
  'upgrade:affordable': canBuy(generalOnly),
  'seats:affordable': canBuy(seatsOnly),
  'staff:affordable': canBuy(staffOnly),
  'likes:ordered': (_store, floor) => waitingCustomers(floor).some((c) => c.liked),
  'vip:arrived': (_store, floor) => waitingCustomers(floor).some((c) => c.vip),
  'reputation:levelUp': (store) => levelFor(store.getState().reputation) > 1,
};

export function createAlreadyHolds(store: Store<GameState>, floor: CustomerFloor): AlreadyHolds {
  return (event) => CHECKS[event]?.(store, floor) ?? false;
}
