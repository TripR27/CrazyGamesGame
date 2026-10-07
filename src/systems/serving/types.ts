import type { GameEvents } from '@/shared/events';
import type { Num } from '@/shared/numbers';

/** The part of the game state that serving changes (interface segregation: not the whole state). */
export interface EconomyState {
  currencies: { gold: Num };
  reputation: number;
}

export interface EconomyStore {
  update(mutator: (state: EconomyState) => void): void;
}

export type ServeOutcome =
  /** The customer got the drink and now stays to drink it; they leave later through the customer system. */
  | { kind: 'served'; event: GameEvents['customer:served'] }
  | { kind: 'refused'; event: GameEvents['customer:refused'] }
  /** The customer is already gone or the content is unknown: nothing happens. */
  | { kind: 'ignored' };
