import { describe, expect, it } from 'vitest';
import { BACKDROP_HEIGHT, BACKDROP_WIDTH, drawBackdropArt } from '@/app/backdrop-art';
import { CUSTOMER_FRAME, CUSTOMER_LOOKS, customerFrames } from '@/customers/customer-art';
import { customers } from '@/customers/customer-data';
import { INGREDIENT_ART } from '@/brewing/ingredient-art';
import { ingredients } from '@/brewing/ingredients';
import { DECORATIONS } from '@/decor/decor';
import { rugImage, TORCHES, TROPHIES } from '@/decor/decor-art';
import { ART } from '@/dev/art-preview';
import { bubbleImage, FRAME_SIZE, FRAME_STYLES, frameImage, ropeImage, signImage, TAIL_ROWS } from '@/app/ui-art';
import { heroFrames } from '@/heroes/hero-art';
import { HERO_CLASSES } from '@/heroes/heroes';
import { ROOMS } from '@/rooms/rooms';
import { builtRoomImage } from '@/rooms/rooms-art';
import { mirrored, raised, spriteProblems, stripImage, swapChars, withPixels } from '@/shared/pixels';

describe('pixel art', () => {
  it('has no sprite with uneven rows or colours missing from its palette', () => {
    for (const [name, frames] of Object.entries(ART)) {
      frames.forEach((frame, i) => expect(spriteProblems(`${name}[${i}]`, frame)).toEqual([]));
    }
  });

  it('keeps every frame of a strip the same size, so animations do not jump', () => {
    for (const [name, frames] of Object.entries(ART)) {
      const sizes = new Set(frames.map((f) => `${f.rows[0]?.length}x${f.rows.length}`));
      expect(sizes.size, name).toBe(1);
    }
  });

  it('mirrors, recolours pixels, raises and lays frames side by side', () => {
    const half = mirrored({ a: 0xff0000 }, ['a.', '.a']);
    expect(half.rows).toEqual(['a..a', '.aa.']);
    expect(withPixels(half, [[1, 0, 'a']]).rows[0]).toBe('aa.a');
    expect(swapChars(half, { a: '.' }).rows).toEqual(['....', '....']);
    expect(raised(half, 1).rows).toEqual(['.aa.', '....']);
    const strip = stripImage([half, half]);
    expect([strip.width, strip.height]).toEqual([8, 2]);
    expect(Array.from(strip.data.slice(0, 4))).toEqual([255, 0, 0, 255]);
    expect(strip.data[7]).toBe(0);
  });

  it('gives every customer type its own look, with all poses', () => {
    for (const { id } of customers) {
      expect(CUSTOMER_LOOKS, id).toContain(id);
      expect(customerFrames(id)).toHaveLength(Object.keys(CUSTOMER_FRAME).length);
    }
  });

  it('gives every ingredient, hero, decoration and room its own art', () => {
    for (const { id } of ingredients) expect(INGREDIENT_ART[id], id).toBeDefined();
    for (const { id } of HERO_CLASSES) expect(heroFrames(id).length, id).toBe(4);
    for (const { id } of DECORATIONS) {
      const art = TORCHES[id] ?? TROPHIES[id] ?? rugImage(id, 20, 6);
      expect(art, id).toBeTruthy();
    }
    const plain = builtRoomImage('no_such_room').data.join();
    for (const { id } of ROOMS) expect(builtRoomImage(id).data.join() === plain, id).toBe(false);
  });

  it('draws bubbles with a tail, wooden signs and 9×9 frames for the DOM', () => {
    const bubble = bubbleImage(20, 8, FRAME_STYLES.parchment);
    expect([bubble.width, bubble.height]).toEqual([20, 8 + TAIL_ROWS]);
    expect(bubble.data[3]).toBe(0); // a cut corner
    expect(bubble.data[((8 + TAIL_ROWS - 1) * 20 + 10) * 4 + 3]).toBe(255); // the tip of the tail
    const frame = frameImage(FRAME_STYLES.wood);
    expect([frame.width, frame.height]).toEqual([FRAME_SIZE, FRAME_SIZE]);
    const sign = signImage(30, 12);
    expect(sign.data[((6 * 30) + 15) * 4 + 3]).toBe(255);
    expect(ropeImage(5).height).toBe(5);
  });

  it('reports a row of the wrong width and an unknown colour', () => {
    expect(spriteProblems('x', { palette: { a: 1 }, rows: ['aa', 'ab', 'a'] })).toHaveLength(2);
  });

  it('draws the backdrop at a quarter of the game size, with no see-through pixels', () => {
    const img = drawBackdropArt();
    expect([img.width, img.height]).toEqual([BACKDROP_WIDTH, BACKDROP_HEIGHT]);
    expect([BACKDROP_WIDTH, BACKDROP_HEIGHT]).toEqual([320, 180]);
    for (let i = 3; i < img.data.length; i += 4) {
      if (img.data[i] !== 255) throw new Error(`see-through pixel at ${(i - 3) / 4}`);
    }
  });
});
