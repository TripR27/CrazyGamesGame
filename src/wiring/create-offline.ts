import type { Clock } from '@/core/clock';
import type { EventBus } from '@/core/events';
import type { GameEvents } from '@/core/game-events';
import { touchLastSeen, type GameState } from '@/core/state';
import type { Store } from '@/core/store';
import { OFFLINE } from '@/data/offline';
import { recipes } from '@/data/recipes';
import { getMultipliers } from '@/systems/economy';
import type { CustomerCatalog } from '@/systems/customers';
import { applyOffline, computeOffline, createOfflineInbox, type OfflineInbox } from '@/systems/offline';

export interface OfflineDeps {
  store: Store<GameState>;
  bus: EventBus<GameEvents>;
  clock: Clock;
  catalog: CustomerCatalog;
}

export interface OfflineServices {
  /** The player was away for this long: pay out what the staff earned and, for a longer absence, welcome them back. */
  handleAway(awayMs: number): void;
  inbox: OfflineInbox;
}

/** Connects the offline formulas to the saved state: a gap in the clock becomes gold and a report. */
export function createOffline({ store, bus, clock, catalog }: OfflineDeps): OfflineServices {
  const inbox = createOfflineInbox();
  return {
    inbox,
    handleAway(awayMs) {
      if (awayMs <= 0) return;
      const state = store.getState();
      const stats = getMultipliers(state);
      const report = computeOffline({
        awayMs,
        rates: { brew: stats.autoBrew.toNumber(), serve: stats.autoServe.toNumber() },
        limitHours: stats.offlineHours.toNumber(),
        reputation: state.reputation,
        knownRecipes: recipes.filter((r) => state.recipesDiscovered.includes(r.id)),
        customerTypes: catalog.customerTypes,
        sellMultiplier: stats.sellPrice,
      });
      applyOffline(store, report);
      // The time is accounted for now; without this the same gap would count again at the next save.
      store.update((s) => touchLastSeen(s, clock.now()));
      if (awayMs >= OFFLINE.minWelcomeMs) inbox.post(report);
      if (report.served > 0) bus.emit('saveRequested', {});
    },
  };
}
