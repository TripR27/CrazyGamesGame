import type { UpgradeDef } from './types';

/** First shop upgrades. Placeholder numbers: tuned in step 13. */
export const tier01Upgrades: readonly UpgradeDef[] = [
  {
    id: 'swift_cauldron',
    kind: 'cauldron',
    baseCost: 20,
    growth: 1.15,
    effect: { stat: 'brewSpeed', mode: 'multiply', perLevel: 0.1 },
    maxLevel: 15,
  },
  {
    id: 'better_prices',
    kind: 'tavern',
    baseCost: 30,
    growth: 1.7,
    effect: { stat: 'sellPrice', mode: 'multiply', perLevel: 0.15 },
  },
  {
    id: 'extra_seat',
    kind: 'tavern',
    baseCost: 40,
    growth: 1.8,
    effect: { stat: 'seats', mode: 'add', perLevel: 1 },
    maxLevel: 6,
  },
  {
    id: 'bigger_bar',
    kind: 'tavern',
    baseCost: 60,
    growth: 2,
    effect: { stat: 'storage', mode: 'add', perLevel: 1 },
    maxLevel: 2,
  },
];
