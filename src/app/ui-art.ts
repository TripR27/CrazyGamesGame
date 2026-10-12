import { createImage, fillRect, type PixelImage, setPixel } from '@/shared/pixels';

/**
 * Pixel-art speech bubbles, signs and frames (see shared/pixels.ts): drawn to size for the canvas (an order bubble, a
 * room sign) and as 9×9 frames that the DOM stretches with `border-image` (the tutorial bubble and the panels).
 */
export interface FrameStyle {
  edge: number;
  fill: number;
  /** The darker bottom inside edge. */
  shade: number;
  /** The lighter top inside edge. */
  light: number;
}

export const FRAME_STYLES = {
  parchment: { edge: 0x3b2410, fill: 0xfff3d6, shade: 0xe8d2a8, light: 0xffffff },
  marked: { edge: 0x2f8a2f, fill: 0xf2ffe6, shade: 0xc8eab0, light: 0xffffff },
  wood: { edge: 0x3b2410, fill: 0xdcaa6c, shade: 0xb07a40, light: 0xf0c88a },
  dark: { edge: 0x120b05, fill: 0x2e1d10, shade: 0x22150a, light: 0x4a3220 },
  // Buttons and cards in the DOM panels.
  gold: { edge: 0x5a3a10, fill: 0xf5c542, shade: 0xc99a2a, light: 0xfff2a0 },
  green: { edge: 0x1f3a10, fill: 0x8fd45f, shade: 0x5fa83a, light: 0xc8f0a0 },
  stone: { edge: 0x6b5f48, fill: 0xe0d6bc, shade: 0xc0b394, light: 0xf2ead6 },
  red: { edge: 0x5a1a10, fill: 0xf07a4a, shade: 0xc04a2a, light: 0xffb090 },
  plum: { edge: 0x2c1238, fill: 0xf4e8ff, shade: 0xd8c4ec, light: 0xffffff },
  card: { edge: 0x8a6a3a, fill: 0xfffdf3, shade: 0xeadfc0, light: 0xffffff },
  // A wooden card on the panel's wooden wall (light text on it).
  plank: { edge: 0x1e1006, fill: 0x8b5a2b, shade: 0x6b4423, light: 0xa5703a },
} as const satisfies Readonly<Record<string, FrameStyle>>;

export type FrameName = keyof typeof FRAME_STYLES;

/** Pixels below the body taken by the tail of a speech bubble. */
export const TAIL_ROWS = 2;

/** A rounded box of w×h art pixels: a 1-pixel edge with cut corners, a light top and a shaded bottom inside. */
function drawBox(image: PixelImage, w: number, h: number, s: FrameStyle): void {
  fillRect(image, 1, 1, w - 2, h - 2, s.fill);
  fillRect(image, 2, 0, w - 4, 1, s.edge);
  fillRect(image, 2, h - 1, w - 4, 1, s.edge);
  fillRect(image, 0, 2, 1, h - 4, s.edge);
  fillRect(image, w - 1, 2, 1, h - 4, s.edge);
  for (const [x, y] of [[1, 1], [w - 2, 1], [1, h - 2], [w - 2, h - 2]] as const) setPixel(image, x, y, s.edge);
  fillRect(image, 2, 1, w - 4, 1, s.light);
  fillRect(image, 2, h - 2, w - 4, 1, s.shade);
}

/** A speech bubble: a box of w × bodyH art pixels with a small tail under its middle (`tail` false: a plain sign). */
export function bubbleImage(w: number, bodyH: number, style: FrameStyle, tail = true): PixelImage {
  const image = createImage(w, bodyH + (tail ? TAIL_ROWS : 0));
  drawBox(image, w, bodyH, style);
  if (tail) {
    const cx = Math.floor(w / 2);
    fillRect(image, cx - 1, bodyH - 2, 3, 2, style.fill);
    setPixel(image, cx - 1, bodyH, style.edge);
    setPixel(image, cx, bodyH, style.fill);
    setPixel(image, cx + 1, bodyH, style.edge);
    setPixel(image, cx, bodyH + 1, style.edge);
  }
  return image;
}

const SIGN_WOOD = {
  edge: 0x2a1608, plank: 0xb07a40, plankLight: 0xc28a4c, seam: 0x7a4a22, grain: 0x9a6634,
  top: 0xe0aa6a, bottom: 0x6b4423, nail: 0x45454f, nailLight: 0x9a9aa6,
} as const;
/** Rows per plank of a sign, and the thickness shown under it. */
const PLANK_ROWS = 5;
const SIGN_THICKNESS = 2;

/**
 * A wooden sign of w×h art pixels: horizontal planks with seams and grain, a dark edge with cut corners, a light top
 * edge, its thickness underneath and a nail in each corner (the top two hold the ropes).
 */
export function signImage(w: number, h: number): PixelImage {
  const c = SIGN_WOOD;
  const image = createImage(w, h);
  const body = h - SIGN_THICKNESS;
  for (let y = 1; y < body - 1; y++) {
    const plank = Math.floor((y - 1) / PLANK_ROWS);
    fillRect(image, 1, y, w - 2, 1, (y - 1) % PLANK_ROWS === 0 && y > 1 ? c.seam : plank % 2 === 0 ? c.plank : c.plankLight);
    // Grain: short darker streaks in a fixed pattern.
    for (let x = 2; x < w - 2; x++) if ((x * 5 + y * 11 + plank * 7) % 23 === 0) fillRect(image, x, y, 3, 1, c.grain);
  }
  fillRect(image, 2, 1, w - 4, 1, c.top);
  fillRect(image, 1, body - 1, w - 2, SIGN_THICKNESS + 1, c.bottom);
  fillRect(image, 2, 0, w - 4, 1, c.edge);
  fillRect(image, 2, h - 1, w - 4, 1, c.edge);
  fillRect(image, 0, 2, 1, h - 4, c.edge);
  fillRect(image, w - 1, 2, 1, h - 4, c.edge);
  for (const [x, y] of [[1, 1], [w - 2, 1], [1, h - 2], [w - 2, h - 2]] as const) setPixel(image, x, y, c.edge);
  for (const [x, y] of [[3, 2], [w - 4, 2], [3, body - 3], [w - 4, body - 3]] as const) {
    setPixel(image, x, y, c.nail);
    setPixel(image, x, y - 1, c.nailLight);
  }
  return image;
}

/** A twisted rope, 1 art pixel wide and `length` long. */
export function ropeImage(length: number): PixelImage {
  const image = createImage(1, length);
  for (let y = 0; y < length; y++) setPixel(image, 0, y, y % 2 === 0 ? 0x8b5a2b : 0x5e3a18);
  return image;
}

/** The size of a DOM frame source: 3 pixels of corner on each side of a 3-pixel middle. */
export const FRAME_SIZE = 9;
export const FRAME_SLICE = 3;

/** A 9×9 frame for CSS `border-image` (slice 3): the same box as the bubbles, stretched by the browser. */
export const frameImage = (style: FrameStyle): PixelImage => bubbleImage(FRAME_SIZE, FRAME_SIZE, style, false);

/** The side panel's frame: a dark edge and two pixels of wood around parchment (slice 3, like the other frames). */
export function panelFrameImage(): PixelImage {
  const image = createImage(FRAME_SIZE, FRAME_SIZE);
  fillRect(image, 0, 0, FRAME_SIZE, FRAME_SIZE, SIGN_WOOD.edge);
  fillRect(image, 1, 1, FRAME_SIZE - 2, FRAME_SIZE - 2, SIGN_WOOD.plank);
  fillRect(image, 1, 1, FRAME_SIZE - 2, 1, SIGN_WOOD.top);
  fillRect(image, 1, FRAME_SIZE - 2, FRAME_SIZE - 2, 1, SIGN_WOOD.bottom);
  fillRect(image, FRAME_SLICE, FRAME_SLICE, FRAME_SIZE - 2 * FRAME_SLICE, FRAME_SIZE - 2 * FRAME_SLICE, FRAME_STYLES.parchment.fill);
  return image;
}

/** A 16×16 tile of parchment with faint fibres and specks, repeated behind the panels. */
export function paperImage(): PixelImage {
  const size = 16;
  const image = createImage(size, size);
  fillRect(image, 0, 0, size, size, 0xf6e7c4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const n = (x * 7 + y * 13 + x * y) % 29;
      if (n === 0) setPixel(image, x, y, 0xe8d3a6);
      else if (n === 7) setPixel(image, x, y, 0xfbf0d6);
      else if (n === 15 && x % 3 === 0) setPixel(image, x, y, 0xdcc391);
    }
  }
  return image;
}

/**
 * A tile of dark wooden wall (32×15: three planks of five rows, with seams, staggered joints and grain), repeated behind
 * the side panel and the windows.
 */
export function woodWallImage(): PixelImage {
  const w = 32;
  const rows = 5;
  const image = createImage(w, rows * 3);
  const tones = [0x5e3a18, 0x4f3014, 0x684220] as const;
  for (let plank = 0; plank < 3; plank++) {
    const top = plank * rows;
    fillRect(image, 0, top, w, rows, tones[plank] ?? 0x5e3a18);
    fillRect(image, 0, top, w, 1, 0x2a1608);
    fillRect(image, 0, top + 1, w, 1, 0x7a4e26);
    const joint = (plank * 11 + 5) % w;
    fillRect(image, joint, top + 1, 1, rows - 1, 0x2a1608);
    for (let x = 0; x < w; x++) if ((x * 5 + plank * 9) % 13 === 0) fillRect(image, x, top + 3, 2, 1, 0x3e2610);
  }
  return image;
}
