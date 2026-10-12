import type { GameObjects, Scene, Textures } from 'phaser';
import { bubbleImage, FRAME_STYLES, type FrameName, ropeImage, signImage } from '@/app/ui-art';
import { PIXEL, type PixelImage, type Sprite, spriteHeight, spriteWidth, stripImage } from '@/shared/pixels';

/** Phaser's `Textures.FilterMode.NEAREST`, as a plain value so this file stays loadable without a browser (tests import views). */
const NEAREST = 1 as Textures.FilterMode;

/** Turns a pixel image into a texture that stays crisp when scaled (nearest-neighbour for this texture only, so text stays smooth). */
export function addImageTexture(scene: Scene, key: string, image: PixelImage, frameWidth = image.width): void {
  if (scene.textures.exists(key)) return;
  const texture = scene.textures.createCanvas(key, image.width, image.height);
  if (texture === null) return;
  texture.context.putImageData(new ImageData(new Uint8ClampedArray(image.data), image.width, image.height), 0, 0);
  for (let i = 0; i * frameWidth < image.width; i++) texture.add(i, 0, i * frameWidth, 0, frameWidth, image.height);
  texture.refresh();
  texture.setFilter(NEAREST);
}

/** A texture with one frame per sprite (frames 0, 1, 2 …), all as large as the largest frame. */
export function addStripTexture(scene: Scene, key: string, frames: readonly Sprite[]): void {
  const width = Math.max(...frames.map(spriteWidth));
  addImageTexture(scene, key, stripImage(frames), width);
}

/** An animation over frames of one texture; `repeat` -1 loops. Created once per game. */
export function addAnimation(scene: Scene, key: string, texture: string, frames: readonly number[], frameRate: number, repeat = -1): void {
  if (scene.anims.exists(key)) return;
  scene.anims.create({ key, frames: frames.map((frame) => ({ key: texture, frame })), frameRate, repeat });
}

/** A pixel-art sprite standing with its feet (bottom centre) at x, y, scaled up to design pixels. */
export function addPixelSprite(scene: Scene, x: number, y: number, texture: string, frame = 0): GameObjects.Sprite {
  return scene.add.sprite(x, y, texture, frame).setOrigin(0.5, 1).setScale(PIXEL);
}

/**
 * A pixel-art bubble or sign big enough for `textWidth` × `textHeight` design pixels of text (plus `pad` around it), made
 * once per size. Returns the texture key; the image is drawn at PIXEL scale.
 */
export function bubbleTexture(scene: Scene, textWidth: number, textHeight: number, frame: FrameName, tail: boolean, pad = 10): string {
  const w = Math.max(6, Math.ceil((textWidth + pad * 2) / PIXEL));
  const h = Math.max(5, Math.ceil((textHeight + pad) / PIXEL));
  const key = `bubble_${frame}_${w}x${h}${tail ? 't' : ''}`;
  addImageTexture(scene, key, bubbleImage(w, h, FRAME_STYLES[frame], tail));
  return key;
}

/** A wooden sign big enough for the text plus `pad` (design pixels) around it, made once per size. Returns the texture key. */
export function signTexture(scene: Scene, textWidth: number, textHeight: number, pad: number): string {
  const w = Math.ceil((textWidth + pad * 2) / PIXEL);
  const h = Math.ceil((textHeight + pad * 2) / PIXEL);
  const key = `sign_${w}x${h}`;
  addImageTexture(scene, key, signImage(w, h));
  return key;
}

/** A twisted rope `length` design pixels long, made once per length. */
export function ropeTexture(scene: Scene, length: number): string {
  const n = Math.round(length / PIXEL);
  const key = `rope_${n}`;
  addImageTexture(scene, key, ropeImage(n));
  return key;
}

/** The size of a sprite in design pixels. */
export const designSize = (sprite: Sprite): { w: number; h: number } => ({ w: spriteWidth(sprite) * PIXEL, h: spriteHeight(sprite) * PIXEL });
