import { FRAME_STYLES, frameImage } from '@/app/ui-art';
import { CAULDRON_FRAMES, CAULDRON_SIMMER } from '@/brewing/brewing-art';
import type { PixelImage } from '@/shared/pixels';
import { stripImage } from '@/shared/pixels';

/** A pixel image as a PNG data URL, for CSS (`border-image`, `background-image`). */
export function pixelDataUrl(image: PixelImage): string {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  canvas.getContext('2d')?.putImageData(new ImageData(new Uint8ClampedArray(image.data), image.width, image.height), 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * Hands the pixel art to the stylesheets as CSS variables, once: `--frame-parchment`, `--frame-wood` and `--frame-dark`
 * (9×9 frames for `border-image: var(--frame-…) 3 fill / 12px`) and `--mascot` (the grumpy cauldron simmering, four
 * frames side by side for a `steps(4)` animation).
 */
export function installPixelCss(): void {
  const style = document.documentElement.style;
  for (const [name, frame] of Object.entries(FRAME_STYLES)) style.setProperty(`--frame-${name}`, `url(${pixelDataUrl(frameImage(frame))})`);
  const simmer = CAULDRON_SIMMER.flatMap((i) => CAULDRON_FRAMES[i] ?? []);
  style.setProperty('--mascot', `url(${pixelDataUrl(stripImage(simmer))})`);
}
