import { Scene } from 'phaser';
import { drawBar } from '@/scene/sprites/bar';
import { drawCauldron } from '@/scene/sprites/cauldron';
import { drawCustomerSlots } from '@/scene/sprites/customer-slots';
import { drawRoomShell } from '@/scene/sprites/room-shell';
import { drawTables } from '@/scene/sprites/tables';

export const TAVERN_SCENE_KEY = 'tavern';

/** Placeholder cross-section of the tavern; static shapes on one Graphics object. */
export class TavernScene extends Scene {
  constructor() {
    super(TAVERN_SCENE_KEY);
  }

  create(): void {
    const g = this.add.graphics();
    drawRoomShell(g);
    drawTables(g);
    drawBar(g);
    drawCauldron(g);
    drawCustomerSlots(g);
  }
}
