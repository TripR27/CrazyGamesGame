import type { World } from '@/app/world';
import type { UpgradeEffect } from '@/economy/upgrade-data';
import type { OneTimePurchase } from '@/shared/content';
import type { EventBus, GameEvents } from '@/shared/events';
import { oneTimeOffer, type OneTimeOffer, watchBuyable, type WatchSource } from '@/shared/purchases';
import type { GameState } from '@/shared/state';

/**
 * A decoration downstairs (a torch, a rug, a trophy), bought once in the shop: a gold sink with a small bonus on the
 * same stats upgrades use, counted once it is bought. Texts: `decor.<id>.name` and `decor.<id>.description`
 * (the effect amounts filled in). The scene draws it at its spot in app/layout.ts.
 */
export interface DecorDef {
  id: string;
  buy: OneTimePurchase;
  effects: readonly UpgradeEffect[];
}

/** All decorations in shop order. Placeholder prices: tuned with `npm run simulate`. A new one is data here, a spot, a drawing and its texts. */
export const DECORATIONS: readonly DecorDef[] = [
  { id: 'wall_torch', buy: { level: 2, cost: 300 }, effects: [{ stat: 'sellPrice', mode: 'multiply', perLevel: 0.03 }] },
  { id: 'woven_rug', buy: { level: 3, cost: 1000 }, effects: [{ stat: 'brewSpeed', mode: 'multiply', perLevel: 0.05 }] },
  { id: 'boar_trophy', buy: { level: 3, cost: 2500 }, effects: [{ stat: 'sellPrice', mode: 'multiply', perLevel: 0.04 }] },
  { id: 'everburning_torch', buy: { level: 4, cost: 6000 }, effects: [{ stat: 'brewSpeed', mode: 'multiply', perLevel: 0.05 }] },
  { id: 'royal_carpet', buy: { level: 5, cost: 20_000 }, effects: [{ stat: 'vipChance', mode: 'multiply', perLevel: 0.25 }] },
  { id: 'golden_tankard', buy: { level: 6, cost: 60_000 }, effects: [{ stat: 'sellPrice', mode: 'multiply', perLevel: 0.08 }] },
];

/** The part of the state decorations read and change. */
export type DecorState = Pick<GameState, 'reputation' | 'currencies' | 'decorBought'>;

export const decorOffer = (state: DecorState, def: DecorDef): OneTimeOffer => oneTimeOffer(def.buy, state.decorBought.includes(def.id), state);

/** The first decoration the player can buy right now, or undefined. */
export const firstBuyableDecor = (state: DecorState, defs: readonly DecorDef[]): DecorDef | undefined =>
  defs.find((def) => decorOffer(state, def).affordable);

/** Publishes `decor:affordable` each time a decoration becomes buyable. Returns a stop function. */
export function watchDecorShop(source: WatchSource<DecorState>, bus: EventBus<GameEvents>, defs: readonly DecorDef[]): () => void {
  return watchBuyable(source, bus, (state) => firstBuyableDecor(state, defs) !== undefined, 'decor:affordable');
}

/** Buy a decoration (one time); does nothing when it is locked, bought or too expensive. */
export function buyDecorById({ bus, store, content }: Pick<World, 'bus' | 'store' | 'content'>, id: string): void {
  const def = content.decor.find((d) => d.id === id);
  const offer = def === undefined ? undefined : decorOffer(store.getState(), def);
  if (def === undefined || offer?.affordable !== true) return;
  store.update((state) => {
    state.currencies.gold = state.currencies.gold.sub(offer.cost);
    state.decorBought.push(def.id);
  });
  bus.emit('decor:bought', { id: def.id });
  bus.emit('saveRequested', {});
}
