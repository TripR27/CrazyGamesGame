import type { Scene } from 'phaser';
import { drawBackdropArt } from '@/app/backdrop-art';
import { addImageTexture } from '@/app/textures-view';
import { PIXEL } from '@/shared/pixels';

const BACKDROP_KEY = 'backdrop';

/** The static tavern in pixel art (walls, floor, door, window, hearth, shelf, tables, bar and stools) as one image. */
export function addBackdrop(scene: Scene): void {
  addImageTexture(scene, BACKDROP_KEY, drawBackdropArt());
  scene.add.image(0, 0, BACKDROP_KEY).setOrigin(0).setScale(PIXEL);
}
