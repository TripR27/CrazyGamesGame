import type { GameObjects, Scene } from 'phaser';
import { ROOM_SPOTS, type RoomSpot } from '@/app/layout';
import { addImageTexture } from '@/app/textures-view';
import type { World } from '@/app/world';
import { t } from '@/i18n/translator';
import { REPUTATION_LEVELS } from '@/reputation/reputation';
import { type RoomDef, ROOMS, requestShop, roomOfferById } from '@/rooms/rooms';
import { boardedRoomImage, builtRoomImage } from '@/rooms/rooms-art';
import { PIXEL } from '@/shared/pixels';
import { textKey } from '@/shared/content';
import { formatNumber } from '@/shared/numbers';
import type { OneTimeOffer } from '@/shared/purchases';

/** The sign on a boarded-up room: its name, and the level it opens at or its price. Empty once it is built. */
export function roomSign(room: RoomDef, offer: OneTimeOffer): string {
  if (offer.status === 'owned') return '';
  const name = t(textKey('rooms', room.id, 'name'));
  if (offer.status === 'locked') {
    const level = t(textKey('reputation', REPUTATION_LEVELS[room.buy.level - 1]?.id ?? '', 'name'));
    return t('rooms.sign_locked', { name, level });
  }
  return t('rooms.sign_for_sale', { name, cost: formatNumber(offer.cost) });
}

const BOARDED_KEY = 'room_boarded';
const builtKey = (roomId: string): string => `room_${roomId}`;

const SIGN_STYLE = {
  fontFamily: 'sans-serif', fontSize: '16px', color: '#3b2410', align: 'center', backgroundColor: '#f2dfb0', padding: { x: 10, y: 6 },
};

export interface RoomsView {
  update(): void;
}

interface Shown {
  room: RoomDef;
  spot: RoomSpot;
  image: GameObjects.Image;
  sign: GameObjects.Text;
  zone: GameObjects.Zone;
  key: string;
}

function createRoom(scene: Scene, room: RoomDef, spot: RoomSpot, services: World): Shown {
  const { rect } = spot;
  addImageTexture(scene, builtKey(room.id), builtRoomImage(room.id));
  const image = scene.add.image(rect.x, rect.y, BOARDED_KEY).setOrigin(0).setScale(PIXEL);
  const sign = scene.add.text(rect.x + rect.w / 2, rect.y + rect.h / 2, '', SIGN_STYLE).setOrigin(0.5);
  // Clicking a room that is not built yet opens the shop, where it is built.
  const zone = scene.add.zone(rect.x + rect.w / 2, rect.y + rect.h / 2, rect.w, rect.h);
  zone.on('pointerdown', () => requestShop(services));
  services.targets.register(`room:${room.id}`, () => rect);
  return { room, spot, image, sign, zone, key: '' };
}

/** The rooms on the upper floor in pixel art: boarded up with a sign until they are built, then furnished. */
export function createRoomsView(scene: Scene, services: World): RoomsView {
  addImageTexture(scene, BOARDED_KEY, boardedRoomImage());
  const shown = ROOMS.flatMap((room) => {
    const spot = ROOM_SPOTS[room.id];
    return spot === undefined ? [] : [createRoom(scene, room, spot, services)];
  });
  return {
    update() {
      for (const item of shown) {
        const offer = roomOfferById(services, item.room.id);
        if (offer === undefined) continue;
        const text = roomSign(item.room, offer);
        const key = `${offer.status}|${text}`;
        if (key === item.key) continue;
        item.key = key;
        const built = offer.status === 'owned';
        item.image.setTexture(built ? builtKey(item.room.id) : BOARDED_KEY);
        // Only a boarded-up room is clickable; a built one lets clicks through (to put a picked drink back).
        if (built) item.zone.disableInteractive();
        else item.zone.setInteractive({ useHandCursor: true });
        item.sign.setText(text).setVisible(text !== '');
      }
    },
  };
}
