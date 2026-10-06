import { FLOOR_Y, TABLES } from '@/scene/layout';
import { PALETTE } from '@/scene/palette';
import { fillRect, type Graphics } from './draw';

const LEG_WIDTH = 10;
const LEG_INSET = 12;

/** Plain tables: a top plank on two legs. */
export function drawTables(g: Graphics): void {
  for (const table of TABLES) {
    const legHeight = FLOOR_Y - (table.y + table.h);
    const legY = table.y + table.h;
    fillRect(g, { x: table.x + LEG_INSET, y: legY, w: LEG_WIDTH, h: legHeight }, PALETTE.woodDark);
    fillRect(g, { x: table.x + table.w - LEG_INSET - LEG_WIDTH, y: legY, w: LEG_WIDTH, h: legHeight }, PALETTE.woodDark);
    fillRect(g, table, PALETTE.barTop);
  }
}
