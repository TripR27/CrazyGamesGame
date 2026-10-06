import { describe, expect, it, vi } from 'vitest';
import { createEventBus } from '@/core/events';
import type { GameEvents } from '@/core/game-events';
import { createPlayerActions } from '@/systems/actions';
import { catalog, economy, floorWith, noUpgrades, rng, station } from '../fixtures';

function game(gold: number) {
  const bus = createEventBus<GameEvents>();
  const eco = economy(gold);
  const actions = createPlayerActions({
    bus, station: station(), floor: floorWith(), economy: eco, upgradeStore: eco, ...noUpgrades,
    catalog, rng: rng(), getKnownRecipeIds: () => [],
  });
  const bought = vi.fn();
  const saves = vi.fn();
  const opened = vi.fn();
  bus.on('upgrade:bought', bought);
  bus.on('saveRequested', saves);
  bus.on('shop:opened', opened);
  return { actions, eco, bought, saves, opened };
}

describe('upgrade actions', () => {
  it('buys, announces the purchase and asks for a save', () => {
    const { actions, eco, bought, saves } = game(100);
    actions.buyUpgrade('price_up', 'max');
    expect(bought).toHaveBeenCalledWith({ id: 'price_up', count: 3 });
    expect(saves).toHaveBeenCalledTimes(1);
    expect(eco.getState().upgrades.price_up).toBe(3);
  });

  it('stays silent when the player cannot pay or the upgrade does not exist', () => {
    const { actions, bought, saves } = game(5);
    actions.buyUpgrade('price_up', 1);
    actions.buyUpgrade('nope', 1);
    expect(bought).not.toHaveBeenCalled();
    expect(saves).not.toHaveBeenCalled();
  });

  it('announces that the shop was opened', () => {
    const { actions, opened } = game(0);
    actions.openShop();
    expect(opened).toHaveBeenCalledTimes(1);
  });
});
