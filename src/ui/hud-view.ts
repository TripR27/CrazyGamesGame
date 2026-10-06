import { formatNumber } from '@/core/format';
import { num } from '@/core/numbers';
import type { GameState } from '@/core/state';
import { textKey } from '@/data/text-key';
import { t } from '@/i18n';
import { levelProgress } from '@/systems/reputation';

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
