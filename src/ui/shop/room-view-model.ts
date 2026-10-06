import type { RoomDef } from '@/data/rooms';
import { textKey } from '@/data/text-key';
import { t } from '@/i18n';
import { roomOffer, type RoomState } from '@/systems/rooms';
import { effectAmount, type RowView } from './shop-view-model';
import { toOneTimeRowView } from './one-time-view-model';

/** The description of a room, with its seats and the amount of each effect filled in (`{seats}`, `{brewSpeed}`, …). */
export function roomDescription(room: RoomDef): string {
  const amounts = Object.fromEntries(room.effects.map((e) => [e.stat, effectAmount(e)]));
  return t(textKey('rooms', room.id, 'description'), { seats: room.seats, ...amounts });
}

/** One room in the shop: locked until its level, then for sale once (built rooms leave the shop). */
export function toRoomRowView(room: RoomDef, state: RoomState): RowView {
  const labels = { name: t(textKey('rooms', room.id, 'name')), description: roomDescription(room), level: room.buy.level, buyKey: 'shop.build_once' };
  return toOneTimeRowView(labels, roomOffer(state, room));
}
