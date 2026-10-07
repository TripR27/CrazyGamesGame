import type { GameObjects, Scene } from 'phaser';
import { ingredientColor } from '@/scene/brewing/ingredient-look';
import { CAULDRON } from '@/scene/layout';
import type { TargetRegistry } from '@/shared/targets';
import { brewProgress } from '@/systems/brewing/advance';
import type { BrewStation } from '@/systems/brewing/types';

const MAX_DOTS = 3;
const DOT_RADIUS = 10;
const DOT_Y = CAULDRON.y - 25;
const BAR_WIDTH = 100;
const BAR_Y = CAULDRON.y - 48;
const CENTER_X = CAULDRON.x + CAULDRON.w / 2;

export interface CauldronView {
  update(): void;
}

/** Click target on the cauldron, the ingredients inside and the brew progress bar. */
export function createCauldronView(
  scene: Scene,
  station: BrewStation,
  onClick: () => void,
  targets: TargetRegistry,
): CauldronView {
  targets.register('cauldron', () => CAULDRON);
  scene.add
    .zone(CENTER_X, CAULDRON.y + CAULDRON.h / 2, CAULDRON.w, CAULDRON.h)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', onClick);

  const dots: GameObjects.Arc[] = Array.from({ length: MAX_DOTS }, (_, i) =>
    scene.add
      .circle(CENTER_X + (i - 1) * 30, DOT_Y, DOT_RADIUS, 0xffffff)
      .setStrokeStyle(2, 0x2a1a0c)
      .setVisible(false),
  );
  const track = scene.add.rectangle(CENTER_X, BAR_Y, BAR_WIDTH, 8, 0x2a1a0c).setVisible(false);
  const fill = scene.add.rectangle(CENTER_X - BAR_WIDTH / 2, BAR_Y, 0, 8, 0x7be05a).setOrigin(0, 0.5).setVisible(false);

  return {
    update() {
      dots.forEach((dot, i) => {
        const id = station.contents[i];
        dot.setVisible(id !== undefined);
        if (id !== undefined) dot.setFillStyle(ingredientColor(id));
      });
      const brewing = station.brewing !== null;
      track.setVisible(brewing);
      fill.setVisible(brewing).setSize(BAR_WIDTH * brewProgress(station), 8);
    },
  };
}
