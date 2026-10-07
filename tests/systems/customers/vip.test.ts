import { describe, expect, it } from 'vitest';
import { catalog as fixtureCatalog, economy, floorWith, station } from '../fixtures';
import { catalog, context, newFloor, patientCatalog, run } from './helpers';
import type { CustomerDef } from '@/data/customers/types';
import { VIP_SPAWN } from '@/data/customers/vip';
import { createSeededRng } from '@/shared/random';
import { pickCustomerType, priciestRecipe } from '@/systems/customers/pick-type';
import { serveCustomer } from '@/systems/serving/serve';

const regular: CustomerDef = { id: 'regular', minLevel: 1, patienceSeconds: 60, spendMultiplier: 1, likes: [] };
const king: CustomerDef = { id: 'king', minLevel: 3, patienceSeconds: 30, spendMultiplier: 3, likes: [], vip: true, reputationBonus: 3 };

describe('VIP customers', () => {
  it('never come before their level', () => {
    const rng = createSeededRng(2);
    const picks = Array.from({ length: 500 }, () => pickCustomerType(rng, [regular, king], 2));
    expect(picks.every((p) => p === regular)).toBe(true);
  });

  it('come now and then once their level is reached', () => {
    const rng = createSeededRng(2);
    const picks = Array.from({ length: 4000 }, () => pickCustomerType(rng, [regular, king], 3));
    const share = picks.filter((p) => p === king).length / picks.length;
    expect(share).toBeGreaterThan(VIP_SPAWN.chance * 0.7);
    expect(share).toBeLessThan(VIP_SPAWN.chance * 1.3);
  });

  it('order the most expensive drink the player knows', () => {
    expect(priciestRecipe(fixtureCatalog.recipes)?.id).toBe('cde');
    expect(priciestRecipe([])).toBeUndefined();
    const vipCatalog = { ...patientCatalog, customerTypes: [{ ...king, minLevel: 1 }] };
    const pricey = { ...catalog.recipes[2]!, basePrice: 99 };
    const floor = newFloor(3);
    run(floor, context({ unlockedRecipeIds: ['r1', 'r2', 'r3'] }), 60_000, undefined, {
      ...vipCatalog,
      recipes: [catalog.recipes[0]!, catalog.recipes[1]!, pricey],
    });
    expect(floor.customers.length).toBeGreaterThan(0);
    expect(floor.customers.every((c) => c.vip && c.recipeId === 'r3')).toBe(true);
  });

  it('pay their price and bring their own reputation bonus', () => {
    const floor = floorWith(['king', 'ab']);
    floor.customers[0]!.vip = true;
    const s = station();
    s.ready.push('ab');
    const eco = economy();
    const deps = { floor, station: s, economy: eco, catalog: { ...fixtureCatalog, customerTypes: [king] }, rng: () => 0.5 };
    const outcome = serveCustomer(deps, 1);
    expect(eco.getState().currencies.gold.toNumber()).toBe(30); // 10 x 3
    expect(eco.getState().reputation).toBe(1 + 3);
    expect(outcome).toMatchObject({ kind: 'served', event: { vip: true, extraReputation: 3 } });
  });
});
