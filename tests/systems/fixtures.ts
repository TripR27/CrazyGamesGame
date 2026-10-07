import type { CustomerDef } from '@/data/customers/types';
import type { RecipeDef } from '@/data/recipes/types';
import type { UpgradeDef } from '@/data/upgrades/types';
import { num, ONE } from '@/shared/numbers';
import { createSeededRng } from '@/shared/random';
import { createStore } from '@/shared/state';
import { createStation } from '@/systems/brewing/station';
import { createFloor } from '@/systems/customers/floor';
import type { CustomerCatalog, CustomerFloor } from '@/systems/customers/types';
import type { EconomyState } from '@/systems/serving/types';
import type { UpgradeState } from '@/systems/upgrades/buy';

// Speed only changes how long a customer drinks, so prices in these tests stay plain.
const recipe = (id: string, ingredients: RecipeDef['ingredients'], brewSeconds: number, basePrice: number): RecipeDef => ({
  id, tier: 1, rarity: 'common', ingredients, brewSeconds, basePrice, effect: 'speed',
});

/** Two small recipes: ab (2 ingredients, 2 s, 10 gold) and cde (3 ingredients, 3 s, 30 gold). */
export const ab = recipe('ab', ['a', 'b'], 2, 10);
export const cde = recipe('cde', ['c', 'd', 'e'], 3, 30);
export const recipes: readonly RecipeDef[] = [ab, cde];

export const plain: CustomerDef = { id: 'plain', minLevel: 1, patienceSeconds: 60, spendMultiplier: 1, likes: [] };
export const rich: CustomerDef = { id: 'rich', minLevel: 1, patienceSeconds: 60, spendMultiplier: 1.5, likes: [] };
export const catalog: CustomerCatalog = { customerTypes: [plain, rich], recipes };

export const rng = () => createSeededRng(1);
export const station = (capacity = 3) => createStation(capacity);

/** Price upgrade: costs 10, 20, 40 and sells 50% more per level, up to level 3. */
export const priceUp: UpgradeDef = {
  id: 'price_up', kind: 'tavern', baseCost: 10, growth: 2,
  effect: { stat: 'sellPrice', mode: 'multiply', perLevel: 0.5 }, maxLevel: 3,
};
export const upgradeDefs: readonly UpgradeDef[] = [priceUp];

export function economy(gold = 0) {
  return createStore<EconomyState & UpgradeState>({ currencies: { gold: num(gold) }, reputation: 0, upgrades: {} });
}

/** Everything `createPlayerActions` needs besides the game objects: no upgrades bought, price factor 1. */
export const noUpgrades = { upgradeDefs, getSellMultiplier: () => ONE };

/** A floor with customers already seated: one `[typeId, recipeId]` pair per seat. */
export function floorWith(...orders: Array<[string, string]>): CustomerFloor {
  const floor = createFloor(7);
  orders.forEach(([typeId, recipeId], seat) => {
    floor.customers.push({ id: floor.nextId++, typeId, recipeId, seat, patienceMs: 60_000, patienceMaxMs: 60_000, liked: false, vip: false });
  });
  return floor;
}
