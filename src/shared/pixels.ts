/**
 * Pixel art as text: one string per pixel row, one character per pixel. '.' is see-through; every other character must
 * be a colour in the sprite's palette. Pure data and pure drawing, so tests and scripts can check and render the art
 * without a browser. The game draws every art pixel as `PIXEL` × `PIXEL` design pixels (nearest-neighbour, per texture).
 */
export interface Sprite {
  readonly palette: Readonly<Record<string, number>>;
  readonly rows: readonly string[];
}

/** RGBA bytes, row by row (the layout of the browser's ImageData). */
export interface PixelImage {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8ClampedArray;
}

/** Design pixels per art pixel: the art is drawn at a quarter of 1280×720 and scaled up four times. */
export const PIXEL = 4;

export function createImage(width: number, height: number): PixelImage {
  return { width, height, data: new Uint8ClampedArray(width * height * 4) };
}

export function setPixel(image: PixelImage, x: number, y: number, color: number, alpha = 255): void {
  if (x < 0 || y < 0 || x >= image.width || y >= image.height) return;
  const i = (y * image.width + x) * 4;
  image.data[i] = (color >> 16) & 255;
  image.data[i + 1] = (color >> 8) & 255;
  image.data[i + 2] = color & 255;
  image.data[i + 3] = alpha;
}

export function fillRect(image: PixelImage, x: number, y: number, w: number, h: number, color: number): void {
  for (let py = y; py < y + h; py++) {
    for (let px = x; px < x + w; px++) setPixel(image, px, py, color);
  }
}

export const spriteWidth = (sprite: Sprite): number => sprite.rows[0]?.length ?? 0;
export const spriteHeight = (sprite: Sprite): number => sprite.rows.length;

/** Draws a sprite with its top-left corner at x, y; `flip` mirrors it left to right. */
export function drawSprite(image: PixelImage, sprite: Sprite, x: number, y: number, flip = false): void {
  const width = spriteWidth(sprite);
  sprite.rows.forEach((row, ry) => {
    for (let rx = 0; rx < row.length; rx++) {
      const color = sprite.palette[row[rx] ?? '.'];
      if (color !== undefined) setPixel(image, x + (flip ? width - 1 - rx : rx), y + ry, color);
    }
  });
}

/**
 * Frames side by side in one image, each as wide and high as the largest frame (a smaller frame stands centred on the
 * bottom); frame i starts at x = i × width.
 */
export function stripImage(frames: readonly Sprite[]): PixelImage {
  const width = Math.max(...frames.map(spriteWidth));
  const height = Math.max(...frames.map(spriteHeight));
  const image = createImage(width * frames.length, height);
  frames.forEach((frame, i) => drawSprite(image, frame, i * width + Math.floor((width - spriteWidth(frame)) / 2), height - spriteHeight(frame)));
  return image;
}

/** What is wrong with a sprite: rows of another width, or characters missing from the palette. Empty when it is fine. */
export function spriteProblems(name: string, sprite: Sprite): string[] {
  const width = spriteWidth(sprite);
  const problems: string[] = [];
  sprite.rows.forEach((row, y) => {
    if (row.length !== width) problems.push(`${name}: row ${y} is ${row.length} wide, expected ${width}`);
    for (const char of row) {
      if (char !== '.' && sprite.palette[char] === undefined) problems.push(`${name}: row ${y} uses unknown "${char}"`);
    }
  });
  return problems;
}

/** The same drawing with other colours: e.g. one body shape for every customer type. */
export const recolor = (sprite: Sprite, palette: Readonly<Record<string, number>>): Sprite => ({ rows: sprite.rows, palette: { ...sprite.palette, ...palette } });

/** A sprite built from parts stacked top to bottom (a head on a body on legs); all parts must be equally wide. */
export const stack = (palette: Readonly<Record<string, number>>, ...parts: readonly (readonly string[])[]): Sprite => ({ palette, rows: parts.flat() });

/** Swaps characters in the rows (e.g. open eyes for closed ones) without changing the palette. */
export function swapChars(sprite: Sprite, swaps: Readonly<Record<string, string>>): Sprite {
  const rows = sprite.rows.map((row) => [...row].map((c) => swaps[c] ?? c).join(''));
  return { palette: sprite.palette, rows };
}

/** A symmetric sprite from its left half: every row is the half plus the half mirrored. */
export const mirrored = (palette: Readonly<Record<string, number>>, halfRows: readonly string[]): Sprite => ({
  palette,
  rows: halfRows.map((half) => half + [...half].reverse().join('')),
});

/** The same sprite with a few pixels changed: each point is [x, y, character] ('.' clears a pixel). */
export function withPixels(sprite: Sprite, points: readonly (readonly [number, number, string])[]): Sprite {
  const rows = sprite.rows.map((row) => [...row]);
  for (const [x, y, char] of points) {
    const row = rows[y];
    if (row !== undefined && x >= 0 && x < row.length) row[x] = char;
  }
  return { palette: sprite.palette, rows: rows.map((row) => row.join('')) };
}

/** Moves the drawing up by `n` rows inside the same frame (rows fall off the top, see-through rows come in below). */
export function raised(sprite: Sprite, n: number): Sprite {
  const blank = '.'.repeat(spriteWidth(sprite));
  return { palette: sprite.palette, rows: [...sprite.rows.slice(n), ...Array.from({ length: n }, () => blank)] };
}
