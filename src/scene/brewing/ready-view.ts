import type { GameObjects, Scene } from 'phaser';
import type { TargetRegistry } from '@/core/target-registry';
import { textKey } from '@/data/text-key';
import { t } from '@/i18n';
import { READY_SLOTS } from '@/scene/layout';
import type { BrewStation } from '@/systems/brewing';

const MUG = { w: 30, h: 28, color: 0xd9a441, foam: 0xfff2cc, edge: 0x5e3a18, picked: 0xfff36b };
const PICK_LIFT = 8;
const HIT = { w: 56, h: 56 };
// Neighbouring labels are wider than the slot gap, so every other one stands higher.
const LABEL_LIFT = 20;
const LABEL_HEIGHT = 30;
const LABEL_STYLE = { fontFamily: 'sans-serif', fontSize: '13px', color: '#fff2cc', backgroundColor: '#2a1a0ccc' };

interface Spot {
  parts: GameObjects.Container;
  mug: GameObjects.Rectangle;
  label: GameObjects.Text;
  shown: string | null;
}

export interface ReadyView {
  update(): void;
}

export interface ReadyViewDeps {
  station: BrewStation;
  /** The drink the player picked up; the first matching drink on the bar lights up. */
  selected(): string | null;
  onClick(slot: number): void;
  targets: TargetRegistry;
}

function createSpot(scene: Scene, x: number, y: number, raised: boolean, onClick: () => void): Spot {
  const mug = scene.add.rectangle(0, -MUG.h / 2, MUG.w, MUG.h, MUG.color).setStrokeStyle(2, MUG.edge);
  const foam = scene.add.rectangle(0, -MUG.h - 2, MUG.w, 6, MUG.foam);
  const label = scene.add.text(0, -MUG.h - 12 - (raised ? LABEL_LIFT : 0), '', LABEL_STYLE).setOrigin(0.5, 1);
  // A hit area a bit larger than the mug, so it is easy to grab.
  const hit = scene.add.rectangle(0, -MUG.h / 2 - 6, HIT.w, HIT.h, 0xffffff, 0.001);
  const parts = scene.add.container(x, y, [hit, mug, foam, label]).setVisible(false);
  hit.setInteractive({ useHandCursor: true }).on('pointerdown', onClick);
  return { parts, mug, label, shown: null };
}

/** The finished drinks standing on the bar, one per slot. Click one to pick it up for a customer. */
export function createReadyView(scene: Scene, { station, selected, onClick, targets }: ReadyViewDeps): ReadyView {
  const spots = READY_SLOTS.map((slot, i) => createSpot(scene, slot.x, slot.y, i % 2 === 1, () => onClick(i)));
  spots.forEach((spot, i) => {
    const slot = READY_SLOTS[i] ?? { x: 0, y: 0 };
    // The mug and its name label, so the tutorial arrow sits above the label instead of on it.
    const top = slot.y - MUG.h - LABEL_HEIGHT - (i % 2 === 1 ? LABEL_LIFT : 0);
    const box = { x: slot.x - MUG.w / 2, y: top, w: MUG.w, h: slot.y - top };
    targets.register(`drink:${i}`, () => (spot.shown === null ? null : box));
  });

  return {
    update() {
      const picked = selected();
      const litSlot = picked === null ? -1 : station.ready.indexOf(picked);
      spots.forEach((spot, i) => {
        const id = i < station.capacity ? station.ready[i] ?? null : null;
        const lit = i === litSlot;
        spot.mug.setStrokeStyle(lit ? 4 : 2, lit ? MUG.picked : MUG.edge);
        spot.parts.setY((READY_SLOTS[i]?.y ?? 0) - (lit ? PICK_LIFT : 0));
        if (id === spot.shown) return;
        spot.shown = id;
        spot.parts.setVisible(id !== null);
        if (id !== null) spot.label.setText(t(textKey('recipes', id, 'name')));
      });
    },
  };
}
