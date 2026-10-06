import type { RoomDef } from '@/data/rooms';
import { REPUTATION_LEVELS } from '@/data/reputation/levels';
import { UPGRADE_STATS } from '@/data/upgrades';
import { isTier, oneOf, positive } from './rules';
import { defineTable, type ContentTable } from './table';

/** Rooms open at a level after the first, cost gold, have a whole number of seats and bonuses on known stats. */
export const roomTable = (items: readonly RoomDef[]): ContentTable =>
  defineTable({
    domain: 'rooms',
    items,
    textFields: ['name', 'description'],
    check: (room) => [
      ...(isTier(room.buy.level) && room.buy.level >= 2 && room.buy.level <= REPUTATION_LEVELS.length
        ? [] : [`buy.level must be a level from 2 to ${REPUTATION_LEVELS.length}`]),
      ...positive(room.buy.cost, 'buy.cost'),
      ...(Number.isInteger(room.seats) && room.seats >= 0 ? [] : ['seats must be a whole number >= 0']),
      ...(room.seats > 0 || room.effects.length > 0 ? [] : ['a room must add seats or an effect']),
      ...room.effects.flatMap((e) => [...oneOf(e.stat, UPGRADE_STATS, 'effect stat'), ...positive(e.perLevel, 'effect perLevel')]),
    ],
  });
