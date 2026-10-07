import type { UpgradeDef } from '@/data/upgrades/types';
import type { Num } from '@/shared/numbers';
import type { UpgradeLevels } from '@/shared/state';
import { levelOf, levelsLeft } from '@/systems/upgrades/level';
import { quote, type BuyAmount, type Quote } from '@/systems/upgrades/quote';

/** The part of the game state that buying changes (interface segregation: not the whole state). */
export interface UpgradeState {
  currencies: { gold: Num };
  upgrades: UpgradeLevels;
}

export interface UpgradeStore {
  getState(): UpgradeState;
  update(mutator: (state: UpgradeState) => void): void;
}

/** Quote for an upgrade against the current state. */
export function quoteFor(state: UpgradeState, def: UpgradeDef, amount: BuyAmount): Quote {
  return quote(def, levelOf(state.upgrades, def), state.currencies.gold, amount, levelsLeft(state.upgrades, def));
}

/** Buys what `quoteFor` promised. Returns the number of levels bought (0 when it cannot be afforded). */
export function buyUpgrade(store: UpgradeStore, def: UpgradeDef, amount: BuyAmount): number {
  const deal = quoteFor(store.getState(), def, amount);
  if (!deal.affordable) return 0;
  store.update((state) => {
    state.currencies.gold = state.currencies.gold.sub(deal.cost);
    state.upgrades[def.id] = levelOf(state.upgrades, def) + deal.count;
  });
  return deal.count;
}
