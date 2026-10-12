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
