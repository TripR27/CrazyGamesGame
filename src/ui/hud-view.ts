import { formatNumber } from '@/core/format';
import { num } from '@/core/numbers';
import type { GameState } from '@/core/state';

/** The slice of the state the HUD needs (interface segregation). */
export type HudState = Pick<GameState, 'currencies' | 'reputation'>;

export interface HudView {
  gold: string;
  reputation: string;
}

export function toHudView(state: HudState): HudView {
  return {
    gold: formatNumber(state.currencies.gold),
    reputation: formatNumber(num(Math.floor(state.reputation))),
  };
}
