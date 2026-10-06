import type { Num } from '@/core/numbers';
import type { GameState } from '@/core/state';
import { ROOMS } from '@/data/rooms';
import { upgrades } from '@/data/upgrades';
import { firstBuyableIngredient } from '@/systems/ingredients';
import { firstBuildableRoom, roomOffer } from '@/systems/rooms';
import { quoteFor } from '@/systems/upgrades';
import type { GameWorld } from '@/wiring/create-services';
import type { IngredientShelf } from '@/wiring/ingredient-shelf';

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
 * then the cheapest upgrade, but while a room is for sale it saves up for it. Returns true when it bought something.
 */
export function shopOnce(world: GameWorld, state: GameState, shelf: IngredientShelf): boolean {
  const { actions } = world.scene;
  const ingredient = firstBuyableIngredient(state, shelf.catalog);
  if (ingredient !== undefined) {
    actions.buyIngredient(ingredient.id);
    return true;
  }
  const room = firstBuildableRoom(state, ROOMS);
  if (room !== undefined) {
    actions.buildRoom(room.id);
    return true;
  }
  const upgrade = cheapestUpgrade(state, upgradeBudget(state));
  if (upgrade !== undefined) actions.buyUpgrade(upgrade, 1);
  return upgrade !== undefined;
}
