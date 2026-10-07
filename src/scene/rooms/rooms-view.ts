import type { GameObjects, Scene } from 'phaser';
import { ROOMS } from '@/data/rooms/index';
import type { RoomDef } from '@/data/rooms/types';
import { ROOM_SPOTS, UPPER_BEAM, type RoomSpot } from '@/scene/layout-rooms';
import { drawBoardedRoom, drawBuiltRoom } from '@/scene/rooms/room-furniture';
import { roomSign } from '@/scene/rooms/room-sign';
import type { SceneServices } from '@/scene/services';

const SIGN_STYLE = {
  fontFamily: 'sans-serif', fontSize: '16px', color: '#3b2410', align: 'center', backgroundColor: '#f2dfb0', padding: { x: 10, y: 6 },
};

export interface RoomsView {
  update(): void;
}

interface Shown {
  room: RoomDef;
  spot: RoomSpot;
  g: GameObjects.Graphics;
  sign: GameObjects.Text;
  zone: GameObjects.Zone;
  key: string;
}

function createRoom(scene: Scene, room: RoomDef, spot: RoomSpot, services: SceneServices): Shown {
  const { rect } = spot;
  const g = scene.add.graphics();
  const sign = scene.add.text(rect.x + rect.w / 2, rect.y + rect.h / 2, '', SIGN_STYLE).setOrigin(0.5);
  // Clicking a room that is not built yet opens the shop, where it is built.
  const zone = scene.add.zone(rect.x + rect.w / 2, rect.y + rect.h / 2, rect.w, rect.h);
  zone.on('pointerdown', () => services.actions.requestShop());
  services.targets.register(`room:${room.id}`, () => rect);
  return { room, spot, g, sign, zone, key: '' };
}

/** The rooms on the upper floor: boarded up with a sign until they are built, then furnished. */
export function createRoomsView(scene: Scene, services: SceneServices): RoomsView {
  scene.add.graphics().fillStyle(0x5e3a18, 1).fillRect(UPPER_BEAM.x, UPPER_BEAM.y, UPPER_BEAM.w, UPPER_BEAM.h);
  const shown = ROOMS.flatMap((room) => {
    const spot = ROOM_SPOTS[room.id];
    return spot === undefined ? [] : [createRoom(scene, room, spot, services)];
  });
  return {
    update() {
      for (const item of shown) {
        const offer = services.getRoomOffer(item.room.id);
        if (offer === undefined) continue;
        const text = roomSign(item.room, offer);
        const key = `${offer.status}|${text}`;
        if (key === item.key) continue;
        item.key = key;
        item.g.clear();
        const built = offer.status === 'owned';
        if (built) drawBuiltRoom(item.g, item.room.id, item.spot.rect);
        else drawBoardedRoom(item.g, item.spot.rect);
        // Only a boarded-up room is clickable; a built one lets clicks through (to put a picked drink back).
        if (built) item.zone.disableInteractive();
        else item.zone.setInteractive({ useHandCursor: true });
        item.sign.setText(text).setVisible(text !== '');
      }
    },
  };
}
