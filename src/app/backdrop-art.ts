import { BAR, BUILDING, CAULDRON, CUSTOMER_SLOTS, DOOR, FLOOR_Y, GROUND_Y, SHELF, TABLES, UPPER_BEAM, type Rect } from '@/app/layout';
import { GAME_HEIGHT, GAME_WIDTH } from '@/config';
import { createImage, drawSprite, fillRect, mirrored, PIXEL, type PixelImage, setPixel, withPixels } from '@/shared/pixels';

/** The colours of the tavern backdrop. */
const C = {
  outside: 0x2a1a0c, grass: 0x3f6b3a, grassLight: 0x4f8148, grassDark: 0x2f5530, dirt: 0x7a5a3a, dirtDark: 0x5e4329,
  wall: 0xb98a5a, wallDark: 0xa97b4c, wallLine: 0x8c6239, beam: 0x6b4423, beamDark: 0x4a2c14, beamLight: 0x8b5a2b,
  floor: 0x6b4423, floorLight: 0x7d5230, floorLine: 0x4f3119,
  wood: 0x8b5a2b, woodDark: 0x5e3a18, woodLight: 0xc58b4a, woodTop: 0xd9a066,
  stone: 0x6a6a78, stoneLight: 0x8a8a96, stoneDark: 0x45454f, soot: 0x231a1a, ember: 0xb03a10,
  door: 0x5e3a18, doorDark: 0x3a200c, iron: 0x2b2b33, knob: 0xf5c542, candle: 0xfff2cc, flame: 0xf5c542,
} as const;

/** Design pixels to art pixels. */
const a = (n: number): number => Math.round(n / PIXEL);
const art = (r: Rect): Rect => ({ x: a(r.x), y: a(r.y), w: a(r.x + r.w) - a(r.x), h: a(r.y + r.h) - a(r.y) });
/** A fixed pattern instead of chance, so the backdrop is the same every time. */
const speckle = (x: number, y: number, every: number): boolean => (x * 7 + y * 13) % every === 0;

const BUILDING_ART = art(BUILDING);
const FLOOR = a(FLOOR_Y);
const GROUND = a(GROUND_Y);

function drawOutside(img: PixelImage): void {
  fillRect(img, 0, 0, img.width, img.height, C.outside);
  fillRect(img, 0, GROUND, img.width, img.height - GROUND, C.grass);
  for (let y = GROUND; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      if (speckle(x, y, 11)) setPixel(img, x, y, C.grassLight);
      else if (speckle(x + 3, y, 17)) setPixel(img, x, y, C.grassDark);
    }
  }
  // A dirt path from the front door.
  const door = art(DOOR);
  fillRect(img, door.x - 2, GROUND, door.w + 4, img.height - GROUND, C.dirt);
  for (let y = GROUND; y < img.height; y += 3) setPixel(img, door.x + ((y * 5) % door.w), y, C.dirtDark);
}

/** Planked back wall with a roof beam and corner posts. */
function drawWall(img: PixelImage): void {
  const { x, y, w } = BUILDING_ART;
  fillRect(img, x, y, w, FLOOR - y, C.wall);
  for (let row = y + 4, i = 0; row < FLOOR; row += 5, i++) {
    fillRect(img, x, row, w, 1, C.wallLine);
    fillRect(img, x, row + 1, w, 1, C.wallDark);
    for (let seam = x + 9 + (i % 2) * 23; seam < x + w; seam += 46) fillRect(img, seam, row + 1, 1, 4, C.wallLine);
  }
  fillRect(img, x, y, w, 4, C.beam);
  fillRect(img, x, y + 3, w, 1, C.beamDark);
  for (const px of [x, x + w - 3]) {
    fillRect(img, px, y, 3, FLOOR - y, C.beam);
    fillRect(img, px + 2, y, 1, FLOOR - y, C.beamDark);
  }
  // The upper floor: rooms stand on this beam.
  const beam = art(UPPER_BEAM);
  fillRect(img, beam.x, beam.y, beam.w, 3, C.beam);
  fillRect(img, beam.x, beam.y, beam.w, 1, C.beamLight);
  fillRect(img, beam.x, beam.y + 3, beam.w, 1, C.beamDark);
}

function drawFloor(img: PixelImage): void {
  const { x, w } = BUILDING_ART;
  fillRect(img, x, FLOOR, w, GROUND - FLOOR, C.floor);
  fillRect(img, x, FLOOR, w, 1, C.floorLight);
  for (let row = FLOOR + 4, i = 0; row < GROUND; row += 4, i++) {
    fillRect(img, x, row, w, 1, C.floorLine);
    for (let seam = x + 14 + (i % 3) * 11; seam < x + w; seam += 33) fillRect(img, seam, row - 3, 1, 3, C.floorLine);
  }
}

/** A planked door with iron bands and a brass knob. */
function drawDoor(img: PixelImage): void {
  const d = art(DOOR);
  fillRect(img, d.x - 1, d.y - 1, d.w + 2, d.h + 1, C.beamDark);
  fillRect(img, d.x, d.y, d.w, d.h, C.door);
  for (let px = d.x + 5; px < d.x + d.w; px += 6) fillRect(img, px, d.y, 1, d.h, C.doorDark);
  for (const py of [d.y + 6, d.y + d.h - 9]) fillRect(img, d.x, py, d.w, 2, C.iron);
  fillRect(img, d.x + d.w - 4, d.y + Math.floor(d.h / 2), 2, 2, C.knob);
}

/** A four-paned window with the night sky, a moon and a few stars. */
const WINDOW = withPixels(
  mirrored({ k: C.beamDark, f: C.beam, F: C.beamLight, s: 0x1c2a5a, S: 0xc8d4ff, m: 0xfff2cc }, [
    'kkkkkkkkkk',
    'kfffffffff',
    'kfsssssssf',
    'kfsssssssf',
    'kfsssssssf',
    'kfsssssssf',
    'kfsssssssf',
    'kfsssssssf',
    'kfffffffff',
    'kfsssssssf',
    'kfsssssssf',
    'kfsssssssf',
    'kfsssssssf',
    'kfsssssssf',
    'kfffffffff',
    'kFFFFFFFFF',
    'kkkkkkkkkk',
  ]),
  [[13, 3, 'm'], [14, 3, 'm'], [13, 4, 'm'], [14, 4, 'm'], [15, 4, 'm'], [14, 5, 'm'], [4, 4, 'S'], [6, 11, 'S'], [16, 12, 'S'], [12, 10, 'S'], [3, 6, 'S']],
);

/** A stone hearth with a chimney behind the cauldron, and logs under the fire. */
function drawHearth(img: PixelImage): void {
  const c = art(CAULDRON);
  const x = c.x - 4;
  const w = c.w + 8;
  const top = c.y - 12;
  fillRect(img, x, top, w, FLOOR - top, C.stone);
  fillRect(img, x + 10, a(UPPER_BEAM.y) + 4, w - 20, top - a(UPPER_BEAM.y) - 4, C.stone);
  for (let row = a(UPPER_BEAM.y) + 4; row < FLOOR; row += 4) {
    const inChimney = row < top;
    const left = inChimney ? x + 10 : x;
    const right = inChimney ? x + w - 10 : x + w;
    fillRect(img, left, row, right - left, 1, C.stoneDark);
    for (let seam = left + ((row / 4) % 2) * 3 + 2; seam < right; seam += 6) setPixel(img, seam, row + 2, C.stoneDark);
    fillRect(img, left, row + 1, right - left, 1, C.stoneLight);
  }
  // The opening: dark soot with a rounded top, glowing embers at the bottom.
  fillRect(img, x + 5, top + 8, w - 10, FLOOR - top - 8, C.soot);
  fillRect(img, x + 7, top + 6, w - 14, 2, C.soot);
  fillRect(img, x + 5, FLOOR - 2, w - 10, 2, C.ember);
  fillRect(img, x + 9, FLOOR - 3, w - 18, 1, C.woodDark);
}

function drawShelf(img: PixelImage): void {
  const s = art(SHELF);
  fillRect(img, s.x, s.y, s.w, 3, C.wood);
  fillRect(img, s.x, s.y, s.w, 1, C.woodTop);
  fillRect(img, s.x, s.y + 2, s.w, 1, C.woodDark);
  for (const bx of [s.x + 7, s.x + s.w - 9]) {
    fillRect(img, bx, s.y + 3, 2, 4, C.woodDark);
    setPixel(img, bx + 2, s.y + 3, C.woodDark);
  }
}

/** Tables with a candle each. */
function drawTables(img: PixelImage): void {
  for (const table of TABLES) {
    const t = art(table);
    for (const lx of [t.x + 3, t.x + t.w - 5]) fillRect(img, lx, t.y + 3, 2, FLOOR - t.y - 3, C.woodDark);
    fillRect(img, t.x, t.y, t.w, 3, C.wood);
    fillRect(img, t.x, t.y, t.w, 1, C.woodTop);
    fillRect(img, t.x, t.y + 2, t.w, 1, C.woodDark);
    const cx = t.x + Math.floor(t.w / 2);
    fillRect(img, cx, t.y - 3, 1, 3, C.candle);
    setPixel(img, cx, t.y - 4, C.flame);
  }
}

/** The bar counter: a light top and panelled front. */
function drawBar(img: PixelImage): void {
  const b = art(BAR);
  fillRect(img, b.x, b.y, b.w, b.h, C.wood);
  fillRect(img, b.x, b.y, b.w, 3, C.woodTop);
  fillRect(img, b.x, b.y + 3, b.w, 1, C.woodDark);
  for (let px = b.x + 2; px + 10 <= b.x + b.w; px += 12) {
    fillRect(img, px, b.y + 6, 10, b.h - 11, C.woodLight);
    fillRect(img, px + 1, b.y + 7, 8, b.h - 13, C.wood);
  }
  fillRect(img, b.x, b.y + b.h - 3, b.w, 3, C.woodDark);
}

/** A round wooden stool at every downstairs seat; customers sit on them. */
function drawStools(img: PixelImage): void {
  for (const slot of CUSTOMER_SLOTS) {
    const x = a(slot.x) - 4;
    const y = a(slot.y) - 6;
    fillRect(img, x, y, 8, 2, C.woodLight);
    fillRect(img, x, y + 1, 8, 1, C.wood);
    fillRect(img, x + 1, y + 2, 1, 4, C.woodDark);
    fillRect(img, x + 6, y + 2, 1, 4, C.woodDark);
    fillRect(img, x + 1, y + 4, 6, 1, C.woodDark);
  }
}

export const BACKDROP_WIDTH = GAME_WIDTH / PIXEL;
export const BACKDROP_HEIGHT = GAME_HEIGHT / PIXEL;

/** The whole static backdrop at art size (320×180): outside, walls, floor, door, window, hearth and furniture. */
export function drawBackdropArt(): PixelImage {
  const img = createImage(BACKDROP_WIDTH, BACKDROP_HEIGHT);
  drawOutside(img);
  drawWall(img);
  drawFloor(img);
  drawDoor(img);
  drawSprite(img, WINDOW, a(440) - 10, 90);
  drawHearth(img);
  drawShelf(img);
  drawTables(img);
  drawBar(img);
  drawStools(img);
  return img;
}
