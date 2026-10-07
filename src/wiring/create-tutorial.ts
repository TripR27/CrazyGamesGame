import { recipes } from '@/data/recipes/index';
import { ROOMS } from '@/data/rooms/index';
import { TUTORIAL_STEPS } from '@/data/tutorial/index';
import type { TutorialEvent } from '@/data/tutorial/types';
import { upgrades } from '@/data/upgrades/index';
import type { EventBus, GameEvents } from '@/shared/events';
import type { GameState, Store } from '@/shared/state';
import type { BrewStation } from '@/systems/brewing/types';
import { waitingCustomers } from '@/systems/customers/floor';
import type { CustomerFloor } from '@/systems/customers/types';
import { firstBuyableIngredient, type IngredientCatalog } from '@/systems/ingredients/offer';
import { firstBuildableRoom } from '@/systems/rooms/offer';
import type { GuideContext } from '@/systems/tutorial/guide';
import { createTutorialMachine } from '@/systems/tutorial/machine';
import type { ProgressStore, TutorialMachine } from '@/systems/tutorial/types';
import { firstAffordable } from '@/systems/upgrades/affordable';
import { generalOnly, seatsOnly, staffOnly } from '@/systems/upgrades/groups';
import { followOpenTab } from '@/wiring/follow-open-tab';
import { createAlreadyHolds } from '@/wiring/tutorial-already-holds';

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
