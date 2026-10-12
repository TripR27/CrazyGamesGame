import type { Scene } from 'phaser';
import { BREWER_KETTLE, BREWER_SPOT, READY_SLOTS, SLOP_BUCKET } from '@/app/layout';
import { addAnimation, addPixelSprite, addStripTexture, designSize } from '@/app/textures-view';
import type { World } from '@/app/world';
import { MUG } from '@/brewing/brewing-art';
import { discardPicked } from '@/serving/serving';
import { PIXEL } from '@/shared/pixels';
import { BREWER_FRAME, BREWER_FRAMES, BUCKET, KETTLE_BOIL, KETTLE_FRAMES, KETTLE_SIMMER } from '@/staff/staff-art';

const ANIM = {
  idle: 'brewer-idle',
  stir: 'brewer-stir',
  simmer: 'kettle-simmer',
  boil: 'kettle-boil',
} as const;
/** The brewer mostly stands still and blinks now and then. */
const IDLE_FRAMES = [0, 0, 0, 0, 0, 0, 0, 0, BREWER_FRAME.blink];
const FLY_MS = 350;
const MUG_SIZE = designSize(MUG);

export interface StaffView {
  update(): void;
}

function createAnimations(scene: Scene): void {
  addStripTexture(scene, 'brewer', BREWER_FRAMES);
  addStripTexture(scene, 'kettle', KETTLE_FRAMES);
  addStripTexture(scene, 'slop', [BUCKET]);
  addStripTexture(scene, 'mug', [MUG]);
  addAnimation(scene, ANIM.idle, 'brewer', IDLE_FRAMES, 4);
  addAnimation(scene, ANIM.stir, 'brewer', [BREWER_FRAME.stirA, BREWER_FRAME.stirB], 4);
  addAnimation(scene, ANIM.simmer, 'kettle', KETTLE_SIMMER, 3);
  addAnimation(scene, ANIM.boil, 'kettle', KETTLE_BOIL, 8);
}

/** The slop bucket in front of the bar: with a drink picked up, a click tips it in. A tutorial target (`bucket`). */
function createBucket(scene: Scene, world: World): void {
  const x = SLOP_BUCKET.x + SLOP_BUCKET.w / 2;
  const bucket = addPixelSprite(scene, x, SLOP_BUCKET.y + SLOP_BUCKET.h, 'slop');
  bucket.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
    discardPicked(world);
    scene.tweens.add({ targets: bucket, scaleY: { from: PIXEL * 0.85, to: PIXEL }, duration: 160 });
  });
  world.targets.register('bucket', () => SLOP_BUCKET);
}

/**
 * The brewer's corner at the right end of the bar: once a brewer is hired, they stand behind the counter and stir their
 * own kettle while a drink brews; a finished drink flies onto the bar. The slop bucket stands in front of the bar from
 * the start. Draw this before the drinks on the bar, so the mugs stand in front of the brewer.
 */
export function createStaffView(scene: Scene, world: World): StaffView {
  const { store, kettle, station, bus, content } = world;
  const brewers = content.upgrades.filter((u) => u.effect.stat === 'autoBrew');
  createAnimations(scene);
  const brewer = addPixelSprite(scene, BREWER_SPOT.x, BREWER_SPOT.y, 'brewer').play(ANIM.idle).setVisible(false);
  const pot = addPixelSprite(scene, BREWER_KETTLE.x, BREWER_KETTLE.y, 'kettle').play(ANIM.simmer).setVisible(false);
  createBucket(scene, world);
  const flying = addPixelSprite(scene, 0, 0, 'mug').setVisible(false).setDepth(40);

  let hired = false;
  const checkHired = (): void => {
    const levels = store.getState().upgrades;
    hired = brewers.some((u) => (levels[u.id] ?? 0) > 0);
  };
  checkHired();
  store.subscribe(checkHired);
  bus.on('brewer:done', () => {
    const slot = READY_SLOTS[station.ready.length - 1];
    if (slot === undefined) return;
    flying.setPosition(BREWER_KETTLE.x, BREWER_KETTLE.y - MUG_SIZE.h).setVisible(true);
    scene.tweens.add({ targets: flying, x: slot.x, y: slot.y, duration: FLY_MS, ease: 'Quad.easeOut', onComplete: () => flying.setVisible(false) });
  });

  let busy = false;
  return {
    update() {
      brewer.setVisible(hired);
      pot.setVisible(hired);
      const now = kettle.brewing !== null;
      if (now === busy) return;
      busy = now;
      brewer.play(now ? ANIM.stir : ANIM.idle);
      pot.play(now ? ANIM.boil : ANIM.simmer);
    },
  };
}
