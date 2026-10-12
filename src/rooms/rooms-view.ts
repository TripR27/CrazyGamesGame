import type { GameObjects, Scene } from 'phaser';
import { ROOM_SPOTS, type RoomSpot } from '@/app/layout';
import { addImageTexture, bubbleTexture } from '@/app/textures-view';
import type { World } from '@/app/world';
import { t } from '@/i18n/translator';
import { REPUTATION_LEVELS } from '@/reputation/reputation';
import { type RoomDef, ROOMS, requestShop, roomOfferById } from '@/rooms/rooms';
import { boardedRoomImage, builtRoomImage } from '@/rooms/rooms-art';
import { PIXEL } from '@/shared/pixels';
import type { Rng } from '@/shared/random';
import { textKey } from '@/shared/content';
import { formatNumber } from '@/shared/numbers';
import type { OneTimeOffer } from '@/shared/purchases';
import { FONT } from '@/config';

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

const SIGN_STYLE = { fontFamily: FONT, fontSize: '16px', fontStyle: 'bold', color: '#2a1a0c', align: 'center' };
/**
 * The sign hangs still on two ropes from the top of the room. Now and then (each sign at its own moment, and not every
 * time) a draught makes it wobble briefly and settle again.
 */
const SIGN = { rope: 30, ropeInset: 18, pad: 12, ropeColour: 0x6b4423, nail: 0x2b2b33 } as const;
const WOBBLE = { minWaitMs: 5000, maxWaitMs: 16000, skipChance: 0.35, minDeg: 0.8, maxDeg: 2, ms: 1600, swings: 2 } as const;

/** Waits a random while, then (most of the time) lets the sign wobble once and settle; then waits again. */
function wobbleNowAndThen(scene: Scene, sign: GameObjects.Container, rng: Rng): void {
  const wait = WOBBLE.minWaitMs + rng() * (WOBBLE.maxWaitMs - WOBBLE.minWaitMs);
  scene.time.delayedCall(wait, () => {
    if (!sign.visible || rng() < WOBBLE.skipChance) return wobbleNowAndThen(scene, sign, rng);
    const deg = (WOBBLE.minDeg + rng() * (WOBBLE.maxDeg - WOBBLE.minDeg)) * (rng() < 0.5 ? -1 : 1);
    scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: WOBBLE.ms,
      onUpdate: (tween) => {
        const t = tween.getValue() ?? 1;
        sign.setAngle(deg * Math.sin(t * Math.PI * 2 * WOBBLE.swings) * (1 - t));
      },
      onComplete: () => {
        sign.setAngle(0);
        wobbleNowAndThen(scene, sign, rng);
      },
    });
  });
}

interface Sign {
  container: GameObjects.Container;
  setText(text: string): void;
}

/** A wooden sign on two ropes, hanging from the top middle of a room. */
function createSign(scene: Scene, x: number, top: number, rng: Rng): Sign {
  const ropes = [-1, 1].map(() => scene.add.rectangle(0, 0, PIXEL, SIGN.rope, SIGN.ropeColour).setOrigin(0.5, 0));
  const nails = [-1, 1].map(() => scene.add.rectangle(0, 0, PIXEL * 2, PIXEL * 2, SIGN.nail).setOrigin(0.5, 0.5));
  const board = scene.add.image(0, SIGN.rope, '__DEFAULT').setOrigin(0.5, 0).setScale(PIXEL);
  const label = scene.add.text(0, 0, '', SIGN_STYLE).setOrigin(0.5);
  const container = scene.add.container(x, top, [...ropes, ...nails, board, label]);
  wobbleNowAndThen(scene, container, rng);
  return {
    container,
    setText(text) {
      label.setText(text);
      board.setTexture(bubbleTexture(scene, label.width, label.height, 'wood', false, SIGN.pad));
      const half = (board.width * PIXEL) / 2 - SIGN.ropeInset;
      ropes.forEach((rope, i) => rope.setX(i === 0 ? -half : half));
      nails.forEach((nail, i) => nail.setX(i === 0 ? -half : half));
      label.setY(SIGN.rope + (board.height * PIXEL) / 2);
    },
  };
}

export interface RoomsView {
  update(): void;
}

interface Shown {
  room: RoomDef;
  spot: RoomSpot;
  image: GameObjects.Image;
  sign: Sign;
  zone: GameObjects.Zone;
  key: string;
}

function createRoom(scene: Scene, room: RoomDef, spot: RoomSpot, services: World): Shown {
  const { rect } = spot;
  addImageTexture(scene, builtKey(room.id), builtRoomImage(room.id));
  const image = scene.add.image(rect.x, rect.y, BOARDED_KEY).setOrigin(0).setScale(PIXEL);
  const sign = createSign(scene, rect.x + rect.w / 2, rect.y + 2, services.rng);
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
        if (text !== '') item.sign.setText(text);
        item.sign.container.setVisible(text !== '');
      }
    },
  };
}
