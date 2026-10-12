// Pixel-art preview: `npm run pixel:preview` writes PNG previews of the game's art to art/pixel/.
// The art itself lives in the TypeScript code (src/**/*-art.ts); Vite loads it, like the simulator does.
import { mkdirSync, writeFileSync } from 'node:fs';
import { createServer } from 'vite';
import { upscale } from './canvas.mjs';
import { encodePng } from './png.mjs';

const OUT_DIR = 'art/pixel';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { artPreviews } = await server.ssrLoadModule('/src/dev/art-preview.ts');
  mkdirSync(OUT_DIR, { recursive: true });
  for (const { name, image, scale } of artPreviews()) {
    const file = name.startsWith('thumbnail') ? `${name}.png` : `${name}-${scale}x.png`;
    writeFileSync(`${OUT_DIR}/${file}`, encodePng(upscale(image, scale)));
  }
  console.log(`wrote previews to ${OUT_DIR}/`);
} finally {
  await server.close();
}
