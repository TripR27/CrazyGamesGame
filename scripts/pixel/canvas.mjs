export function createCanvas(width, height) {
  return { width, height, data: new Uint8Array(width * height * 4) };
}

export function setPixel(canvas, x, y, color) {
  if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return;
  const i = (y * canvas.width + x) * 4;
  canvas.data.set([(color >> 16) & 255, (color >> 8) & 255, color & 255, 255], i);
}

export function fillRect(canvas, x, y, w, h, color) {
  for (let py = y; py < y + h; py++) {
    for (let px = x; px < x + w; px++) setPixel(canvas, px, py, color);
  }
}

/** Draws a parsed sprite ({ width, height, pixels: (color|null)[] }) at x, y. */
export function blit(canvas, sprite, x, y) {
  sprite.pixels.forEach((color, i) => {
    if (color !== null) setPixel(canvas, x + (i % sprite.width), y + Math.floor(i / sprite.width), color);
  });
}

/** Nearest-neighbour upscale, so pixels stay crisp. */
export function upscale(canvas, factor) {
  const out = createCanvas(canvas.width * factor, canvas.height * factor);
  for (let y = 0; y < out.height; y++) {
    for (let x = 0; x < out.width; x++) {
      const from = (Math.floor(y / factor) * canvas.width + Math.floor(x / factor)) * 4;
      out.data.set(canvas.data.subarray(from, from + 4), (y * out.width + x) * 4);
    }
  }
  return out;
}
