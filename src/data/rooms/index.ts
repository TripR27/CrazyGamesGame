import type { RoomDef } from './types';

export type { RoomDef } from './types';

/**
 * The rooms on the upper floor, left to right (the scene shows them in this order; customer seats are numbered
 * downstairs first, then room by room). Placeholder prices: tuned with `npm run simulate`. A new room is data here,
 * a spot in scene/layout-rooms.ts and its texts.
 */
export const ROOMS: readonly RoomDef[] = [
  { id: 'extension', buy: { level: 3, cost: 1500 }, seats: 3, effects: [] },
  {
    id: 'alchemy_lab',
    buy: { level: 4, cost: 8000 },
    seats: 0,
    effects: [
      { stat: 'brewSpeed', mode: 'multiply', perLevel: 0.25 },
      { stat: 'storage', mode: 'add', perLevel: 1 },
    ],
  },
  { id: 'vip_lounge', buy: { level: 5, cost: 30_000 }, seats: 2, effects: [{ stat: 'vipChance', mode: 'multiply', perLevel: 1 }] },
];
