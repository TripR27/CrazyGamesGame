import { Scene } from 'phaser';
import { createCustomersLayer, type CustomersLayer } from '@/scene/customers/customers-layer';
import type { SceneServices } from '@/scene/services';
import { drawBar } from '@/scene/sprites/bar';
import { drawCauldron } from '@/scene/sprites/cauldron';
import { drawCustomerSlots } from '@/scene/sprites/customer-slots';
import { drawRoomShell } from '@/scene/sprites/room-shell';
import { drawTables } from '@/scene/sprites/tables';

export const TAVERN_SCENE_KEY = 'tavern';

/** Placeholder cross-section of the tavern: static shapes on one Graphics object, plus the customers. */
export class TavernScene extends Scene {
  private customers?: CustomersLayer;

  constructor(private readonly services: SceneServices) {
    super(TAVERN_SCENE_KEY);
  }

  create(): void {
    const g = this.add.graphics();
    drawRoomShell(g);
    drawTables(g);
    drawBar(g);
    drawCauldron(g);
    drawCustomerSlots(g);
    this.customers = createCustomersLayer(this, this.services);
    this.events.once('shutdown', () => this.customers?.destroy());
  }

  update(): void {
    this.customers?.update();
  }
}
