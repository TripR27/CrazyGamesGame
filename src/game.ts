import { AUTO, Game, Scale } from 'phaser';
import { BACKGROUND_COLOR, GAME_HEIGHT, GAME_WIDTH } from '@/config';
import { BootScene } from '@/scene/boot-scene';
import type { SceneServices } from '@/scene/services';
import { TavernScene } from '@/scene/tavern-scene';

export function createGame(parent: string, services: SceneServices): Game {
  return new Game({
    type: AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: BACKGROUND_COLOR,
    scale: { mode: Scale.FIT, autoCenter: Scale.CENTER_BOTH },
    scene: [new BootScene(), new TavernScene(services)],
  });
}
