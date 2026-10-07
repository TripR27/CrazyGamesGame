import type { Scene } from 'phaser';
import type { Graphics } from '@/app/backdrop-view';
import { DECOR_SPOTS, PALETTE, type Rect } from '@/app/layout';
import type { World } from '@/app/world';
import { DECORATIONS } from '@/decor/decor';

/** Placeholder drawing per decoration (step 21 replaces it with pixel art). A new decoration is one more entry. */
type Draw = (g: Graphics, r: Rect) => void;

const GOLD = 0xf5c542;
const GLOW_ALPHA = 0.18;

/** A torch in an iron bracket on the wall, with a soft glow around the flame. */
const torch = (flame: number): Draw => (g, r) => {
  const cx = r.x + r.w / 2;
  g.fillStyle(flame, GLOW_ALPHA).fillCircle(cx, r.y + 14, 30);
  g.fillStyle(0x45454f, 1).fillRect(cx - 10, r.y + 52, 20, 6).fillRect(cx - 3, r.y + 52, 6, r.h - 52);
  g.fillStyle(PALETTE.woodDark, 1).fillRect(cx - 4, r.y + 26, 8, 30);
  g.fillStyle(flame, 1).fillTriangle(cx - 11, r.y + 28, cx, r.y, cx + 11, r.y + 28);
  g.fillStyle(GOLD, 1).fillTriangle(cx - 5, r.y + 28, cx, r.y + 12, cx + 5, r.y + 28);
};

/** A flat rug on the floor with a striped border. */
const rug = (base: number, border: number): Draw => (g, r) => {
  g.fillStyle(border, 1).fillRect(r.x, r.y, r.w, r.h);
  g.fillStyle(base, 1).fillRect(r.x + 6, r.y + 4, r.w - 12, r.h - 8);
  g.fillStyle(border, 1);
  for (let x = r.x + 24; x < r.x + r.w - 24; x += 48) g.fillRect(x, r.y + r.h / 2 - 2, 20, 4);
};

/** A wooden shield-shaped plaque on the wall; the trophy is drawn on top. */
function plaque(g: Graphics, r: Rect): void {
  g.fillStyle(PALETTE.woodDark, 1).fillRect(r.x + 10, r.y + 6, r.w - 20, r.h - 30);
  g.fillTriangle(r.x + 10, r.y + r.h - 24, r.x + r.w / 2, r.y + r.h, r.x + r.w - 10, r.y + r.h - 24);
}

const DRAWINGS: Readonly<Record<string, Draw>> = {
  wall_torch: torch(PALETTE.fireOuter),
  everburning_torch: torch(0x5ad1ff),
  woven_rug: rug(0x3f6fa8, 0xd8c79a),
  royal_carpet: rug(0xa8243a, GOLD),
  // A grumpy boar head with white tusks.
  boar_trophy: (g, r) => {
    const cx = r.x + r.w / 2;
    plaque(g, r);
    g.fillStyle(0x6b4a2e, 1).fillEllipse(cx, r.y + 40, 54, 44);
    g.fillStyle(0x8a6142, 1).fillEllipse(cx, r.y + 54, 26, 18);
    g.fillStyle(0xfff2cc, 1).fillTriangle(cx - 14, r.y + 52, cx - 20, r.y + 36, cx - 8, r.y + 50).fillTriangle(cx + 14, r.y + 52, cx + 20, r.y + 36, cx + 8, r.y + 50);
    g.fillStyle(0x1a1a1a, 1).fillCircle(cx - 12, r.y + 32, 3).fillCircle(cx + 12, r.y + 32, 3);
  },
  // A golden tankard with a handle.
  golden_tankard: (g, r) => {
    const cx = r.x + r.w / 2;
    plaque(g, r);
    g.lineStyle(5, GOLD, 1).strokeCircle(cx + 18, r.y + 40, 10);
    g.fillStyle(GOLD, 1).fillRect(cx - 18, r.y + 22, 34, 40);
    g.fillStyle(0xfff2cc, 1).fillRect(cx - 18, r.y + 18, 34, 8);
  },
};

export interface DecorView {
  update(): void;
}

/** The bought decorations downstairs, on one Graphics object that is redrawn only when a decoration is bought. */
export function createDecorView(scene: Scene, world: World): DecorView {
  const g = scene.add.graphics();
  const { store, targets } = world;
  const owned = (id: string): boolean => store.getState().decorBought.includes(id);
  for (const def of DECORATIONS) {
    const spot = DECOR_SPOTS[def.id];
    if (spot !== undefined) targets.register(`decor:${def.id}`, () => (owned(def.id) ? spot : null));
  }
  let drawn = -1;
  return {
    update() {
      const bought = store.getState().decorBought;
      if (bought.length === drawn) return;
      drawn = bought.length;
      g.clear();
      for (const def of DECORATIONS) {
        const spot = DECOR_SPOTS[def.id];
        if (spot !== undefined && bought.includes(def.id)) DRAWINGS[def.id]?.(g, spot);
      }
    },
  };
}
