import { likedCustomer, nextIngredient, readyCustomerId, type GuideContext } from './guide';

type AliasResolver = (ctx: GuideContext) => string | null;

const inShop = (ctx: GuideContext, upgradeId: string | null): string | null => {
  if (!ctx.shopOpen) return 'shop-button';
  return upgradeId === null ? null : `upgrade:${upgradeId}`;
};

/** Targets that depend on the game situation. New alias = one more entry (also add it to data/tutorial/targets.ts). */
const ALIASES: Readonly<Record<string, AliasResolver>> = {
  'guide-ingredient': (ctx) => {
    const id = nextIngredient(ctx);
    return id === undefined ? null : `ingredient:${id}`;
  },
  'guide-customer': (ctx) => {
    const id = readyCustomerId(ctx);
    return id === undefined ? null : `customer:${id}`;
  },
  'guide-liked': (ctx) => {
    const customer = likedCustomer(ctx);
    return customer === undefined ? null : `customer:${customer.id}`;
  },
  // Closed shop: point at the button first; open shop: point at the upgrade itself.
  'guide-staff': (ctx) => inShop(ctx, ctx.affordableStaffId),
  'guide-seats': (ctx) => inShop(ctx, ctx.affordableSeatsId),
  'guide-upgrade': (ctx) => (ctx.affordableUpgradeId === null ? null : `upgrade:${ctx.affordableUpgradeId}`),
};

/** Turns a step's target into a registry id; fixed targets pass through, aliases are resolved. */
export function resolveTarget(target: string, ctx: GuideContext): string | null {
  const alias = ALIASES[target];
  return alias === undefined ? target : alias(ctx);
}
