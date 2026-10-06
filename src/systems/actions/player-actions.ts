import type { EventBus } from '@/core/events';
import type { GameEvents } from '@/core/game-events';
import type { Num } from '@/core/numbers';
import type { Rng } from '@/core/rng';
import type { UpgradeDef } from '@/data/upgrades';
import { addIngredient, emptyCauldron, publishBrewEvent, type BrewStation } from '@/systems/brewing';
import type { CustomerCatalog, CustomerFloor } from '@/systems/customers';
import { serveAndPublish, type EconomyStore } from '@/systems/serving';
import { buyUpgrade, type BuyAmount, type UpgradeStore } from '@/systems/upgrades';

/** Everything the player can do with the mouse. The scene calls these and never touches game rules. */
export interface PlayerActions {
  clickIngredient(ingredientId: string): void;
  clickCauldron(): void;
  clickCustomer(customerId: number): void;
  /** Buy levels of an upgrade; does nothing when it cannot be afforded. */
  buyUpgrade(upgradeId: string, amount: BuyAmount): void;
  /** The shop panel was opened. Announced so the tutorial can follow along. */
  openShop(): void;
  closeShop(): void;
}

export interface PlayerActionDeps {
  bus: EventBus<GameEvents>;
  station: BrewStation;
  floor: CustomerFloor;
  economy: EconomyStore;
  catalog: CustomerCatalog;
  rng: Rng;
  upgradeStore: UpgradeStore;
  upgradeDefs: readonly UpgradeDef[];
  /** Read fresh on every serve, so a bought price upgrade counts at once. */
  getSellMultiplier(): Num;
  /** Read fresh on every click, so a newly discovered recipe works immediately. */
  getKnownRecipeIds(): readonly string[];
}

export function createPlayerActions(deps: PlayerActionDeps): PlayerActions {
  const { bus, station, floor, economy, catalog, rng } = deps;
  return {
    clickIngredient(ingredientId) {
      bus.emit('ingredient:clicked', { id: ingredientId });
      const known = catalog.recipes.filter((r) => deps.getKnownRecipeIds().includes(r.id));
      for (const event of addIngredient(station, ingredientId, known, rng)) publishBrewEvent(bus, event);
    },
    clickCauldron() {
      emptyCauldron(station);
    },
    clickCustomer(customerId) {
      serveAndPublish({ bus, floor, station, economy, catalog, rng, getSellMultiplier: deps.getSellMultiplier }, customerId);
    },
    buyUpgrade(upgradeId, amount) {
      const def = deps.upgradeDefs.find((u) => u.id === upgradeId);
      const count = def === undefined ? 0 : buyUpgrade(deps.upgradeStore, def, amount);
      if (def === undefined || count === 0) return;
      bus.emit('upgrade:bought', { id: def.id, count });
      if (def.kind === 'staff') bus.emit('staff:hired', { id: def.id });
      if (def.effect.stat === 'seats') bus.emit('seats:bought', { id: def.id });
      bus.emit('saveRequested', {});
    },
    openShop() {
      bus.emit('shop:opened', {});
    },
    closeShop() {
      bus.emit('shop:closed', {});
    },
  };
}
