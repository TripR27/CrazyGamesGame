import type { GameObjects, Scene } from 'phaser';
import { CAULDRON, INGREDIENT_SLOTS, SHELF, SHELF_GAP, READY_SLOTS } from '@/app/layout';
import { brewProgress, type BrewStation } from '@/brewing/brewing';
import { t } from '@/i18n/translator';
import { textKey } from '@/shared/content';
import type { TargetRegistry } from '@/shared/targets';

/** Placeholder look per ingredient: just a colour. The art pass replaces this with sprites. */
const COLORS: Readonly<Record<string, number>> = {
  swamp_slime: 0x7be05a,
  wild_honey: 0xf5c542,
  glowcap: 0x58d6d0,
  fire_pepper: 0xe2563b,
  moon_grape: 0x7a5fd1,
  troll_sweat: 0x9aa86a,
};

const FALLBACK = 0xcccccc;

export const ingredientColor = (id: string): number => COLORS[id] ?? FALLBACK;

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

const MUG = { w: 30, h: 28, color: 0xd9a441, foam: 0xfff2cc, edge: 0x5e3a18, picked: 0xfff36b };
const PICK_LIFT = 8;
const HIT = { w: 56, h: 56 };
// Neighbouring labels are wider than the slot gap, so every other one stands higher.
const LABEL_LIFT = 20;
const LABEL_HEIGHT = 30;
const READY_LABEL_STYLE = { fontFamily: 'sans-serif', fontSize: '13px', color: '#fff2cc', backgroundColor: '#2a1a0ccc' };

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
  const label = scene.add.text(0, -MUG.h - 12 - (raised ? LABEL_LIFT : 0), '', READY_LABEL_STYLE).setOrigin(0.5, 1);
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
