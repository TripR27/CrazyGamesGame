import { describe, expect, it, vi } from 'vitest';
import { economy, priceUp, upgradeDefs } from '../fixtures';
import { createEventBus, type GameEvents } from '@/shared/events';
import { firstAffordable, watchAffordable } from '@/systems/upgrades/affordable';
import { buyUpgrade } from '@/systems/upgrades/buy';

describe('buying an upgrade', () => {
  it('takes the gold and raises the level', () => {
    const store = economy(100);
    expect(buyUpgrade(store, priceUp, 1)).toBe(1);
    expect(store.getState().currencies.gold.toNumber()).toBe(90);
    expect(store.getState().upgrades).toEqual({ price_up: 1 });
  });

  it('buys a whole pack for the quoted price', () => {
    const store = economy(100);
    expect(buyUpgrade(store, priceUp, 'max')).toBe(3);
    expect(store.getState().currencies.gold.toNumber()).toBe(30);
    expect(store.getState().upgrades.price_up).toBe(3);
  });

  it('does nothing, and notifies nobody, when the gold is not enough or it is maxed', () => {
    const store = economy(5);
    const seen = vi.fn();
    store.subscribe(seen);
    expect(buyUpgrade(store, priceUp, 1)).toBe(0);
    store.update((s) => void (s.upgrades.price_up = 3));
    seen.mockClear();
    store.update((s) => void (s.currencies.gold = s.currencies.gold.add(1e6)));
    seen.mockClear();
    expect(buyUpgrade(store, priceUp, 'max')).toBe(0);
    expect(seen).not.toHaveBeenCalled();
  });
});

describe('watching what the player can afford', () => {
  it('finds the first upgrade that one more level pays for', () => {
    expect(firstAffordable(economy(9).getState(), upgradeDefs)).toBeUndefined();
    expect(firstAffordable(economy(10).getState(), upgradeDefs)?.id).toBe('price_up');
  });

  it('announces the moment the player can first pay for something, and again after each dry spell', () => {
    const store = economy(0);
    const bus = createEventBus<GameEvents>();
    const seen = vi.fn();
    bus.on('upgrade:affordable', seen);
    watchAffordable(store, bus, upgradeDefs);

    store.update((s) => void (s.currencies.gold = s.currencies.gold.add(4)));
    expect(seen).not.toHaveBeenCalled();
    store.update((s) => void (s.currencies.gold = s.currencies.gold.add(6)));
    expect(seen).toHaveBeenCalledTimes(1);
    store.update((s) => void (s.currencies.gold = s.currencies.gold.add(1)));
    expect(seen).toHaveBeenCalledTimes(1); // still affordable: no repeat

    buyUpgrade(store, priceUp, 1);
    store.update((s) => void (s.currencies.gold = s.currencies.gold.add(50)));
    expect(seen).toHaveBeenCalledTimes(2);
  });
});
