import type { UpgradeDef } from './types';

/**
 * Staff: level 1 is the hire, each further level is training. The effect is actions per second,
 * so one level of the brewer starts a drink every 33 seconds. Fully trained, staff do about a third of
 * what an active player does (GAME_ANALYSE.md: idle 30-40%; measured with `npm run simulate`). Placeholder numbers: tuned in step 13.
 */
export const staffUpgrades: readonly UpgradeDef[] = [
  {
    id: 'brewer_assistant',
    kind: 'staff',
    baseCost: 60,
    growth: 1.8,
    effect: { stat: 'autoBrew', mode: 'add', perLevel: 0.03 },
    maxLevel: 5,
  },
  {
    id: 'waitress',
    kind: 'staff',
    baseCost: 90,
    growth: 1.8,
    effect: { stat: 'autoServe', mode: 'add', perLevel: 0.04 },
    maxLevel: 5,
  },
];
