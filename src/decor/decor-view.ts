import type { GameObjects, Scene } from 'phaser';
import { DECOR_SPOTS, type Rect } from '@/app/layout';
import { addAnimation, addImageTexture, addPixelSprite, addStripTexture } from '@/app/textures-view';
import type { World } from '@/app/world';
import { DECORATIONS } from '@/decor/decor';
import { rugImage, TORCHES, TROPHIES } from '@/decor/decor-art';
import { PIXEL } from '@/shared/pixels';

/** The warm (or blue) light around a torch flame; it breathes slowly. */
const GLOW = { radius: 34, alpha: 0.16, colours: { wall_torch: 0xe8641a, everburning_torch: 0x5ad1ff } as Readonly<Record<string, number>> };

/** Makes the picture of one decoration at its spot (hidden until bought); null for a decoration without art. */
function createDecoration(scene: Scene, id: string, spot: Rect): GameObjects.Components.Visible[] | null {
  const torch = TORCHES[id];
  if (torch !== undefined) {
    const key = `decor_${id}`;
    addStripTexture(scene, key, torch);
    addAnimation(scene, key, key, [0, 1, 2, 1], 7);
    const glow = scene.add.circle(spot.x + spot.w / 2, spot.y + 12, GLOW.radius, GLOW.colours[id] ?? 0xffffff, GLOW.alpha);
    scene.tweens.add({ targets: glow, scale: 1.15, alpha: GLOW.alpha * 0.6, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return [glow, addPixelSprite(scene, spot.x + spot.w / 2, spot.y + spot.h, key).play(key)];
  }
  const image = TROPHIES[id]?.() ?? rugImage(id, Math.round(spot.w / PIXEL), Math.round(spot.h / PIXEL));
  if (image === null) return null;
  addImageTexture(scene, `decor_${id}`, image);
  return [scene.add.image(spot.x, spot.y, `decor_${id}`).setOrigin(0).setScale(PIXEL)];
}

export interface DecorView {
  update(): void;
}

/** The bought decorations downstairs in pixel art; each one appears when it is bought (checked only when that count changes). */
export function createDecorView(scene: Scene, world: World): DecorView {
  const { store, targets } = world;
  const owned = (id: string): boolean => store.getState().decorBought.includes(id);
  const shown = DECORATIONS.flatMap((def) => {
    const spot = DECOR_SPOTS[def.id];
    if (spot === undefined) return [];
    targets.register(`decor:${def.id}`, () => (owned(def.id) ? spot : null));
    const parts = createDecoration(scene, def.id, spot) ?? [];
    for (const part of parts) part.setVisible(false);
    return [{ id: def.id, parts }];
  });
  let drawn = -1;
  return {
    update() {
      const bought = store.getState().decorBought;
      if (bought.length === drawn) return;
      drawn = bought.length;
      for (const { id, parts } of shown) for (const part of parts) part.setVisible(bought.includes(id));
    },
  };
}
