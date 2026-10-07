import type { GameObjects, Scene } from 'phaser';
import type { Graphics } from '@/app/backdrop-view';
import { type Rect, ROOM_SPOTS, UPPER_BEAM, type RoomSpot } from '@/app/layout';
import type { World } from '@/app/world';
import { t } from '@/i18n/translator';
import { REPUTATION_LEVELS } from '@/reputation/reputation';
import { type RoomDef, ROOMS, requestShop, roomOfferById } from '@/rooms/rooms';
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

/** Placeholder furniture per room (step 21 replaces it with pixel art). A new room is one more entry. */
type Furnish = (g: Graphics, r: Rect) => void;

const floorY = (r: Rect): number => r.y + r.h;

const FURNITURE: Readonly<Record<string, Furnish>> = {
  // A long table with three customer places.
  extension: (g, r) => {
    g.fillStyle(0x8b5a2b, 1).fillRect(r.x + 40, floorY(r) - 46, r.w - 80, 12);
    g.fillStyle(0x5e3a18, 1).fillRect(r.x + 50, floorY(r) - 34, 10, 34).fillRect(r.x + r.w - 60, floorY(r) - 34, 10, 34);
  },
  // Shelves with bubbling flasks and a small cauldron.
  alchemy_lab: (g, r) => {
    g.fillStyle(0x5e3a18, 1).fillRect(r.x + 20, r.y + 40, r.w - 40, 8).fillRect(r.x + 20, r.y + 84, r.w - 40, 8);
    const colours = [0x7be05a, 0xb36bff, 0xff6b6b, 0x5ad1ff, 0xf5c542];
    colours.forEach((c, i) => g.fillStyle(c, 1).fillCircle(r.x + 50 + i * 64, r.y + 28, 11).fillCircle(r.x + 82 + i * 64, r.y + 72, 10));
    g.fillStyle(0x2b2b33, 1).fillEllipse(r.x + r.w / 2, floorY(r) - 22, 90, 44);
    g.fillStyle(0xb36bff, 1).fillEllipse(r.x + r.w / 2, floorY(r) - 40, 70, 12);
  },
  // A red carpet, a golden frame and a sofa.
  vip_lounge: (g, r) => {
    g.fillStyle(0xa8243a, 1).fillRect(r.x + 20, floorY(r) - 10, r.w - 40, 10);
    g.lineStyle(4, 0xf5c542, 1).strokeRect(r.x + r.w / 2 - 40, r.y + 20, 80, 56);
    g.fillStyle(0x7a1f3d, 1).fillRect(r.x + r.w / 2 - 60, floorY(r) - 50, 120, 40);
  },
};

/** Draws a built room: a warmer wall and its furniture. */
export function drawBuiltRoom(g: Graphics, roomId: string, r: Rect): void {
  g.fillStyle(0xc99a68, 1).fillRect(r.x, r.y, r.w, r.h);
  FURNITURE[roomId]?.(g, r);
}

/** Draws a room that is not built yet: dark, with planks nailed across. */
export function drawBoardedRoom(g: Graphics, r: Rect): void {
  g.fillStyle(0x4a2c14, 1).fillRect(r.x, r.y, r.w, r.h);
  g.fillStyle(0x8b5a2b, 1);
  for (let i = 0; i < 4; i++) g.fillRect(r.x + 8, r.y + 14 + i * 34, r.w - 16, 18);
}

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

function createRoom(scene: Scene, room: RoomDef, spot: RoomSpot, services: World): Shown {
  const { rect } = spot;
  const g = scene.add.graphics();
  const sign = scene.add.text(rect.x + rect.w / 2, rect.y + rect.h / 2, '', SIGN_STYLE).setOrigin(0.5);
  // Clicking a room that is not built yet opens the shop, where it is built.
  const zone = scene.add.zone(rect.x + rect.w / 2, rect.y + rect.h / 2, rect.w, rect.h);
  zone.on('pointerdown', () => requestShop(services));
  services.targets.register(`room:${room.id}`, () => rect);
  return { room, spot, g, sign, zone, key: '' };
}

/** The rooms on the upper floor: boarded up with a sign until they are built, then furnished. */
export function createRoomsView(scene: Scene, services: World): RoomsView {
  scene.add.graphics().fillStyle(0x5e3a18, 1).fillRect(UPPER_BEAM.x, UPPER_BEAM.y, UPPER_BEAM.w, UPPER_BEAM.h);
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
