import { describe, expect, it } from 'vitest';
import { getMultipliers } from '@/economy/upgrades';
import { ROOMS, buildRoom, firstBuildableRoom, roomOffer, type RoomState, openSeats, roomSeatNumbers, totalSeats } from '@/rooms/rooms';
import { num } from '@/shared/numbers';
import { createStore } from '@/shared/state';

const room = (id: string) => {
  const def = ROOMS.find((r) => r.id === id);
  if (def === undefined) throw new Error(`no room ${id}`);
  return def;
};
const state = (reputation: number, gold: number, built: string[] = []): RoomState => ({ reputation, currencies: { gold: num(gold) }, roomsBuilt: built });

describe('building rooms', () => {
  it('opens a room at its level and builds it once for its price', () => {
    const extension = room('extension');
    expect(roomOffer(state(0, 1e9), extension).status).toBe('locked');
    expect(firstBuildableRoom(state(40, extension.buy.cost - 1), ROOMS)).toBeUndefined();
    const store = createStore(state(40, extension.buy.cost + 5));
    expect(buildRoom(store, extension)).toBe(true);
    expect(buildRoom(store, extension)).toBe(false);
    expect(store.getState()).toMatchObject({ roomsBuilt: ['extension'] });
    expect(store.getState().currencies.gold.toNumber()).toBe(5);
    expect(roomOffer(store.getState(), extension).status).toBe('owned');
  });

  it('counts the bonuses of built rooms: a faster cauldron, a bigger bar and more VIPs', () => {
    const before = getMultipliers({ upgrades: {} });
    const after = getMultipliers({ upgrades: {}, roomsBuilt: ['alchemy_lab', 'vip_lounge'] });
    expect(after.brewSpeed.toNumber()).toBeCloseTo(before.brewSpeed.toNumber() * 1.25);
    expect(after.storage.toNumber()).toBe(before.storage.toNumber() + 1);
    expect(after.vipChance.toNumber()).toBeCloseTo(before.vipChance.toNumber() * 2);
  });
});

describe('seats downstairs and in the rooms', () => {
  const plan = { ground: 7, rooms: ROOMS };

  it('numbers the seats downstairs first, then room by room', () => {
    expect(totalSeats(plan)).toBe(12);
    expect(roomSeatNumbers(plan, 'extension')).toEqual([7, 8, 9]);
    expect(roomSeatNumbers(plan, 'alchemy_lab')).toEqual([]);
    expect(roomSeatNumbers(plan, 'vip_lounge')).toEqual([10, 11]);
  });

  it('opens the bought seats downstairs and every seat of a built room', () => {
    expect(openSeats(plan, 1, [])).toEqual([0]);
    expect(openSeats(plan, 2, ['vip_lounge'])).toEqual([0, 1, 10, 11]);
    expect(openSeats(plan, 99, ['extension'])).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });
});
