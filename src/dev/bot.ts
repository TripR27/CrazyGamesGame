import type { World } from '@/app/world';
import { clickIngredient } from '@/brewing/brewing';
import { brewableRecipes, buyIngredientById, firstBuyableIngredient, usesStock } from '@/brewing/ingredients';
import { waitingCustomers } from '@/customers/customers';
import { DECORATIONS, buyDecorById, firstBuyableDecor } from '@/decor/decor';
import { upgrades } from '@/economy/upgrade-data';
import { buyUpgradeById, quoteFor } from '@/economy/upgrades';
import { sendHero } from '@/heroes/expedition';
import { buyGearById, equipGear, firstBuyableGear, gearToWear } from '@/heroes/gear';
import { aimHeroCauldron, clickShelf, drinkTaker } from '@/heroes/hero-brewing';
import { HERO_CLASSES, HEROES, hireHeroById, hireOffer, readyHeroId } from '@/heroes/heroes';
import { boldOption, currentCard, decideCard } from '@/heroes/trip-cards';
import type { RecipeDef } from '@/recipes/recipe-data';
import { discoverableNow } from '@/recipes/recipes';
import { ROOMS, buildRoomById, firstBuildableRoom, roomOffer } from '@/rooms/rooms';
import { clickCustomer } from '@/serving/serving';
import { num, type Num } from '@/shared/numbers';
import type { GameState } from '@/shared/state';

/**
 * The simulated player of the balance simulator: one mouse action per call. It serves, brews (new recipes first), plays
 * the heroes (cards, hero drinks, trips) and shops like a sensible player.
 */

/** While saving for a room, the bot still buys upgrades that cost less than this share of the room. */
const SAVING_SHARE = 0.1;

/** The cheapest upgrade the bot may buy now, at most `limit` gold. */
function cheapestUpgrade(state: GameState, limit: Num): string | undefined {
  const deals = upgrades.map((def) => ({ def, deal: quoteFor(state, def, 1) })).filter(({ deal }) => deal.affordable && deal.cost.lte(limit));
  return deals.sort((a, b) => a.deal.cost.cmp(b.deal.cost))[0]?.def.id;
}

/** How much the bot may spend on an upgrade: everything, or a small share while a room is for sale (it saves up). */
function upgradeBudget(state: GameState): Num {
  const saving = ROOMS.map((room) => roomOffer(state, room)).find((offer) => offer.status === 'forSale');
  return saving === undefined ? state.currencies.gold : saving.cost.mul(SAVING_SHARE);
}

/**
 * One purchase like a sensible player: a new ingredient first (new recipes to try), then a room it can afford,
 * then a hero to hire, gear, a decoration and otherwise the cheapest upgrade, but while a room is for sale it saves up
 * for it (it only buys what costs a small share of the room). Returns true when it bought something.
 */
export function shopOnce(world: World, state: GameState): boolean {
  const ingredient = firstBuyableIngredient(state, world.content);
  if (ingredient !== undefined) {
    buyIngredientById(world, ingredient.id);
    return true;
  }
  const room = firstBuildableRoom(state, ROOMS);
  if (room !== undefined) {
    buildRoomById(world, room.id);
    return true;
  }
  const budget = upgradeBudget(state);
  const hero = HERO_CLASSES.find((def) => {
    const offer = hireOffer(state, def);
    return offer.affordable && offer.cost.lte(budget);
  });
  if (hero !== undefined) {
    hireHeroById(world, hero.id);
    return true;
  }
  const gear = firstBuyableGear(state);
  if (gear !== undefined && num(gear.buy?.cost ?? 0).lte(budget)) {
    buyGearById(world, gear.id);
    return true;
  }
  const decor = firstBuyableDecor(state, DECORATIONS);
  if (decor !== undefined && num(decor.buy.cost).lte(budget)) {
    buyDecorById(world, decor.id);
    return true;
  }
  const upgrade = cheapestUpgrade(state, budget);
  if (upgrade !== undefined) buyUpgradeById(world, upgrade, 1);
  return upgrade !== undefined;
}

export interface BotOptions {
  /** Shop: ingredients, rooms (saving up for them), decorations and the cheapest upgrade, one purchase at a time (sim/shopping.ts). */
  buys: boolean;
}

/** A simulated player: one mouse action per call, like a quick but not superhuman player. */
export interface Bot {
  act(): void;
}

const fits = (contents: readonly string[], r: RecipeDef): boolean => contents.every((id) => r.ingredients.includes(id));

/** What to brew next: a recipe to discover first (players try new ones soon), then what a waiting customer wants. */
function targetRecipe(world: World, state: GameState): RecipeDef | undefined {
  const { station, floor } = world;
  // Drinks with a dungeon ingredient only while it is in stock.
  const known = brewableRecipes(state, world.content);
  const wanted = waitingCustomers(floor)
    .map((c) => known.find((r) => r.id === c.recipeId))
    .filter((r): r is RecipeDef => r !== undefined && !station.ready.includes(r.id));
  const options = [...discoverableNow(world), ...wanted];
  return options.find((r) => fits(station.contents, r));
}

/** The drink the bot brews for heroes: a luck drink without dungeon ingredients (more loot), else any such drink. */
function heroDrink(world: World, state: GameState): RecipeDef | undefined {
  const plain = brewableRecipes(state, world.content).filter((r) => !usesStock(r, world.content.ingredients));
  return plain.find((r) => r.effect === 'luck') ?? plain[0];
}

/** Takes the bold option of an open card, or fills the hero cauldron for a hero at home with room in the bag (one click). */
function playHeroes(world: World, state: GameState): boolean {
  const open = currentCard(state, world.clock.now());
  const bold = open === undefined ? undefined : boldOption(open.trip, open.card);
  if (open !== undefined && bold !== undefined) {
    decideCard(world, open.heroId, bold.id);
    return true;
  }
  const { guild } = world;
  const recipe = heroDrink(world, state);
  if (recipe === undefined || guild.station.brewing !== null || guild.station.ready.length > 0) return false;
  if (drinkTaker(state, world.clock.now()) === undefined) return false;
  if (!guild.aimed) {
    aimHeroCauldron(world);
    return true;
  }
  const next = recipe.ingredients.find((id) => !guild.station.contents.includes(id));
  if (next !== undefined) clickShelf(world, next);
  return next !== undefined;
}

/** Puts on a piece nobody wears, or sends a hero who is home, fit and has a full bag to the swamp (one click). */
function sendReadyHero(world: World, state: GameState): boolean {
  const wear = gearToWear(state);
  if (wear !== null) {
    equipGear(world, wear.heroId, wear.slot, wear.gearId);
    return true;
  }
  const id = readyHeroId(state, world.clock.now());
  const full = (state.heroes[id ?? '']?.bag.length ?? 0) >= HEROES.bagSize;
  if (id === undefined || (!full && heroDrink(world, state) !== undefined)) return false;
  sendHero(world, id);
  return true;
}

function serveReady(world: World): boolean {
  const { floor, station } = world;
  const customer = waitingCustomers(floor).find((c) => station.ready.includes(c.recipeId));
  if (customer === undefined) return false;
  clickCustomer(world, customer.id);
  return true;
}

function brewNext(world: World, state: GameState): boolean {
  const { station } = world;
  if (station.brewing !== null || station.ready.length >= station.capacity) return false;
  const next = targetRecipe(world, state)?.ingredients.find((id) => !station.contents.includes(id));
  if (next === undefined) return false;
  clickIngredient(world, next);
  return true;
}

export function createBot(world: World, options: BotOptions): Bot {
  const { store } = world;
  return {
    act() {
      const state = store.getState();
      if (serveReady(world) || brewNext(world, state) || playHeroes(world, state) || sendReadyHero(world, state)) return;
      if (options.buys) shopOnce(world, state);
    },
  };
}
