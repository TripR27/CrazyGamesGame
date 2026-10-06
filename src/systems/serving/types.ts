import type { GameEvents } from '@/core/game-events';
import type { Num } from '@/core/numbers';
import type { CustomerChange } from '@/systems/customers';

/** The part of the game state that serving changes (interface segregation: not the whole state). */
export interface EconomyState {
  currencies: { gold: Num };
  reputation: number;
}

export interface EconomyStore {
  update(mutator: (state: EconomyState) => void): void;
}

export type ServeOutcome =
  | { kind: 'served'; change: CustomerChange; event: GameEvents['customer:served'] }
  | { kind: 'refused'; event: GameEvents['customer:refused'] }
  /** The customer is already gone or the content is unknown: nothing happens. */
  | { kind: 'ignored' };
