import { SHELF } from '@/scene/layout';
import { PALETTE } from '@/scene/palette';
import { fillRect, type Graphics } from '@/scene/sprites/draw';

const BRACKET_WIDTH = 8;
const BRACKET_HEIGHT = 18;

/** The empty wall shelf; the ingredients on it are interactive objects of the shelf view. */
export function drawShelf(g: Graphics): void {
  fillRect(g, SHELF, PALETTE.woodDark);
  for (const x of [SHELF.x + 30, SHELF.x + SHELF.w - 30 - BRACKET_WIDTH]) {
    fillRect(g, { x, y: SHELF.y + SHELF.h, w: BRACKET_WIDTH, h: BRACKET_HEIGHT }, PALETTE.woodDark);
  }
}
