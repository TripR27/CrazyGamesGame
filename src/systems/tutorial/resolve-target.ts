import { likedCustomer, nextIngredient, readyCustomerId, readyDrinkSlot, vipCustomer, type GuideContext } from './guide';

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
};

/** Turns a step's target into a registry id; fixed targets pass through, aliases are resolved. */
export function resolveTarget(target: string, ctx: GuideContext): string | null {
  const alias = ALIASES[target];
  return alias === undefined ? target : alias(ctx);
}
