export function createCanvas(width, height) {
  return { width, height, data: new Uint8Array(width * height * 4) };
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
