import { type GameObjects, type Scene, Textures } from 'phaser';
import { PIXEL, type PixelImage, type Sprite, spriteHeight, spriteWidth, stripImage } from '@/shared/pixels';

/** Turns a pixel image into a texture that stays crisp when scaled (nearest-neighbour for this texture only, so text stays smooth). */
export function addImageTexture(scene: Scene, key: string, image: PixelImage, frameWidth = image.width): void {
  if (scene.textures.exists(key)) return;
  const texture = scene.textures.createCanvas(key, image.width, image.height);
  if (texture === null) return;
  texture.context.putImageData(new ImageData(new Uint8ClampedArray(image.data), image.width, image.height), 0, 0);
  for (let i = 0; i * frameWidth < image.width; i++) texture.add(i, 0, i * frameWidth, 0, frameWidth, image.height);
  texture.refresh();
  texture.setFilter(Textures.FilterMode.NEAREST);
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

/** The size of a sprite in design pixels. */
export const designSize = (sprite: Sprite): { w: number; h: number } => ({ w: spriteWidth(sprite) * PIXEL, h: spriteHeight(sprite) * PIXEL });
