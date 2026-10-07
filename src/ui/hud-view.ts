import { t } from '@/i18n/index';
import { levelProgress } from '@/reputation/reputation';
import { textKey } from '@/shared/content';
import { formatNumber, num } from '@/shared/numbers';
import type { GameState } from '@/shared/state';

/** The slice of the state the HUD needs (interface segregation). */
export type HudState = Pick<GameState, 'currencies' | 'reputation'>;

export interface HudView {
  gold: string;
  reputation: string;
  /** Name of the reputation level. */
  level: string;
  /** How far towards the next level, 0 to 1 (full at the top level). */
  levelFraction: number;
}

export function toHudView(state: HudState): HudView {
  const progress = levelProgress(state.reputation);
  return {
    gold: formatNumber(state.currencies.gold),
    reputation: formatNumber(num(Math.floor(state.reputation))),
    level: t(textKey('reputation', progress.current.id, 'name')),
    levelFraction: progress.fraction,
  };
}
