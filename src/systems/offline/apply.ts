import type { Num } from '@/core/numbers';
import type { OfflineReport } from './types';

/** The part of the game state offline earnings change (interface segregation). */
export interface OfflineState {
  currencies: { gold: Num };
  reputation: number;
}

export interface OfflineStore {
  update(mutator: (state: OfflineState) => void): void;
}

/** Pay out what the staff earned. Earning nothing changes nothing. */
export function applyOffline(store: OfflineStore, report: OfflineReport): void {
  if (report.served === 0) return;
  store.update((state) => {
    state.currencies.gold = state.currencies.gold.add(report.gold);
    state.reputation += report.reputation;
  });
}
