import { drawBackdropArt } from '@/app/backdrop-art';
import { ICONS } from '@/app/icon-art';
import { CAULDRON, DECOR_SPOTS, DOOR_ENTRY, FLOOR_Y, HERO_CAULDRON, HERO_SPOTS, INGREDIENT_SLOTS, READY_SLOTS, ROOM_SPOTS, SEAT_SLOTS, SHELF } from '@/app/layout';
import { CAULDRON_FRAMES, FIRE_FRAMES, MUG } from '@/brewing/brewing-art';
import { ingredientArt, INGREDIENT_ART } from '@/brewing/ingredient-art';
import { CUSTOMER_FRAME, CUSTOMER_LOOKS, customerFrames } from '@/customers/customer-art';
import { rugImage, TORCHES, TROPHIES } from '@/decor/decor-art';
import { HERO_LOOKS, HERO_POT_FRAMES, heroFrames } from '@/heroes/hero-art';
import { builtRoomImage } from '@/rooms/rooms-art';
import { BREWER_FRAMES, BUCKET, KETTLE_FRAMES } from '@/staff/staff-art';
import { createImage, drawSprite, fillRect, PIXEL, type PixelImage, type Sprite, spriteHeight, spriteWidth } from '@/shared/pixels';

/** Every sprite strip of the game by name: the preview sheet shows them all, the tests check them all. */
export const ART: Readonly<Record<string, readonly Sprite[]>> = {
  cauldron: CAULDRON_FRAMES,
  fire: FIRE_FRAMES,
  mug: [MUG],
  ...Object.fromEntries(CUSTOMER_LOOKS.map((id) => [`customer_${id}`, customerFrames(id)])),
  ingredients: Object.values(INGREDIENT_ART),
  ...Object.fromEntries(HERO_LOOKS.map((id) => [`hero_${id}`, heroFrames(id)])),
  hero_pot: HERO_POT_FRAMES,
  brewer: BREWER_FRAMES,
  kettle: KETTLE_FRAMES,
  bucket: [BUCKET],
  ...Object.fromEntries(Object.entries(TORCHES).map(([id, frames]) => [id, frames])),
  icons: Object.values(ICONS),
};

const a = (n: number): number => Math.round(n / PIXEL);

/** Draws a sprite with its feet (bottom centre) at a design-pixel position. */
function place(img: PixelImage, sprite: Sprite, x: number, y: number): void {
  drawSprite(img, sprite, Math.round(x / PIXEL - spriteWidth(sprite) / 2), Math.round(y / PIXEL) - spriteHeight(sprite));
}

/** Copies a whole image onto another at art position x, y (see-through pixels stay see-through). */
function paste(img: PixelImage, from: PixelImage, x: number, y: number): void {
  for (let py = 0; py < from.height; py++) {
    for (let px = 0; px < from.width; px++) {
      const i = (py * from.width + px) * 4;
      const j = ((y + py) * img.width + x + px) * 4;
      if (from.data[i + 3] === 0 || x + px >= img.width || y + py >= img.height) continue;
      img.data.set(from.data.subarray(i, i + 4), j);
    }
  }
}

/** The upper floor and the decorations, as a player sees them late in a run. */
function furnish(img: PixelImage): void {
  for (const [id, spot] of Object.entries(ROOM_SPOTS)) paste(img, builtRoomImage(id), a(spot.rect.x), a(spot.rect.y));
  for (const [id, frames] of Object.entries(TORCHES)) {
    const spot = DECOR_SPOTS[id];
    if (spot !== undefined && frames[0] !== undefined) place(img, frames[0], spot.x + spot.w / 2, spot.y + spot.h);
  }
  for (const [id, draw] of Object.entries(TROPHIES)) {
    const spot = DECOR_SPOTS[id];
    if (spot !== undefined) paste(img, draw(), a(spot.x), a(spot.y));
  }
  for (const id of ['woven_rug', 'royal_carpet']) {
    const spot = DECOR_SPOTS[id];
    const rug = spot === undefined ? null : rugImage(id, a(spot.w), a(spot.h));
    if (spot !== undefined && rug !== null) paste(img, rug, a(spot.x), a(spot.y));
  }
  HERO_LOOKS.forEach((id) => {
    const spot = HERO_SPOTS[id];
    const frame = heroFrames(id)[0];
    if (spot !== undefined && frame !== undefined) place(img, frame, spot.x, spot.y);
  });
  if (HERO_POT_FRAMES[0] !== undefined) place(img, HERO_POT_FRAMES[0], HERO_CAULDRON.x, HERO_CAULDRON.y);
  Object.keys(INGREDIENT_ART).forEach((id, i) => {
    const slot = INGREDIENT_SLOTS[i];
    if (slot !== undefined) place(img, ingredientArt(id), slot.x, SHELF.y);
  });
}

/** The tavern late in a run: backdrop, rooms, decorations, cauldron, drinks on the bar and a customer of every type. */
function tavernScene(): PixelImage {
  const img = drawBackdropArt();
  furnish(img);
  const cx = CAULDRON.x + CAULDRON.w / 2;
  const [fire, cauldron] = [FIRE_FRAMES[0], CAULDRON_FRAMES[0]];
  if (fire !== undefined) place(img, fire, cx, FLOOR_Y);
  if (cauldron !== undefined) place(img, cauldron, cx, FLOOR_Y);
  for (const slot of READY_SLOTS.slice(0, 3)) place(img, MUG, slot.x, slot.y);
  const poses = [CUSTOMER_FRAME.walkA, CUSTOMER_FRAME.sit, CUSTOMER_FRAME.drinkHigh, CUSTOMER_FRAME.happy];
  CUSTOMER_LOOKS.forEach((id, i) => {
    const slot = SEAT_SLOTS[i + 1] ?? DOOR_ENTRY;
    const frame = customerFrames(id)[poses[i] ?? 0];
    if (frame !== undefined) place(img, frame, i === 0 ? DOOR_ENTRY.x + 60 : slot.x, i === 0 ? DOOR_ENTRY.y : slot.y);
  });
  const upstairs = customerFrames('elf')[CUSTOMER_FRAME.sit];
  const seat = SEAT_SLOTS[7];
  if (upstairs !== undefined && seat !== undefined) place(img, upstairs, seat.x, seat.y);
  return img;
}

/** All strips under each other on a dark sheet, one frame next to the other, with a gap. */
function spriteSheet(): PixelImage {
  const GAP = 2;
  const strips = Object.values(ART);
  const width = Math.max(...strips.map((frames) => frames.reduce((sum, f) => sum + spriteWidth(f) + GAP, GAP)));
  const height = strips.reduce((sum, frames) => sum + Math.max(...frames.map(spriteHeight)) + GAP, GAP);
  const img = createImage(width, height);
  fillRect(img, 0, 0, width, height, 0x3b2a1c);
  let y = GAP;
  for (const frames of strips) {
    let x = GAP;
    for (const frame of frames) {
      drawSprite(img, frame, x, y);
      x += spriteWidth(frame) + GAP;
    }
    y += Math.max(...frames.map(spriteHeight)) + GAP;
  }
  return img;
}

/** A part of an image (art pixels), for the thumbnails. */
function crop(from: PixelImage, x: number, y: number, w: number, h: number): PixelImage {
  const img = createImage(w, h);
  for (let row = 0; row < h; row++) img.data.set(from.data.subarray(((y + row) * from.width + x) * 4, ((y + row) * from.width + x + w) * 4), row * w * 4);
  return img;
}

/**
 * The preview images for `npm run pixel:preview`: name, image at art size and how many times to scale it up. The three
 * thumbnails are raw material for the CrazyGames covers (landscape 1920×1080, square 800×800, portrait 800×1200); the
 * title and logo go on top in an image editor.
 */
export function artPreviews(): { name: string; image: PixelImage; scale: number }[] {
  const tavern = tavernScene();
  return [
    { name: 'tavern', image: tavern, scale: 4 },
    { name: 'sprites', image: spriteSheet(), scale: 8 },
    { name: 'thumbnail-landscape', image: tavern, scale: 6 },
    { name: 'thumbnail-square', image: crop(tavern, 110, 40, 100, 100), scale: 8 },
    { name: 'thumbnail-portrait', image: crop(tavern, 120, 10, 100, 150), scale: 8 },
  ];
}
