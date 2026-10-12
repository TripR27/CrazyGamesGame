import { createImage, drawSprite, fillRect, mirrored, type PixelImage, setPixel, type Sprite } from '@/shared/pixels';

/**
 * The rooms on the upper floor in pixel art (see shared/pixels.ts), each ROOM_ART_W × ROOM_ART_H art pixels: a built
 * room (a warm planked wall with its own furniture) or a boarded-up one. A new room is one more entry in `FURNISH`.
 */
export const ROOM_ART_W = 71;
export const ROOM_ART_H = 36;

const C = {
  wall: 0xc99a68, wallLine: 0xa97b4c, post: 0x6b4423, postDark: 0x4a2c14,
  wood: 0x8b5a2b, woodDark: 0x5e3a18, woodTop: 0xd9a066, dark: 0x3a2414, plank: 0x8b5a2b, plankLight: 0xa5703a, nail: 0x45454f,
  glow: 0xfff2a0, flame: 0xf5c542, iron: 0x2b2b33,
} as const;

function drawWall(img: PixelImage, base: number = C.wall, line: number = C.wallLine): void {
  fillRect(img, 0, 0, ROOM_ART_W, ROOM_ART_H, base);
  for (let y = 4; y < ROOM_ART_H; y += 5) fillRect(img, 0, y, ROOM_ART_W, 1, line);
  fillRect(img, 0, 0, ROOM_ART_W, 2, C.post);
  for (const x of [0, ROOM_ART_W - 2]) fillRect(img, x, 0, 2, ROOM_ART_H, C.post);
  fillRect(img, 1, 0, 1, ROOM_ART_H, C.postDark);
}

/** A small iron lantern with a candle, hanging at x, y. */
function lantern(img: PixelImage, x: number, y: number): void {
  setPixel(img, x + 1, y - 1, C.iron);
  fillRect(img, x, y, 3, 4, C.iron);
  fillRect(img, x + 1, y + 1, 1, 2, C.flame);
}

/** A round stool whose feet stand on the floor at x. */
function stool(img: PixelImage, x: number): void {
  fillRect(img, x - 4, ROOM_ART_H - 6, 8, 2, C.woodTop);
  fillRect(img, x - 3, ROOM_ART_H - 4, 1, 4, C.woodDark);
  fillRect(img, x + 2, ROOM_ART_H - 4, 1, 4, C.woodDark);
}

const FLASK = (glass: number): Sprite => ({ palette: { k: 0x1a1a22, g: glass, w: 0xffffff, c: 0xa5683a }, rows: ['.c.', 'kgk', 'gwg', 'ggg'] });
const FLASK_COLOURS = [0x7be05a, 0xb36bff, 0xff6b6b, 0x5ad1ff, 0xf5c542, 0xff9ad8];

const LAB_POT: Sprite = mirrored({ k: 0x1a1a22, d: 0x2b2b33, m: 0x45454f, p: 0xb36bff, P: 0xe0b0ff }, [
  '..kkkk', '.kmmmm', '.kpPpp', '..kkkk', '.kdddd', 'kddddd', 'kddddd', '.kdddd', '..kkkk', '..k...',
]);

const PAINTING: Sprite = {
  palette: { g: 0xf5c542, G: 0xc99a2a, s: 0x5ad1ff, h: 0x4f8148, m: 0xf2f2e6, y: 0xfff2a0 },
  rows: ['gGgGgGgGgGgGgGgG', 'Gssssssssssssysg', 'gsssmssssssssssG', 'Gssmmmsssssshssg', 'gsmmmmmsssshhhsG', 'Ghhhhhhhhhhhhhhg', 'gGgGgGgGgGgGgGgG'],
};

const BANNER: Sprite = {
  palette: { k: 0x1a1a22, b: 0x2f5d8a, B: 0x234a70, y: 0xf5c542, r: 0x8b5a2b },
  rows: ['rrrrrrrrr', 'kbbbbbbbk', 'kbbbybbbk', 'kbbyyybbk', 'kbyyyyybk', 'kbbyyybbk', 'kbbbybbbk', 'kbbbybbbk', 'kbbbbbbbk', 'kbBbbbBbk', 'kbbBbBbbk', '.kbbBbbk.', '..kbbbk..', '...kbk...', '....k....'],
};

/** Furniture per built room; x positions are art pixels from the left of the room (seats from layout.ts / 4). */
const FURNISH: Readonly<Record<string, (img: PixelImage) => void>> = {
  // A long table for three, stools at the seats and two lanterns.
  extension: (img) => {
    fillRect(img, 4, 23, ROOM_ART_W - 8, 2, C.woodTop);
    fillRect(img, 4, 25, ROOM_ART_W - 8, 1, C.woodDark);
    for (const x of [6, ROOM_ART_W - 8]) fillRect(img, x, 26, 2, ROOM_ART_H - 26, C.woodDark);
    for (const x of [14, 36, 58]) stool(img, x);
    for (const x of [24, 46]) lantern(img, x, 6);
  },
  // Two shelves of bubbling flasks and a purple cauldron.
  alchemy_lab: (img) => {
    for (const y of [10, 20]) {
      fillRect(img, 5, y, ROOM_ART_W - 10, 1, C.woodTop);
      fillRect(img, 5, y + 1, ROOM_ART_W - 10, 1, C.woodDark);
    }
    FLASK_COLOURS.forEach((colour, i) => {
      drawSprite(img, FLASK(colour), 8 + i * 10, 6);
      drawSprite(img, FLASK(FLASK_COLOURS[(i + 3) % FLASK_COLOURS.length] ?? colour), 12 + i * 9, 16);
    });
    drawSprite(img, LAB_POT, 29, ROOM_ART_H - 10);
  },
  // A dark red wall, a golden painting, two armchairs at the seats and a red carpet.
  vip_lounge: (img) => {
    drawWall(img, 0x8a3a4a, 0x7a2a3a);
    drawSprite(img, PAINTING, 27, 5);
    for (const x of [15, 57]) {
      fillRect(img, x - 6, 19, 12, 12, 0x5a1a6a);
      fillRect(img, x - 6, 19, 12, 1, 0xf5c542);
      fillRect(img, x - 7, 25, 2, 8, 0x5a1a6a);
      fillRect(img, x + 5, 25, 2, 8, 0x5a1a6a);
    }
    fillRect(img, 2, ROOM_ART_H - 2, ROOM_ART_W - 4, 2, 0xa8243a);
  },
  // A guild banner over the hero cauldron, a weapon rack and a bunk bed.
  guild_hall: (img) => {
    drawSprite(img, BANNER, 32, 3);
    fillRect(img, 4, 8, 9, 1, C.woodDark);
    fillRect(img, 4, 18, 9, 1, C.woodDark);
    for (const x of [6, 10]) fillRect(img, x, 5, 1, 15, 0xd8dce4);
    fillRect(img, 5, 5, 3, 1, 0xf5c542);
    fillRect(img, 9, 5, 3, 1, 0xf5c542);
    fillRect(img, 58, 22, 11, 2, C.woodDark);
    fillRect(img, 58, 21, 11, 1, 0xd9cfa8);
    fillRect(img, 58, 31, 11, 2, C.woodDark);
    fillRect(img, 58, 30, 11, 1, 0xd9cfa8);
    for (const x of [58, 68]) fillRect(img, x, 18, 1, ROOM_ART_H - 18, C.woodDark);
  },
};

/** A built room: the wall and its furniture. */
export function builtRoomImage(roomId: string): PixelImage {
  const img = createImage(ROOM_ART_W, ROOM_ART_H);
  drawWall(img);
  FURNISH[roomId]?.(img);
  return img;
}

/** A room that is not built yet: dark, with planks nailed across. */
export function boardedRoomImage(): PixelImage {
  const img = createImage(ROOM_ART_W, ROOM_ART_H);
  fillRect(img, 0, 0, ROOM_ART_W, ROOM_ART_H, C.dark);
  for (let i = 0; i < 4; i++) {
    const y = 3 + i * 8;
    fillRect(img, 2, y, ROOM_ART_W - 4, 5, C.plank);
    fillRect(img, 2, y, ROOM_ART_W - 4, 1, C.plankLight);
    for (const x of [4, ROOM_ART_W - 6]) setPixel(img, x, y + 2, C.nail);
  }
  for (const x of [0, ROOM_ART_W - 2]) fillRect(img, x, 0, 2, ROOM_ART_H, C.post);
  return img;
}
