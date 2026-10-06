import type { RoomDef } from '@/data/rooms';

/** The seats of the tavern: `ground` places downstairs, then each room's seats in the order of the rooms. */
export interface SeatPlan {
  ground: number;
  rooms: readonly RoomDef[];
}

/** Every seat number there is (downstairs and in every room, built or not). */
export const totalSeats = (plan: SeatPlan): number => plan.ground + plan.rooms.reduce((sum, r) => sum + r.seats, 0);

/** The seat numbers of one room, or an empty list for an unknown room. */
export function roomSeatNumbers(plan: SeatPlan, roomId: string): number[] {
  const index = plan.rooms.findIndex((r) => r.id === roomId);
  const first = plan.ground + plan.rooms.slice(0, Math.max(0, index)).reduce((sum, r) => sum + r.seats, 0);
  return index === -1 ? [] : Array.from({ length: plan.rooms[index]?.seats ?? 0 }, (_, i) => first + i);
}

/**
 * The seats customers may use: the first `bought` downstairs (the player starts with one and buys more), plus every
 * seat in a built room.
 */
export function openSeats(plan: SeatPlan, bought: number, built: readonly string[]): number[] {
  const downstairs = Array.from({ length: Math.min(plan.ground, Math.max(0, bought)) }, (_, i) => i);
  return [...downstairs, ...plan.rooms.filter((r) => built.includes(r.id)).flatMap((r) => roomSeatNumbers(plan, r.id))];
}
