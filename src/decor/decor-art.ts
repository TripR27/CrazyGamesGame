import { createImage, drawSprite, fillRect, mirrored, type PixelImage, recolor, setPixel, type Sprite } from '@/shared/pixels';

/**
 * The decorations in pixel art (see shared/pixels.ts): torches with a flickering flame (three frames), trophies on a
 * wooden plaque, and rugs drawn to the size of their spot.
 */
const K = 0x1a1a22;
const TORCH_PALETTE = { k: K, f: 0xe8641a, y: 0xf5c542, Y: 0xfff2cc, b: 0x5e3a18, i: 0x45454f };
const BLUE_FLAME = { f: 0x2a7ad1, y: 0x5ad1ff, Y: 0xe8fffe };

const TORCH_BASE = ['..kbk..', '..kbk..', '..kbk..', '..kbk..', '.kiiik.', '..kbk..', '..kbk..', '.kiiik.', '...i...', '...i...', '..kik..', '.kiiik.', '.kiiik.', '..kkk..'];
const FLAMES = [
  ['...f...', '..fyf..', '..fyf..', '.fyYyf.', '.fyYyf.', '..fyf..'],
  ['....f..', '...fy..', '..fyf..', '.fyYyf.', '.fyYYf.', '..fyf..'],
  ['..f....', '..yf...', '..fyf..', '.fyYyf.', '.fYYyf.', '..fyf..'],
];

const TORCH_FRAMES: readonly Sprite[] = FLAMES.map((flame) => ({ palette: TORCH_PALETTE, rows: [...flame, ...TORCH_BASE] }));

/** The flame frames of each torch; the everburning torch burns blue. */
export const TORCHES: Readonly<Record<string, readonly Sprite[]>> = {
  wall_torch: TORCH_FRAMES,
  everburning_torch: TORCH_FRAMES.map((frame) => recolor(frame, BLUE_FLAME)),
};

const PLAQUE_PALETTE = { k: K, w: 0x5e3a18, W: 0x7a4a24, b: 0x6b4a2e, B: 0x8a6142, s: 0xc89a7a, t: 0xfff2cc, e: 0xe2563b };

/** A grumpy boar head with white tusks on a shield-shaped plaque. */
const BOAR = mirrored(PLAQUE_PALETTE, [
  '..kkkkkkkkk', '.kwwwwwwwww', '.kwWwwwwwww', '.kwwkkwwwww', '.kwkbbkkkkk', '.kwkbBbbbbb', '.kwwkbbbbbb', '.kwwkbbebbb', '.kwwkbbbbbb', '.kwwkbbbbss',
  '.kwwtkbbsks', '.kwwtkbbsss', '.kwwwtkbbbb', '.kwwwwkkbbb', '.kwwwwwwkkk', '.kwwWwwwwww', '..kwwwwwwww', '...kwwwwwww', '....kkwwwww', '......kkwww', '........kkk',
]);

const PLAQUE = mirrored(PLAQUE_PALETTE, [
  '..kkkkkkkkk', '.kwwwwwwwww', '.kwWwwwwwww', '.kwwwwwwwww', '.kwwwwwwwww', '.kwwwwwwwww', '.kwwwwwwwww', '.kwwwwwwwww', '.kwwwwwwwww', '.kwwwwwwwww',
  '.kwwwwwwwww', '.kwwwwwwwww', '.kwwwwwwwww', '.kwwwwwwwww', '.kwwwwwwwww', '.kwwWwwwwww', '..kwwwwwwww', '...kwwwwwww', '....kkwwwww', '......kkwww', '........kkk',
]);

/** A golden tankard that shines. */
const GOLD_TANKARD: Sprite = {
  palette: { k: 0x5a3a10, y: 0xf5c542, Y: 0xfff2a0, b: 0xc99a2a, f: 0xfff2cc, F: 0xe8d8a8, s: 0xffffff },
  rows: ['.ffffffff...', 'fFffffffFf..', 'kyYyyyyyyk..', 'kyYyysyyykkk', 'kbbbbbbbbk.k', 'kyYyyyyyyk.k', 'kyYyyyyyyk.k', 'kyYyyyyyykkk', 'kbbbbbbbbk..', 'kyYyyyyyyk..', '.kkkkkkkk...'],
};

function plaqueWith(sprite: Sprite | null): PixelImage {
  const image = createImage(22, 21);
  drawSprite(image, sprite === null ? BOAR : PLAQUE, 0, 0);
  if (sprite !== null) drawSprite(image, sprite, 5, 4);
  return image;
}

/** The trophies on the wall, each 22×21 art pixels. */
export const TROPHIES: Readonly<Record<string, () => PixelImage>> = {
  boar_trophy: () => plaqueWith(null),
  golden_tankard: () => plaqueWith(GOLD_TANKARD),
};

interface RugColours {
  base: number;
  border: number;
  pattern: number;
}

const RUG_COLOURS: Readonly<Record<string, RugColours>> = {
  woven_rug: { base: 0x3f6fa8, border: 0xd8c79a, pattern: 0xd8c79a },
  royal_carpet: { base: 0xa8243a, border: 0xf5c542, pattern: 0xf5c542 },
};

/** A rug of w×h art pixels: a border, fringe at both ends and a row of diamonds. */
export function rugImage(id: string, w: number, h: number): PixelImage | null {
  const c = RUG_COLOURS[id];
  if (c === undefined) return null;
  const image = createImage(w, h);
  fillRect(image, 0, 0, w, h, c.border);
  fillRect(image, 2, 1, w - 4, h - 2, c.base);
  for (let y = 0; y < h; y += 2) {
    setPixel(image, 0, y, c.border);
    setPixel(image, w - 1, y, c.border);
  }
  const mid = Math.floor(h / 2);
  const reach = Math.max(1, mid - 1);
  for (let cx = 8; cx < w - 6; cx += 10) {
    for (let d = 0; d < reach; d++) {
      for (const [x, y] of [[cx - d, mid - reach + 1 + d], [cx + d, mid - reach + 1 + d], [cx - d, mid + reach - 1 - d], [cx + d, mid + reach - 1 - d]] as const) {
        setPixel(image, x, y, c.pattern);
      }
    }
  }
  return image;
}
