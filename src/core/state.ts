import { num, type Num } from '@/core/numbers';

export interface MetaState {
  createdAt: number;
  lastSeenAt: number;
}

export interface CurrencyState {
  gold: Num;
}

export interface GameState {
  meta: MetaState;
  currencies: CurrencyState;
  reputation: number;
}

export function createInitialState(now: number): GameState {
  return {
    meta: { createdAt: now, lastSeenAt: now },
    currencies: { gold: num(0) },
    reputation: 0,
  };
}

/** Remember when the player was last active; offline progress is computed from this. */
export function touchLastSeen(state: GameState, now: number): void {
  state.meta.lastSeenAt = now;
}
