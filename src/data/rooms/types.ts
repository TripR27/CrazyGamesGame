import type { OneTimePurchase } from '@/data/common';
import type { UpgradeEffect } from '@/data/upgrades/types';

/**
 * A room on the upper floor, built once in the shop. `seats` are extra places for customers in that room (the
 * scene has a spot for each); `effects` are bonuses on the same stats upgrades use, counted once the room is built.
 * Texts: `rooms.<id>.name` and `rooms.<id>.description` (`{seats}` and the effect amounts filled in).
 */
export interface RoomDef {
  id: string;
  buy: OneTimePurchase;
  seats: number;
  effects: readonly UpgradeEffect[];
}
