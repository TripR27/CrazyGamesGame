import type { EventBus } from '@/core/events';
import type { GameEvents } from '@/core/game-events';
import type { GameState } from '@/core/state';
import type { Store } from '@/core/store';
import { recipes } from '@/data/recipes';
import { TUTORIAL_STEPS, type TutorialEvent } from '@/data/tutorial';
import { upgrades } from '@/data/upgrades';
import type { BrewStation } from '@/systems/brewing';
import { waitingCustomers, type CustomerFloor } from '@/systems/customers';
import { firstAffordable, generalOnly, seatsOnly, staffOnly } from '@/systems/upgrades';
import { firstBuyableIngredient, type IngredientCatalog } from '@/systems/ingredients';
import { followOpenTab } from './follow-open-tab';
import { createAlreadyHolds } from './tutorial-already-holds';
import { createTutorialMachine, type GuideContext, type ProgressStore, type TutorialMachine } from '@/systems/tutorial';

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
    openTab: openTab(),
  });
  return { machine, getGuideContext };
}
