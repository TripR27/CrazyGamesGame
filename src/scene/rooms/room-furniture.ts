import type { Rect } from '@/scene/layout';
import type { Graphics } from '@/scene/sprites/draw';

/** Placeholder furniture per room (step 21 replaces it with pixel art). A new room is one more entry. */
type Furnish = (g: Graphics, r: Rect) => void;

const floorY = (r: Rect): number => r.y + r.h;

const FURNITURE: Readonly<Record<string, Furnish>> = {
  // A long table with three customer places.
  extension: (g, r) => {
    g.fillStyle(0x8b5a2b, 1).fillRect(r.x + 40, floorY(r) - 46, r.w - 80, 12);
    g.fillStyle(0x5e3a18, 1).fillRect(r.x + 50, floorY(r) - 34, 10, 34).fillRect(r.x + r.w - 60, floorY(r) - 34, 10, 34);
  },
  // Shelves with bubbling flasks and a small cauldron.
  alchemy_lab: (g, r) => {
    g.fillStyle(0x5e3a18, 1).fillRect(r.x + 20, r.y + 40, r.w - 40, 8).fillRect(r.x + 20, r.y + 84, r.w - 40, 8);
    const colours = [0x7be05a, 0xb36bff, 0xff6b6b, 0x5ad1ff, 0xf5c542];
    colours.forEach((c, i) => g.fillStyle(c, 1).fillCircle(r.x + 50 + i * 64, r.y + 28, 11).fillCircle(r.x + 82 + i * 64, r.y + 72, 10));
    g.fillStyle(0x2b2b33, 1).fillEllipse(r.x + r.w / 2, floorY(r) - 22, 90, 44);
    g.fillStyle(0xb36bff, 1).fillEllipse(r.x + r.w / 2, floorY(r) - 40, 70, 12);
  },
  // A red carpet, a golden frame and a sofa.
  vip_lounge: (g, r) => {
    g.fillStyle(0xa8243a, 1).fillRect(r.x + 20, floorY(r) - 10, r.w - 40, 10);
    g.lineStyle(4, 0xf5c542, 1).strokeRect(r.x + r.w / 2 - 40, r.y + 20, 80, 56);
    g.fillStyle(0x7a1f3d, 1).fillRect(r.x + r.w / 2 - 60, floorY(r) - 50, 120, 40);
  },
};

/** Draws a built room: a warmer wall and its furniture. */
export function drawBuiltRoom(g: Graphics, roomId: string, r: Rect): void {
  g.fillStyle(0xc99a68, 1).fillRect(r.x, r.y, r.w, r.h);
  FURNITURE[roomId]?.(g, r);
}

/** Draws a room that is not built yet: dark, with planks nailed across. */
export function drawBoardedRoom(g: Graphics, r: Rect): void {
  g.fillStyle(0x4a2c14, 1).fillRect(r.x, r.y, r.w, r.h);
  g.fillStyle(0x8b5a2b, 1);
  for (let i = 0; i < 4; i++) g.fillRect(r.x + 8, r.y + 14 + i * 34, r.w - 16, 18);
}
