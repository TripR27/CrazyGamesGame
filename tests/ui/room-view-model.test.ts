import { describe, expect, it } from 'vitest';
import { num } from '@/core/numbers';
import { ROOMS } from '@/data/rooms';
import { roomOffer } from '@/systems/rooms';
import { roomSign } from '@/scene/rooms/room-sign';
import { roomDescription, toRoomRowView } from '@/ui/shop/room-view-model';

const lab = ROOMS.find((r) => r.id === 'alchemy_lab') ?? ROOMS[0];
const lounge = ROOMS.find((r) => r.id === 'vip_lounge') ?? ROOMS[0];
const state = (reputation: number, gold: number, built: string[] = []) => ({ reputation, currencies: { gold: num(gold) }, roomsBuilt: built });

describe('a room in the shop and on the upper floor', () => {
  it('describes its seats and bonuses with the amounts from the data', () => {
    if (lab === undefined || lounge === undefined) throw new Error('no rooms');
    expect(roomDescription(lab)).toMatch(/^The cauldron brews \+25% faster and the bar holds \+1 drink\./);
    expect(roomDescription(lounge)).toMatch(/^\+100% VIPs, and \+2 seats/);
  });

  it('shows the level that opens it, then its price', () => {
    if (lab === undefined) throw new Error('no rooms');
    expect(toRoomRowView(lab, state(0, 0))).toMatchObject({ name: 'Alchemy Lab', level: 'Unlocks at Popular Pub', canBuy: false });
    expect(toRoomRowView(lab, state(120, lab.buy.cost))).toMatchObject({ level: '', canBuy: true, buyLabel: expect.stringMatching(/^Build · /) });
  });

  it('has a sign while boarded up, and none once built', () => {
    if (lab === undefined) throw new Error('no rooms');
    expect(roomSign(lab, roomOffer(state(0, 0), lab))).toBe('Alchemy Lab\nUnlocks at Popular Pub');
    expect(roomSign(lab, roomOffer(state(120, 0), lab))).toMatch(/^Alchemy Lab\nBuild in the shop: /);
    expect(roomSign(lab, roomOffer(state(120, 0, ['alchemy_lab']), lab))).toBe('');
  });
});
