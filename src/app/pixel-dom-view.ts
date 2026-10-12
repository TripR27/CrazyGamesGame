import { hasIcons, ICONS, splitIcons } from '@/app/icon-art';
import { FRAME_STYLES, frameImage, panelFrameImage, paperImage, woodWallImage } from '@/app/ui-art';
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
 * Hands the pixel art to the stylesheets as CSS variables, once: `--frame-<style>` for every style in `FRAME_STYLES` and
 * `--frame-panel` (9×9 frames for `border-image: var(--frame-…) 3 fill / 12px`, or `/ 6px` for buttons), `--paper` and `--wood` (a parchment tile and a wooden-wall tile, 4× their size) and `--mascot` (the grumpy cauldron simmering, four
 * frames side by side for a `steps(4)` animation).
 */
export function installPixelCss(): void {
  const style = document.documentElement.style;
  for (const [name, frame] of Object.entries(FRAME_STYLES)) style.setProperty(`--frame-${name}`, `url(${pixelDataUrl(frameImage(frame))})`);
  style.setProperty('--frame-panel', `url(${pixelDataUrl(panelFrameImage())})`);
  style.setProperty('--paper', `url(${pixelDataUrl(paperImage())})`);
  style.setProperty('--wood', `url(${pixelDataUrl(woodWallImage())})`);
  const simmer = CAULDRON_SIMMER.flatMap((i) => CAULDRON_FRAMES[i] ?? []);
  style.setProperty('--mascot', `url(${pixelDataUrl(stripImage(simmer))})`);
}

const iconUrls = new Map<string, string>();

function iconUrl(icon: string): string {
  let url = iconUrls.get(icon);
  const art = ICONS[icon];
  if (url === undefined && art !== undefined) iconUrls.set(icon, (url = pixelDataUrl(stripImage([art]))));
  return url ?? '';
}

/** Replaces the icon emoji in one text node by pixel-icon images (not inside text fields). */
function replaceIcons(node: Text): void {
  const value = node.nodeValue ?? '';
  if (!hasIcons(value) || node.parentElement?.closest('textarea, input') !== null) return;
  const parts = document.createDocumentFragment();
  for (const part of splitIcons(value)) {
    if (part.icon === undefined) {
      parts.append(part.text);
      continue;
    }
    const img = document.createElement('img');
    img.className = 'px-icon';
    img.alt = part.icon;
    img.draggable = false;
    img.src = iconUrl(part.icon);
    parts.append(img);
  }
  node.replaceWith(parts);
}

function scan(node: Node): void {
  if (node.nodeType === Node.TEXT_NODE) replaceIcons(node as Text);
  else for (const child of Array.from(node.childNodes)) scan(child);
}

/**
 * Shows the icon emoji in the DOM (panels, buttons, windows) as pixel icons: every text that appears or changes under
 * `root` is checked. The texts themselves (i18n) keep the emoji.
 */
export function installPixelIcons(root: HTMLElement): void {
  scan(root);
  new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'characterData') scan(record.target);
      else record.addedNodes.forEach(scan);
    }
  }).observe(root, { childList: true, subtree: true, characterData: true });
}
