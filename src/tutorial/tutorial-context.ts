import type { BrewStation } from '@/brewing/brewing';
import { firstBuyableIngredient, type IngredientCatalog } from '@/brewing/ingredients';
import { waitingCustomers, type CustomerFloor } from '@/customers/customers';
import { upgrades, type UpgradeDef } from '@/economy/upgrade-data';
import { firstAffordable, generalOnly, seatsOnly, staffOnly } from '@/economy/upgrades';
import { recipes } from '@/recipes/recipe-data';
import { levelFor } from '@/reputation/reputation';
import { ROOMS, firstBuildableRoom } from '@/rooms/rooms';
import type { EventBus, GameEvents } from '@/shared/events';
import type { GameState, Store } from '@/shared/state';
import { type AlreadyHolds, createTutorialMachine, type ProgressStore, type TutorialMachine } from '@/tutorial/tutorial';
import type { GuideContext } from '@/tutorial/tutorial-guide';
import { type TutorialEvent, TUTORIAL_STEPS } from '@/tutorial/tutorial-steps';

/** Which open/close events belong to which side-panel tab. A new tab is one more entry. */
const TAB_EVENTS = [
  { tab: 'shop', opened: 'shop:opened', closed: 'shop:closed' },
  { tab: 'recipes', opened: 'book:opened', closed: 'book:closed' },
] as const;

/**
 * Follows the side panel from the events its tabs announce, so the tutorial knows whether to point at the button
 * that unfolds the panel, at a tab, or inside it. Returns a getter: the tab on screen, or null while folded away.
 */
export function followOpenTab(bus: EventBus<GameEvents>): () => string | null {
  let open: string | null = null;
  for (const { tab, opened, closed } of TAB_EVENTS) {
    bus.on(opened, () => void (open = tab));
    bus.on(closed, () => void (open = open === tab ? null : open));
  }
  return () => open;
}

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

export interface TutorialDeps {
  store: Store<GameState>;
  bus: EventBus<GameEvents>;
  floor: CustomerFloor;
  station: BrewStation;
  ingredients: IngredientCatalog;
}

export interface TutorialServices {
  machine: TutorialMachine;
  getGuideContext(): GuideContext;
}

/** Every game event any step listens to, once each. */
function listenedEvents(): TutorialEvent[] {
  const events = TUTORIAL_STEPS.flatMap((s) => [s.startWhen?.event, s.completeOn.kind === 'event' ? s.completeOn.event : undefined]);
  return [...new Set(events.filter((e): e is TutorialEvent => e !== undefined))];
}

/** Connects the tutorial machine to the saved state and the game bus. */
export function createTutorial({ store, bus, floor, station, ingredients }: TutorialDeps): TutorialServices {
  const progress: ProgressStore = {
    get: () => store.getState().tutorial,
    update: (mutator) => store.update((state) => mutator(state.tutorial)),
  };
  const affordable = (): string | null => firstAffordable(store.getState(), generalOnly(upgrades))?.id ?? null;
  const affordableSeats = (): string | null => firstAffordable(store.getState(), seatsOnly(upgrades))?.id ?? null;
  const affordableStaff = (): string | null => firstAffordable(store.getState(), staffOnly(upgrades))?.id ?? null;
  const openTab = followOpenTab(bus);
  const machine = createTutorialMachine(TUTORIAL_STEPS, progress, createAlreadyHolds({ store, floor, openTab, ingredients }));

  for (const event of listenedEvents()) bus.on(event, () => machine.onEvent(event));
  bus.on('tick', ({ deltaMs }) => machine.onTick(deltaMs));
  // Progress must survive a reload, so every change asks for a save.
  machine.subscribe(() => bus.emit('saveRequested', {}));

  const getGuideContext = (): GuideContext => ({
    knownRecipes: recipes.filter((r) => store.getState().recipesDiscovered.includes(r.id)),
    contents: station.contents,
    brewingRecipeId: station.brewing?.recipeId ?? null,
    readyRecipeIds: station.ready,
    customers: waitingCustomers(floor),
    affordableUpgradeId: affordable(),
    affordableSeatsId: affordableSeats(),
    affordableStaffId: affordableStaff(),
    affordableIngredientId: firstBuyableIngredient(store.getState(), ingredients)?.id ?? null,
    newestIngredientId: store.getState().ingredientsBought.at(-1) ?? null,
    affordableRoomId: firstBuildableRoom(store.getState(), ROOMS)?.id ?? null,
    newestRoomId: store.getState().roomsBuilt.at(-1) ?? null,
    openTab: openTab(),
  });
  return { machine, getGuideContext };
}
