import { createSeededRng } from '@/core/rng';
import { num } from '@/core/numbers';
import { createStore } from '@/core/store';
import type { CustomerDef } from '@/data/customers';
import type { RecipeDef } from '@/data/recipes';
import { createStation } from '@/systems/brewing';
import { createFloor, type CustomerCatalog, type CustomerFloor } from '@/systems/customers';
import type { EconomyState } from '@/systems/serving';

const recipe = (id: string, ingredients: RecipeDef['ingredients'], brewSeconds: number, basePrice: number): RecipeDef => ({
  id, tier: 1, rarity: 'common', ingredients, brewSeconds, basePrice, effect: 'luck',
});

/** Two small recipes: ab (2 ingredients, 2 s, 10 gold) and cde (3 ingredients, 3 s, 30 gold). */
export const ab = recipe('ab', ['a', 'b'], 2, 10);
export const cde = recipe('cde', ['c', 'd', 'e'], 3, 30);
export const recipes: readonly RecipeDef[] = [ab, cde];

export const plain: CustomerDef = { id: 'plain', minReputation: 0, patienceSeconds: 60, spendMultiplier: 1, likes: [] };
export const rich: CustomerDef = { id: 'rich', minReputation: 0, patienceSeconds: 60, spendMultiplier: 1.5, likes: [] };
export const catalog: CustomerCatalog = { customerTypes: [plain, rich], recipes };

export const rng = () => createSeededRng(1);
export const station = (capacity = 3) => createStation(capacity);

export function economy() {
  return createStore<EconomyState>({ currencies: { gold: num(0) }, reputation: 0 });
}

/** A floor with customers already seated: one `[typeId, recipeId]` pair per seat. */
export function floorWith(...orders: Array<[string, string]>): CustomerFloor {
  const floor = createFloor(7);
  orders.forEach(([typeId, recipeId], seat) => {
    floor.customers.push({ id: floor.nextId++, typeId, recipeId, seat, patienceMs: 60_000, patienceMaxMs: 60_000 });
  });
  return floor;
}
