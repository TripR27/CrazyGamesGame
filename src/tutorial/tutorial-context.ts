import type { BrewStation } from '@/brewing/brewing';
import { brewableRecipes, firstBuyableIngredient, type IngredientCatalog } from '@/brewing/ingredients';
import { waitingCustomers, type CustomerFloor } from '@/customers/customers';
import { DECORATIONS, firstBuyableDecor } from '@/decor/decor';
import { upgrades, type UpgradeDef } from '@/economy/upgrade-data';
import { firstAffordable, generalOnly, seatsOnly, staffOnly } from '@/economy/upgrades';
import { quartermasterOffer } from '@/heroes/auto';
import { currentBoss } from '@/heroes/boss-fight';
import { firstBuyableGear, gearToWear } from '@/heroes/gear';
import type { GuildCauldron } from '@/heroes/hero-brewing';
import { anyHeroTravelled, HERO_CLASSES, readyHeroId } from '@/heroes/heroes';
import { boldOption, currentCard } from '@/heroes/trip-cards';
import { canSell, firstAffordableLegacy } from '@/prestige/prestige';
import { recipes } from '@/recipes/recipe-data';
import { levelFor } from '@/reputation/reputation';
import { ROOMS, firstBuildableRoom } from '@/rooms/rooms';
import type { EventBus, GameEvents } from '@/shared/events';
import type { GameState, Store } from '@/shared/state';
import type { Clock } from '@/shared/time';
import { type AlreadyHolds, createTutorialMachine, type ProgressStore, type TutorialMachine } from '@/tutorial/tutorial';
import type { GuideContext } from '@/tutorial/tutorial-guide';
import { type TutorialEvent, TUTORIAL_STEPS } from '@/tutorial/tutorial-steps';

/** Which open/close events belong to which side-panel tab. A new tab is one more entry. */
const TAB_EVENTS = [
  { tab: 'shop', opened: 'shop:opened', closed: 'shop:closed' },
  { tab: 'recipes', opened: 'book:opened', closed: 'book:closed' },
  { tab: 'heroes', opened: 'heroes:opened', closed: 'heroes:closed' },
  { tab: 'legacy', opened: 'legacy:opened', closed: 'legacy:closed' },
  { tab: 'trophies', opened: 'trophies:opened', closed: 'trophies:closed' },
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

/** What the checks may look at: the saved state, the customers, the side-panel tab on screen and the hero cauldron. */
interface World {
  store: Store<GameState>;
  floor: CustomerFloor;
  openTab(): string | null;
  ingredients: IngredientCatalog;
  guild: GuildCauldron;
  clock: Clock;
}

type Check = (world: World) => boolean;

const hasDecor = (state: GameState): boolean => state.decorBought.length > 0;

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
  // An owned decoration counts too: the lesson then shows and is done at once (see decorLesson).
  'decor:affordable': ({ store }) => hasDecor(store.getState()) || firstBuyableDecor(store.getState(), DECORATIONS) !== undefined,
  'decor:bought': ({ store }) => hasDecor(store.getState()),
  'likes:ordered': ({ floor }) => waitingCustomers(floor).some((c) => c.liked),
  'vip:arrived': ({ floor }) => waitingCustomers(floor).some((c) => c.vip),
  'reputation:levelUp': ({ store }) => levelFor(store.getState().reputation) > 1,
  'hero:recruited': ({ store }) => Object.keys(store.getState().heroes).length > 0,
  // A hero who travelled before the hint's turn: the hint shows and is done at once (see heroLesson).
  'hero:departed': ({ store }) => anyHeroTravelled(store.getState()),
  // Loot found before (this session or an earlier one): the dungeon ingredient is on the shelf already.
  'hero:returned': ({ store }) => Object.keys(store.getState().ingredientStock).length > 0,
  // Owned gear counts too: the gear lesson then shows and its steps are done at once (see gearLesson).
  'gear:affordable': ({ store }) => store.getState().gearOwned.length > 0 || firstBuyableGear(store.getState()) !== undefined,
  'gear:bought': ({ store }) => store.getState().gearOwned.length > 0,
  'gear:equipped': ({ store }) => Object.values(store.getState().heroes).some((h) => Object.keys(h.gear).length > 0),
  'guild:aimed': ({ guild }) => guild.aimed,
  // A hero with a drink in the bag or on a trip with one: the first hero drink is done already.
  'hero:drink': ({ store }) => Object.values(store.getState().heroes).some((h) => h.bag.length > 0 || (h.expedition?.drinks.length ?? 0) > 0),
  'card:opened': ({ store, clock }) => currentCard(store.getState(), clock.now()) !== undefined,
  'boss:opened': ({ store, clock }) => currentBoss(store.getState(), clock.now()) !== undefined,
  // Bought before the lesson's turn, or a hero on Auto already: the lesson shows and its steps are done at once.
  'quartermaster:affordable': ({ store }) => store.getState().quartermaster || quartermasterOffer(store.getState()).affordable,
  'quartermaster:bought': ({ store }) => store.getState().quartermaster,
  'hero:auto': ({ store }) => Object.values(store.getState().heroes).some((h) => h.auto),
  // A tavern sold before: the prestige lesson shows and its first step is done at once.
  'prestige:available': ({ store }) => store.getState().prestige.runs > 0 || canSell(store.getState()),
  'prestige:done': ({ store }) => store.getState().prestige.runs > 0,
  'legacy:bought': ({ store }) => Object.values(store.getState().prestige.legacy).some((level) => level > 0),
  'achievement:unlocked': ({ store }) => store.getState().achievements.length > 0,
  'trophies:opened': ({ openTab }) => openTab() === 'trophies',
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
  clock: Clock;
  ingredients: IngredientCatalog;
  guild: GuildCauldron;
}

export interface TutorialServices {
  machine: TutorialMachine;
  getGuideContext(): GuideContext;
}

/** The next ingredient for a drink in the hero cauldron: a known drink that fits what is in it, one without dungeon stock first. */
function heroDrinkIngredient(state: GameState, catalog: IngredientCatalog, guild: GuildCauldron): string | null {
  const contents = guild.station.contents;
  const fits = brewableRecipes(state, catalog).filter((r) => contents.every((id) => r.ingredients.includes(id)));
  const recipe = fits.find((r) => r.ingredients.every((id) => catalog.ingredients.find((i) => i.id === id)?.source === 'shop')) ?? fits[0];
  return recipe?.ingredients.find((id) => !contents.includes(id)) ?? null;
}

/** The open choice card and its bold option, for the card lesson. */
function openCardHint(state: GameState, now: number): { heroId: string; boldOptionId: string } | null {
  const open = currentCard(state, now);
  const bold = open === undefined ? undefined : boldOption(open.trip, open.card);
  return open === undefined || bold === undefined ? null : { heroId: open.heroId, boldOptionId: bold.id };
}

/** Every game event any step listens to, once each. */
function listenedEvents(): TutorialEvent[] {
  const events = TUTORIAL_STEPS.flatMap((s) => [s.startWhen?.event, s.completeOn.kind === 'event' ? s.completeOn.event : undefined]);
  return [...new Set(events.filter((e): e is TutorialEvent => e !== undefined))];
}

/** Connects the tutorial machine to the saved state and the game bus. */
export function createTutorial({ store, bus, floor, station, clock, ingredients, guild }: TutorialDeps): TutorialServices {
  const progress: ProgressStore = {
    get: () => store.getState().tutorial,
    update: (mutator) => store.update((state) => mutator(state.tutorial)),
  };
  const affordable = (): string | null => firstAffordable(store.getState(), generalOnly(upgrades))?.id ?? null;
  const affordableSeats = (): string | null => firstAffordable(store.getState(), seatsOnly(upgrades))?.id ?? null;
  const affordableStaff = (): string | null => firstAffordable(store.getState(), staffOnly(upgrades))?.id ?? null;
  const openTab = followOpenTab(bus);
  const machine = createTutorialMachine(TUTORIAL_STEPS, progress, createAlreadyHolds({ store, floor, openTab, ingredients, guild, clock }));

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
    affordableDecorId: firstBuyableDecor(store.getState(), DECORATIONS)?.id ?? null,
    newestDecorId: store.getState().decorBought.at(-1) ?? null,
    readyHeroId: readyHeroId(store.getState(), clock.now()) ?? null,
    lootId: Object.keys(store.getState().ingredientStock)[0] ?? null,
    affordableGearId: firstBuyableGear(store.getState())?.id ?? null,
    gearToWear: gearToWear(store.getState()),
    heroDrinkIngredient: heroDrinkIngredient(store.getState(), ingredients, guild),
    card: openCardHint(store.getState(), clock.now()),
    bossHeroId: currentBoss(store.getState(), clock.now())?.heroId ?? null,
    affordableLegacyId: firstAffordableLegacy(store.getState().prestige)?.id ?? null,
    autoHeroId: HERO_CLASSES.find((def) => store.getState().heroes[def.id]?.auto === false)?.id ?? null,
    openTab: openTab(),
  });
  return { machine, getGuideContext };
}
