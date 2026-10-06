import { AUTO, Game, Scale } from 'phaser';
import { BACKGROUND_COLOR, GAME_HEIGHT, GAME_WIDTH } from '@/config';
import { HelloScene } from '@/scene/hello-scene';

export function createGame(parent: string): Game {
  return new Game({
    type: AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: BACKGROUND_COLOR,
    scale: { mode: Scale.FIT, autoCenter: Scale.CENTER_BOTH },
    scene: [HelloScene],
  });
}
