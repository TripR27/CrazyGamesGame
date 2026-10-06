import type { GameObjects, Scene } from 'phaser';
import { textKey } from '@/data/text-key';
import { t } from '@/i18n';
import { READY_SLOTS } from '@/scene/layout';
import type { BrewStation } from '@/systems/brewing';

const MUG = { w: 30, h: 28, color: 0xd9a441, foam: 0xfff2cc };
const LABEL_STYLE = { fontFamily: 'sans-serif', fontSize: '13px', color: '#fff2cc', backgroundColor: '#2a1a0ccc' };

interface Spot {
  mug: GameObjects.Rectangle;
  foam: GameObjects.Rectangle;
  label: GameObjects.Text;
  shown: string | null;
}

export interface ReadyView {
  update(): void;
}

function createSpot(scene: Scene, x: number, y: number): Spot {
  const mug = scene.add.rectangle(x, y - MUG.h / 2, MUG.w, MUG.h, MUG.color).setStrokeStyle(2, 0x5e3a18);
  const foam = scene.add.rectangle(x, y - MUG.h - 2, MUG.w, 6, MUG.foam);
  const label = scene.add.text(x, y - MUG.h - 12, '', LABEL_STYLE).setOrigin(0.5, 1);
  for (const part of [mug, foam, label]) part.setVisible(false);
  return { mug, foam, label, shown: null };
}

/** The finished drinks standing on the bar, one per slot. */
export function createReadyView(scene: Scene, station: BrewStation): ReadyView {
  const spots = READY_SLOTS.map((slot) => createSpot(scene, slot.x, slot.y));

  return {
    update() {
      spots.forEach((spot, i) => {
        const id = i < station.capacity ? station.ready[i] ?? null : null;
        if (id === spot.shown) return;
        spot.shown = id;
        for (const part of [spot.mug, spot.foam, spot.label]) part.setVisible(id !== null);
        if (id !== null) spot.label.setText(t(textKey('recipes', id, 'name')));
      });
    },
  };
}
