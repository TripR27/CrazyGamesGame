import { BAR } from '@/scene/layout';
import { PALETTE } from '@/scene/palette';
import { fillRect, type Graphics } from './draw';

const TOP_THICKNESS = 14;
const MUG_XS = [900, 1010, 1120] as const;

function drawMugs(g: Graphics): void {
  for (const x of MUG_XS) {
    fillRect(g, { x, y: BAR.y - 26, w: 22, h: 26 }, PALETTE.woodDark);
  }
}

/** The bar counter with a few mugs on top. */
export function drawBar(g: Graphics): void {
  fillRect(g, BAR, PALETTE.wood);
  fillRect(g, { x: BAR.x, y: BAR.y, w: BAR.w, h: TOP_THICKNESS }, PALETTE.barTop);
  fillRect(g, { x: BAR.x, y: BAR.y + BAR.h - 10, w: BAR.w, h: 10 }, PALETTE.woodDark);
  drawMugs(g);
}
