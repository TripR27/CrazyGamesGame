import { BAR } from '@/scene/layout';
import { PALETTE } from '@/scene/palette';
import { fillRect, type Graphics } from '@/scene/sprites/draw';

const TOP_THICKNESS = 14;

/** The bar counter. Finished drinks are drawn on top of it by the ready view. */
export function drawBar(g: Graphics): void {
  fillRect(g, BAR, PALETTE.wood);
  fillRect(g, { x: BAR.x, y: BAR.y, w: BAR.w, h: TOP_THICKNESS }, PALETTE.barTop);
  fillRect(g, { x: BAR.x, y: BAR.y + BAR.h - 10, w: BAR.w, h: 10 }, PALETTE.woodDark);
}
