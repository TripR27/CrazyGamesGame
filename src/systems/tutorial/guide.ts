import type { RecipeDef } from '@/data/recipes';

/** What the guide needs to know about the game right now (interface segregation: no full state). */
export interface GuideContext {
  knownRecipes: readonly RecipeDef[];
  /** Ingredient ids in the cauldron. */
  contents: readonly string[];
  brewingRecipeId: string | null;
  readyRecipeIds: readonly string[];
  /** Waiting customers, oldest first. `liked`: they like the effect of what they ordered. */
  customers: readonly { id: number; recipeId: string; liked: boolean; vip: boolean }[];
  /** The first upgrade the player can pay for right now, if any. */
  affordableUpgradeId: string | null;
  /** The first seat upgrade the player can pay for right now, if any. */
  affordableSeatsId: string | null;
  /** The first staff upgrade (hire or training) the player can pay for right now, if any. */
  affordableStaffId: string | null;
  /** The first ingredient the player can buy in the shop right now, and the one bought last, if any. */
  affordableIngredientId: string | null;
  newestIngredientId: string | null;
  /** The first room the player can build right now, and the one built last, if any. */
  affordableRoomId: string | null;
  newestRoomId: string | null;
  /** The side-panel tab on screen ('shop', 'recipes'), or null while the panel is folded away. */
  openTab: string | null;
}

/**
 * The drink the tutorial talks about: what is brewing or ready, otherwise a drink that fits what is
 * already in the cauldron, preferring what the oldest waiting customer ordered.
 */
export function guideRecipe(ctx: GuideContext): RecipeDef | undefined {
  const known = (id: string | undefined): RecipeDef | undefined => ctx.knownRecipes.find((r) => r.id === id);
  const inProgress = known(ctx.brewingRecipeId ?? ctx.readyRecipeIds[0]);
  if (inProgress !== undefined) return inProgress;

  const fits = ctx.knownRecipes.filter((r) => ctx.contents.every((id) => r.ingredients.includes(id)));
  const wanted = ctx.customers.map((c) => fits.find((r) => r.id === c.recipeId)).find((r) => r !== undefined);
  return wanted ?? fits[0];
}

/** The ingredient the player should add next to finish the guide drink. */
export function nextIngredient(ctx: GuideContext): string | undefined {
  return guideRecipe(ctx)?.ingredients.find((id) => !ctx.contents.includes(id));
}

/** The oldest waiting customer who ordered a drink they like. */
export function likedCustomer(ctx: GuideContext): { id: number; recipeId: string } | undefined {
  return ctx.customers.find((c) => c.liked);
}

/** The oldest waiting VIP. */
export function vipCustomer(ctx: GuideContext): { id: number; recipeId: string } | undefined {
  return ctx.customers.find((c) => c.vip);
}

/** The oldest waiting customer whose drink is ready on the bar. */
export function readyCustomerId(ctx: GuideContext): number | undefined {
  return ctx.customers.find((c) => ctx.readyRecipeIds.includes(c.recipeId))?.id;
}

/** The bar slot of the drink the oldest customer with a ready drink is waiting for (the first such drink on the bar). */
export function readyDrinkSlot(ctx: GuideContext): number | undefined {
  const id = ctx.customers.find((c) => ctx.readyRecipeIds.includes(c.recipeId))?.recipeId;
  return id === undefined ? undefined : ctx.readyRecipeIds.indexOf(id);
}
