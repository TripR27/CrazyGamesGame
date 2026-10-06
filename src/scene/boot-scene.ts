import { Scene } from 'phaser';
import { TAVERN_SCENE_KEY } from '@/scene/tavern-scene';

export const BOOT_SCENE_KEY = 'boot';

/** Entry scene. Asset loading joins here in the art pass; for now everything is drawn in code. */
export class BootScene extends Scene {
  constructor() {
    super(BOOT_SCENE_KEY);
  }

  create(): void {
    this.scene.start(TAVERN_SCENE_KEY);
  }
}
