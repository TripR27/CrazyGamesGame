import { drawBackdropArt } from '@/app/backdrop-art';
import { CAULDRON, DOOR_ENTRY, FLOOR_Y, READY_SLOTS, SEAT_SLOTS } from '@/app/layout';
import { CAULDRON_FRAMES, FIRE_FRAMES, MUG } from '@/brewing/brewing-art';
import { CUSTOMER_FRAME, CUSTOMER_LOOKS, customerFrames } from '@/customers/customer-art';
import { createImage, drawSprite, fillRect, PIXEL, type PixelImage, type Sprite, spriteHeight, spriteWidth } from '@/shared/pixels';

/** Every sprite strip of the game by name: the preview sheet shows them all, the tests check them all. */
export const ART: Readonly<Record<string, readonly Sprite[]>> = {
  cauldron: CAULDRON_FRAMES,
  fire: FIRE_FRAMES,
  mug: [MUG],
  ...Object.fromEntries(CUSTOMER_LOOKS.map((id) => [`customer_${id}`, customerFrames(id)])),
};

/** Draws a sprite with its feet (bottom centre) at a design-pixel position. */
function place(img: PixelImage, sprite: Sprite, x: number, y: number): void {
  drawSprite(img, sprite, Math.round(x / PIXEL - spriteWidth(sprite) / 2), Math.round(y / PIXEL) - spriteHeight(sprite));
}

/** The tavern as the game shows it at the start: backdrop, fire, cauldron and a few drinks on the bar. */
function tavernScene(): PixelImage {
  const img = drawBackdropArt();
  const cx = CAULDRON.x + CAULDRON.w / 2;
  const [fire, cauldron] = [FIRE_FRAMES[0], CAULDRON_FRAMES[0]];
  if (fire !== undefined) place(img, fire, cx, FLOOR_Y - 4);
  if (cauldron !== undefined) place(img, cauldron, cx, FLOOR_Y);
  for (const slot of READY_SLOTS.slice(0, 3)) place(img, MUG, slot.x, slot.y);
  // A customer of every type: walking in, seated, drinking and cheering.
  const poses = [CUSTOMER_FRAME.walkA, CUSTOMER_FRAME.sit, CUSTOMER_FRAME.drinkHigh, CUSTOMER_FRAME.happy];
  CUSTOMER_LOOKS.forEach((id, i) => {
    const slot = SEAT_SLOTS[i + 1] ?? DOOR_ENTRY;
    const frame = customerFrames(id)[poses[i] ?? 0];
    if (frame !== undefined) place(img, frame, i === 0 ? DOOR_ENTRY.x + 60 : slot.x, i === 0 ? DOOR_ENTRY.y : slot.y);
  });
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

/** The preview images for `npm run pixel:preview`: name and image at art size. */
export function artPreviews(): { name: string; image: PixelImage }[] {
  return [
    { name: 'tavern', image: tavernScene() },
    { name: 'sprites', image: spriteSheet() },
  ];
}
