import type { TutorialEvent } from '@/data/tutorial/types';
import { upgrades } from '@/data/upgrades/index';
import type { UpgradeDef } from '@/data/upgrades/types';
import { levelFor } from '@/reputation/reputation';
import { ROOMS, firstBuildableRoom } from '@/rooms/rooms';
import type { GameState, Store } from '@/shared/state';
import { waitingCustomers } from '@/systems/customers/floor';
import type { CustomerFloor } from '@/systems/customers/types';
import { firstBuyableIngredient, type IngredientCatalog } from '@/systems/ingredients/offer';
import type { AlreadyHolds } from '@/systems/tutorial/types';
import { firstAffordable } from '@/systems/upgrades/affordable';
import { generalOnly, seatsOnly, staffOnly } from '@/systems/upgrades/groups';

/** What the checks may look at: the saved state, the customers, and the side-panel tab on screen. */
interface World {
  store: Store<GameState>;
  floor: CustomerFloor;
  openTab(): string | null;
  ingredients: IngredientCatalog;
}

type Check = (world: World) => boolean;

const canBuy = (group: (defs: readonly UpgradeDef[]) => UpgradeDef[]): Check => ({ store }) =>
  firstAffordable(store.getState(), group(upgrades)) !== undefined;

/**
 * For each start event, whether what it announces is already true. A lesson that starts on such an event shows
 * at once when it holds: a customer who sat down before the tutorial (re)started, gold that was already enough,
 * a level reached before this session. Also for the tab a step waits for (it may be open already).
 * New event = one more entry.
 */
const CHECKS: Partial<Record<TutorialEvent, Check>> = {
  'customer:arrived': ({ floor }) => floor.customers.length > 0,
  'upgrade:affordable': canBuy(generalOnly),
  'seats:affordable': canBuy(seatsOnly),
  'staff:affordable': canBuy(staffOnly),
  'ingredients:affordable': ({ store, ingredients }) => firstBuyableIngredient(store.getState(), ingredients) !== undefined,
  'rooms:affordable': ({ store }) => firstBuildableRoom(store.getState(), ROOMS) !== undefined,
  'likes:ordered': ({ floor }) => waitingCustomers(floor).some((c) => c.liked),
  'vip:arrived': ({ floor }) => waitingCustomers(floor).some((c) => c.vip),
  'reputation:levelUp': ({ store }) => levelFor(store.getState().reputation) > 1,
  'shop:opened': ({ openTab }) => openTab() === 'shop',
  'book:opened': ({ openTab }) => openTab() === 'recipes',
};

export function createAlreadyHolds(world: World): AlreadyHolds {
  return (event) => CHECKS[event]?.(world) ?? false;
}
