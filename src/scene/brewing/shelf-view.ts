import type { GameObjects, Scene } from 'phaser';
import type { TargetRegistry } from '@/core/target-registry';
import { textKey } from '@/data/text-key';
import { t } from '@/i18n';
import { INGREDIENT_SLOTS, SHELF, SHELF_GAP } from '@/scene/layout';
import { ingredientColor } from './ingredient-look';

const RADIUS = 22;
const LABEL_STYLE = {
  fontFamily: 'sans-serif',
  fontSize: '13px',
  color: '#fff2cc',
  align: 'center',
  // Labels wrap to the width of one shelf slot so neighbours never overlap.
  wordWrap: { width: SHELF_GAP - 6 },
  stroke: '#2a1a0c',
  strokeThickness: 3,
};

export interface ShelfView {
  /** Rebuilds the shelf when the set of ingredients changed. Call every frame. */
  update(): void;
}

function createItem(scene: Scene, id: string, slot: { x: number; y: number }, onClick: (id: string) => void) {
  const dot = scene.add.circle(slot.x, slot.y, RADIUS, ingredientColor(id)).setStrokeStyle(3, 0x2a1a0c);
  const label = scene.add
    .text(slot.x, SHELF.y + SHELF.h + 10, t(textKey('ingredients', id, 'name')), LABEL_STYLE)
    .setOrigin(0.5, 0);
  dot.setInteractive({ useHandCursor: true });
  dot.on('pointerover', () => dot.setScale(1.12));
  dot.on('pointerout', () => dot.setScale(1));
  dot.on('pointerdown', () => {
    onClick(id);
    scene.tweens.add({ targets: dot, scale: { from: 1.3, to: 1.12 }, duration: 120 });
  });
  return [dot, label];
}

/** The clickable ingredients on the wall shelf. */
export function createShelfView(
  scene: Scene,
  getShelf: () => readonly string[],
  onClick: (ingredientId: string) => void,
  targets: TargetRegistry,
): ShelfView {
  let shown = '';
  let objects: GameObjects.GameObject[] = [];
  let unregister: Array<() => void> = [];

  return {
    update() {
      const ids = getShelf().slice(0, INGREDIENT_SLOTS.length);
      const key = ids.join(',');
      if (key === shown) return;
      shown = key;
      for (const object of objects) object.destroy();
      for (const remove of unregister) remove();
      unregister = ids.flatMap((id, i) => {
        const slot = INGREDIENT_SLOTS[i];
        const bounds = slot && { x: slot.x - RADIUS, y: slot.y - RADIUS, w: RADIUS * 2, h: RADIUS * 2 };
        return bounds ? [targets.register(`ingredient:${id}`, () => bounds)] : [];
      });
      objects = ids.flatMap((id, i) => {
        const slot = INGREDIENT_SLOTS[i];
        return slot === undefined ? [] : createItem(scene, id, slot, onClick);
      });
    },
  };
}
