import { t } from '@/i18n/translator';
import type { RecipeDef } from '@/recipes/recipe-data';
import { withEffectIcon } from '@/serving/effects';
import { textKey } from '@/shared/content';
import type { Bounds } from '@/shared/targets';

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

const pointAt = (customer: { id: number } | undefined): string | null => (customer === undefined ? null : `customer:${customer.id}`);

type AliasResolver = (ctx: GuideContext) => string | null;

/** Folded panel: the button that unfolds it; another tab on screen: that tab. Undefined: the tab is already open. */
const toTab = (ctx: GuideContext, tab: string): string | undefined => {
  if (ctx.openTab === tab) return undefined;
  return ctx.openTab === null ? 'panel-button' : `tab:${tab}`;
};

/** A target inside the shop (`kind:id`, e.g. `upgrade:extra_seat`); the way to the Shop tab first. */
const inShop = (ctx: GuideContext, kind: string, id: string | null): string | null =>
  toTab(ctx, 'shop') ?? (id === null ? null : `${kind}:${id}`);

/** Targets that depend on the game situation. New alias = one more entry (also add it to data/tutorial/targets.ts). */
const ALIASES: Readonly<Record<string, AliasResolver>> = {
  'guide-ingredient': (ctx) => {
    const id = nextIngredient(ctx);
    return id === undefined ? null : `ingredient:${id}`;
  },
  'guide-drink': (ctx) => {
    const slot = readyDrinkSlot(ctx);
    return slot === undefined ? null : `drink:${slot}`;
  },
  'guide-customer': (ctx) => {
    const id = readyCustomerId(ctx);
    return id === undefined ? null : `customer:${id}`;
  },
  'guide-liked': (ctx) => pointAt(likedCustomer(ctx)),
  'guide-vip': (ctx) => pointAt(vipCustomer(ctx)),
  // The way to a tab: unfold the panel first, then pick the tab. Once it is open the step is done by its event.
  'guide-shop': (ctx) => toTab(ctx, 'shop') ?? null,
  'guide-book': (ctx) => toTab(ctx, 'recipes') ?? null,
  // In the shop: the way there first, then the upgrade itself.
  'guide-staff': (ctx) => inShop(ctx, 'upgrade', ctx.affordableStaffId),
  'guide-seats': (ctx) => inShop(ctx, 'upgrade', ctx.affordableSeatsId),
  'guide-upgrade': (ctx) => inShop(ctx, 'upgrade', ctx.affordableUpgradeId),
  'guide-ingredient-buy': (ctx) => inShop(ctx, 'ingredient-buy', ctx.affordableIngredientId),
  'guide-new-ingredient': (ctx) => (ctx.newestIngredientId === null ? null : `ingredient:${ctx.newestIngredientId}`),
  'guide-room-buy': (ctx) => inShop(ctx, 'room-buy', ctx.affordableRoomId),
  'guide-new-room': (ctx) => (ctx.newestRoomId === null ? null : `room:${ctx.newestRoomId}`),
};

/** Turns a step's target into a registry id; fixed targets pass through, aliases are resolved. */
export function resolveTarget(target: string, ctx: GuideContext): string | null {
  const alias = ALIASES[target];
  return alias === undefined ? target : alias(ctx);
}

export const SPOT_PADDING = 10;
const ARROW_SIZE = 34;
/** Targets this close to the top get the arrow below them instead of above. */
const MIN_ROOM_ABOVE = 90;

export function spotlightBounds(target: Bounds): Bounds {
  return {
    x: target.x - SPOT_PADDING,
    y: target.y - SPOT_PADDING,
    w: target.w + SPOT_PADDING * 2,
    h: target.h + SPOT_PADDING * 2,
  };
}

export interface ArrowPlacement {
  x: number;
  y: number;
  /** Which way the arrow points: down when it sits above the target, up when it sits below. */
  points: 'down' | 'up';
}

/** The arrow floats above the target, or below it when there is no room above. */
export function arrowPlacement(target: Bounds): ArrowPlacement {
  const spot = spotlightBounds(target);
  const x = target.x + target.w / 2 - ARROW_SIZE / 2;
  if (spot.y >= MIN_ROOM_ABOVE) return { x, y: spot.y - ARROW_SIZE, points: 'down' };
  return { x, y: spot.y + spot.h, points: 'up' };
}

const name = (domain: 'recipes' | 'ingredients' | 'upgrades', id: string | undefined): string =>
  id === undefined ? '' : t(textKey(domain, id, 'name'));
const upgradeName = (id: string | null): string => (id === null ? t('tutorial.any_upgrade') : name('upgrades', id));

/** The effect of the drink a customer likes: its icon and word, and what it does (only that one effect). */
function likedEffect(ctx: GuideContext): { effect: string; does: string } {
  const recipeId = likedCustomer(ctx)?.recipeId;
  const effect = ctx.knownRecipes.find((r) => r.id === recipeId)?.effect;
  if (effect === undefined) return { effect: '', does: '' };
  return { effect: withEffectIcon(effect, t(`effects.${effect}.short`)), does: t(`effects.${effect}.does`) };
}

/** Words the mascot can use in its lines: the drink, ingredient and upgrade the guide is talking about, and the liked and VIP drinks. */
export function speech(stepId: string, ctx: GuideContext): string {
  return t(textKey('tutorial', stepId, 'text'), {
    drink: name('recipes', guideRecipe(ctx)?.id),
    ingredient: name('ingredients', nextIngredient(ctx)),
    upgrade: upgradeName(ctx.affordableUpgradeId),
    staff: upgradeName(ctx.affordableStaffId),
    liked: name('recipes', likedCustomer(ctx)?.recipeId),
    royal: name('recipes', vipCustomer(ctx)?.recipeId),
    room: ctx.affordableRoomId === null ? '' : t(textKey('rooms', ctx.affordableRoomId, 'name')),
    shopIngredient: name('ingredients', ctx.affordableIngredientId ?? ctx.newestIngredientId ?? undefined),
    ...likedEffect(ctx),
  });
}
