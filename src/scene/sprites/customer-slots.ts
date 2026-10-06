import { CUSTOMER_SLOTS } from '@/scene/layout';
import { PALETTE } from '@/scene/palette';
import type { Graphics } from './draw';

const MARKER_WIDTH = 56;
const MARKER_HEIGHT = 16;

/** Faint outlines showing where customers will sit (step 6). */
export function drawCustomerSlots(g: Graphics): void {
  g.lineStyle(2, PALETTE.slot, 0.45);
  for (const slot of CUSTOMER_SLOTS) {
    g.strokeEllipse(slot.x, slot.y, MARKER_WIDTH, MARKER_HEIGHT);
  }
}
