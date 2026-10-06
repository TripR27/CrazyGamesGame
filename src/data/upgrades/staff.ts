import type { UpgradeDef } from './types';

/**
 * Staff: level 1 is the hire, each further level is training. The effect is actions per second,
 * so one level of the brewer starts a drink every 20 seconds. Placeholder numbers: tuned in step 13.
 */
export const staffUpgrades: readonly UpgradeDef[] = [
  {
    id: 'brewer_assistant',
    kind: 'staff',
    baseCost: 100,
    growth: 1.5,
    effect: { stat: 'autoBrew', mode: 'add', perLevel: 0.05 },
    maxLevel: 10,
  },
  {
    id: 'waitress',
    kind: 'staff',
    baseCost: 150,
    growth: 1.5,
    effect: { stat: 'autoServe', mode: 'add', perLevel: 0.08 },
    maxLevel: 10,
  },
];
