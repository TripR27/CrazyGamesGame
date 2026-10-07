import { CAULDRON, FLOOR_Y } from '@/scene/layout';
import { PALETTE } from '@/scene/palette';
import type { Graphics } from '@/scene/sprites/draw';

const BODY_HEIGHT = 80;
const RIM_HEIGHT = 24;

function drawFire(g: Graphics, cx: number): void {
  g.fillStyle(PALETTE.fireOuter, 1);
  g.fillTriangle(cx - 40, FLOOR_Y, cx - 15, FLOOR_Y - 30, cx + 5, FLOOR_Y);
  g.fillTriangle(cx - 10, FLOOR_Y, cx + 12, FLOOR_Y - 36, cx + 40, FLOOR_Y);
  g.fillStyle(PALETTE.fireInner, 1);
  g.fillTriangle(cx - 22, FLOOR_Y, cx - 12, FLOOR_Y - 16, cx - 2, FLOOR_Y);
  g.fillTriangle(cx + 6, FLOOR_Y, cx + 14, FLOOR_Y - 18, cx + 24, FLOOR_Y);
}

/** The brewing cauldron over a small fire. */
export function drawCauldron(g: Graphics): void {
  const cx = CAULDRON.x + CAULDRON.w / 2;
  const bodyY = FLOOR_Y - 30 - BODY_HEIGHT / 2;
  drawFire(g, cx);
  g.fillStyle(PALETTE.cauldron, 1);
  g.fillEllipse(cx, bodyY, CAULDRON.w, BODY_HEIGHT);
  g.fillStyle(PALETTE.cauldronRim, 1);
  g.fillEllipse(cx, bodyY - BODY_HEIGHT / 2 + 8, CAULDRON.w - 8, RIM_HEIGHT);
  g.fillStyle(PALETTE.brew, 1);
  g.fillEllipse(cx, bodyY - BODY_HEIGHT / 2 + 8, CAULDRON.w - 28, RIM_HEIGHT - 8);
}
