import { createSeededRng } from '@/core/rng';
import type { CustomerDef } from '@/data/customers';
import type { RecipeDef } from '@/data/recipes';
import { SPAWNING } from '@/data/customers/spawning';
import {
  createFloor,
  updateCustomers,
  type CustomerCatalog,
  type CustomerChange,
  type CustomerContext,
  type CustomerFloor,
} from '@/systems/customers';

const customer = (id: string, minLevel: number, patienceSeconds: number): CustomerDef => ({
  id, minLevel, patienceSeconds, spendMultiplier: 1, likes: [],
});
const recipe = (id: string): RecipeDef => ({
  id, tier: 1, rarity: 'common', ingredients: ['a', 'b'], brewSeconds: 3, basePrice: 5, effect: 'luck',
});

export const catalog: CustomerCatalog = {
  customerTypes: [customer('plain', 1, 20), customer('fancy', 2, 30), customer('royal', 4, 40)],
  recipes: [recipe('r1'), recipe('r2'), recipe('r3')],
};

/** Same content, but customers wait (practically) forever, so only seats limit who is in the tavern. */
export const patientCatalog: CustomerCatalog = {
  ...catalog,
  customerTypes: catalog.customerTypes.map((c) => ({ ...c, patienceSeconds: 100_000 })),
};

export const context = (over: Partial<CustomerContext> = {}): CustomerContext => ({
  reputation: 0,
  unlockedRecipeIds: ['r1', 'r2'],
  maxCustomers: Infinity,
  freezePatience: false,
  ...over,
});

export const STEP_MS = 100;

/** Run steps until `ms` of game time has passed; returns every change that happened. */
export function run(
  floor: CustomerFloor,
  ctx: CustomerContext,
  ms: number,
  rng = createSeededRng(1),
  cat: CustomerCatalog = catalog,
): CustomerChange[] {
  const changes: CustomerChange[] = [];
  for (let t = 0; t < ms; t += STEP_MS) changes.push(...updateCustomers(floor, ctx, cat, rng, STEP_MS));
  return changes;
}

export const newFloor = (capacity = 7): CustomerFloor => createFloor(capacity);
export const FIRST_DELAY = SPAWNING.firstDelayMs;
