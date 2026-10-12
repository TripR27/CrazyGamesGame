import type { GameObjects, Scene } from 'phaser';
import { CAULDRON, FLOOR_Y, INGREDIENT_SLOTS, SHELF, SHELF_GAP, READY_SLOTS } from '@/app/layout';
import { addAnimation, addPixelSprite, addStripTexture, designSize } from '@/app/textures-view';
import { brewProgress, type BrewStation } from '@/brewing/brewing';
import { CAULDRON_BOIL, CAULDRON_FRAMES, CAULDRON_SIMMER, FIRE_FRAMES, MUG as MUG_ART } from '@/brewing/brewing-art';
import { ingredientArt } from '@/brewing/ingredient-art';
import { PIXEL } from '@/shared/pixels';
import { t } from '@/i18n/translator';
import { textKey } from '@/shared/content';
import type { TargetRegistry } from '@/shared/targets';

/** The main colour of each ingredient, for the recipe book (DOM) and anything else that needs a colour, not the art. */
const COLORS: Readonly<Record<string, number>> = {
  swamp_slime: 0x7be05a,
  wild_honey: 0xf5c542,
  glowcap: 0x58d6d0,
  fire_pepper: 0xe2563b,
  moon_grape: 0x7a5fd1,
  troll_sweat: 0x9aa86a,
  bog_pearl: 0xe8e4f0,
  witch_moss: 0x3f7a4a,
};

/** A dungeon ingredient that ran out stays on the shelf, greyed out. */
const EMPTY_TINT = 0x6b6b6b;
const COUNT_STYLE = { fontFamily: 'sans-serif', fontSize: '12px', color: '#3b2410', backgroundColor: '#f2dfb0', padding: { x: 3, y: 1 } };

const FALLBACK = 0xcccccc;

export const ingredientColor = (id: string): number => COLORS[id] ?? FALLBACK;

/** The texture of an ingredient's pixel art (made the first time it is asked for). */
export function ingredientTexture(scene: Scene, id: string): string {
  const key = `ingredient_${id}`;
  addStripTexture(scene, key, [ingredientArt(id)]);
  return key;
}

/** Ingredients in a cauldron are shown at half the size of the ones on the shelf. */
export const IN_POT_SCALE = PIXEL / 2;

/** A small ingredient picture that shows what is in a cauldron; `show` only changes the texture when the ingredient changes. */
export function createPotItem(scene: Scene, x: number, y: number): { image: GameObjects.Image; show(id: string | undefined): void } {
  const image = scene.add.image(x, y, '__DEFAULT').setScale(IN_POT_SCALE).setVisible(false);
  let shown: string | undefined;
  return {
    image,
    show(id) {
      image.setVisible(id !== undefined);
      if (id === undefined || id === shown) return;
      shown = id;
      image.setTexture(ingredientTexture(scene, id));
    },
  };
}

const MAX_DOTS = 3;
const DOT_Y = CAULDRON.y - 25;
const BAR_WIDTH = 100;
const BAR_Y = CAULDRON.y - 48;
const CENTER_X = CAULDRON.x + CAULDRON.w / 2;

export interface CauldronView {
  update(): void;
}

const ANIM = { simmer: 'cauldron-simmer', boil: 'cauldron-boil', fire: 'fire' } as const;

/** The grumpy cauldron over its fire: it simmers, and boils while a drink brews. Returns a function that sets which. */
function createPot(scene: Scene): (boiling: boolean) => void {
  addStripTexture(scene, 'cauldron', CAULDRON_FRAMES);
  addStripTexture(scene, 'fire', FIRE_FRAMES);
  addAnimation(scene, ANIM.simmer, 'cauldron', CAULDRON_SIMMER, 5);
  addAnimation(scene, ANIM.boil, 'cauldron', CAULDRON_BOIL, 10);
  addAnimation(scene, ANIM.fire, 'fire', [0, 1, 2], 8);
  addPixelSprite(scene, CENTER_X, FLOOR_Y, 'fire').play(ANIM.fire);
  const pot = addPixelSprite(scene, CENTER_X, FLOOR_Y, 'cauldron').play(ANIM.simmer);
  let boiling = false;
  return (now) => {
    if (now === boiling) return;
    boiling = now;
    pot.play(now ? ANIM.boil : ANIM.simmer);
  };
}

/** The cauldron with its fire, a click target on it, the ingredients inside and the brew progress bar. */
export function createCauldronView(
  scene: Scene,
  station: BrewStation,
  onClick: () => void,
  targets: TargetRegistry,
): CauldronView {
  targets.register('cauldron', () => CAULDRON);
  const setBoiling = createPot(scene);
  scene.add
    .zone(CENTER_X, CAULDRON.y + CAULDRON.h / 2, CAULDRON.w, CAULDRON.h)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', onClick);

  const dots = Array.from({ length: MAX_DOTS }, (_, i) => createPotItem(scene, CENTER_X + (i - 1) * 30, DOT_Y));
  const track = scene.add.rectangle(CENTER_X, BAR_Y, BAR_WIDTH, 8, 0x2a1a0c).setVisible(false);
  const fill = scene.add.rectangle(CENTER_X - BAR_WIDTH / 2, BAR_Y, 0, 8, 0x7be05a).setOrigin(0, 0.5).setVisible(false);

  return {
    update() {
      for (let i = 0; i < dots.length; i++) dots[i]?.show(station.contents[i]);
      const brewing = station.brewing !== null;
      setBoiling(brewing);
      track.setVisible(brewing);
      fill.setVisible(brewing).setSize(BAR_WIDTH * brewProgress(station), 8);
    },
  };
}

const RADIUS = 22;
const HOVER_SCALE = PIXEL * 1.12;
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
  /** Rebuilds the shelf when the set of ingredients changed, and keeps the stock counts up to date. Call every frame. */
  update(): void;
}

/** A dungeon ingredient's stock on the shelf: a small count on the jar, and grey when it ran out. */
interface Counter {
  id: string;
  dot: GameObjects.Sprite;
  text: GameObjects.Text;
  shown: number;
}

function createItem(scene: Scene, id: string, slot: { x: number; y: number }, onClick: (id: string) => void) {
  const dot = addPixelSprite(scene, slot.x, SHELF.y, ingredientTexture(scene, id));
  const label = scene.add
    .text(slot.x, SHELF.y + SHELF.h + 10, t(textKey('ingredients', id, 'name')), LABEL_STYLE)
    .setOrigin(0.5, 0);
  dot.setInteractive({ useHandCursor: true });
  dot.on('pointerover', () => dot.setScale(HOVER_SCALE));
  dot.on('pointerout', () => dot.setScale(PIXEL));
  dot.on('pointerdown', () => {
    onClick(id);
    scene.tweens.add({ targets: dot, scale: { from: PIXEL * 1.3, to: HOVER_SCALE }, duration: 120 });
  });
  return { dot, label };
}

function createCounter(scene: Scene, id: string, dot: GameObjects.Sprite): Counter {
  const text = scene.add.text(dot.x + RADIUS - 2, dot.y - 2 * RADIUS + 2, '', COUNT_STYLE).setOrigin(0.5);
  return { id, dot, text, shown: -1 };
}

function showCount(counter: Counter, n: number): void {
  if (n === counter.shown) return;
  counter.shown = n;
  counter.text.setText(t('shelf.count', { n }));
  if (n > 0) counter.dot.clearTint().setAlpha(1);
  else counter.dot.setTint(EMPTY_TINT).setAlpha(0.6);
}

export interface ShelfDeps {
  getShelf(): readonly string[];
  /** The stock of a dungeon ingredient, or null for one that never runs out. */
  getCount(ingredientId: string): number | null;
  onClick(ingredientId: string): void;
  targets: TargetRegistry;
}

/** The clickable ingredients on the wall shelf; dungeon ingredients show how many are left. */
export function createShelfView(scene: Scene, { getShelf, getCount, onClick, targets }: ShelfDeps): ShelfView {
  let shown = '';
  let objects: GameObjects.GameObject[] = [];
  let unregister: Array<() => void> = [];
  let counters: Counter[] = [];

  return {
    update() {
      for (const counter of counters) showCount(counter, getCount(counter.id) ?? 0);
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
      const items = ids.flatMap((id, i) => {
        const slot = INGREDIENT_SLOTS[i];
        return slot === undefined ? [] : [{ id, ...createItem(scene, id, slot, onClick) }];
      });
      counters = items.filter(({ id }) => getCount(id) !== null).map(({ id, dot }) => createCounter(scene, id, dot));
      objects = [...items.flatMap(({ dot, label }) => [dot, label]), ...counters.map((c) => c.text)];
      for (const counter of counters) showCount(counter, getCount(counter.id) ?? 0);
    },
  };
}

const MUG = { ...designSize(MUG_ART), picked: 0xfff36b };
const PICK_LIFT = 8;
const HIT = { w: 56, h: 56 };
// Neighbouring labels are wider than the slot gap, so every other one stands higher.
const LABEL_LIFT = 20;
const LABEL_HEIGHT = 30;
const READY_LABEL_STYLE = { fontFamily: 'sans-serif', fontSize: '13px', color: '#fff2cc', backgroundColor: '#2a1a0ccc' };

interface Spot {
  parts: GameObjects.Container;
  mug: GameObjects.Sprite;
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
  const mug = addPixelSprite(scene, 0, 0, 'mug');
  const label = scene.add.text(0, -MUG.h - 6 - (raised ? LABEL_LIFT : 0), '', READY_LABEL_STYLE).setOrigin(0.5, 1);
  // A hit area a bit larger than the mug, so it is easy to grab.
  const hit = scene.add.rectangle(0, -MUG.h / 2 - 4, HIT.w, HIT.h, 0xffffff, 0.001);
  const parts = scene.add.container(x, y, [hit, mug, label]).setVisible(false);
  hit.setInteractive({ useHandCursor: true }).on('pointerdown', onClick);
  return { parts, mug, label, shown: null };
}

/** The finished drinks standing on the bar, one per slot. Click one to pick it up for a customer. */
export function createReadyView(scene: Scene, { station, selected, onClick, targets }: ReadyViewDeps): ReadyView {
  addStripTexture(scene, 'mug', [MUG_ART]);
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
        if (lit) spot.mug.setTint(MUG.picked);
        else spot.mug.clearTint();
        spot.parts.setY((READY_SLOTS[i]?.y ?? 0) - (lit ? PICK_LIFT : 0));
        if (id === spot.shown) return;
        spot.shown = id;
        spot.parts.setVisible(id !== null);
        if (id !== null) spot.label.setText(t(textKey('recipes', id, 'name')));
      });
    },
  };
}
