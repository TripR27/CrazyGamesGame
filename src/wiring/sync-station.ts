import type { BrewStation } from '@/brewing/brewing';
import { getMultipliers } from '@/economy/upgrades';
import type { GameState, Store } from '@/shared/state';

/**
 * Keeps the cauldron and bar in step with the bought upgrades: bar size and brew speed.
 * A brew that is already running keeps its speed; the next one uses the new value. Returns a stop function.
 */
export function syncStationStats(store: Store<GameState>, station: BrewStation): () => void {
  const apply = (): void => {
    const stats = getMultipliers(store.getState());
    station.capacity = Math.floor(stats.storage.toNumber());
    station.speed = stats.brewSpeed.toNumber();
  };
  apply();
  return store.subscribe(apply);
}
