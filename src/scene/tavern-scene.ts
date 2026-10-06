import { Scene } from 'phaser';
import { createCauldronView, type CauldronView } from '@/scene/brewing/cauldron-view';
import { createReadyView, type ReadyView } from '@/scene/brewing/ready-view';
import { createShelfView, type ShelfView } from '@/scene/brewing/shelf-view';
import { createCustomersLayer, type CustomersLayer } from '@/scene/customers/customers-layer';
import { createFeedbackLayer } from '@/scene/effects/feedback-layer';
import type { SceneServices } from '@/scene/services';
import { drawBar } from '@/scene/sprites/bar';
import { drawCauldron } from '@/scene/sprites/cauldron';
import { drawCustomerSlots } from '@/scene/sprites/customer-slots';
import { drawRoomShell } from '@/scene/sprites/room-shell';
import { drawShelf } from '@/scene/sprites/shelf';
import { drawTables } from '@/scene/sprites/tables';

export const TAVERN_SCENE_KEY = 'tavern';

interface Views {
  customers: CustomersLayer;
  shelf: ShelfView;
  cauldron: CauldronView;
  ready: ReadyView;
}

/** Placeholder cross-section of the tavern: static shapes on one Graphics object, plus the live parts. */
export class TavernScene extends Scene {
  private views?: Views;

  constructor(private readonly services: SceneServices) {
    super(TAVERN_SCENE_KEY);
  }

  create(): void {
    const { services } = this;
    const g = this.add.graphics();
    drawRoomShell(g);
    drawShelf(g);
    drawTables(g);
    drawBar(g);
    drawCauldron(g);
    drawCustomerSlots(g);
    this.views = {
      shelf: createShelfView(this, services.getShelf, services.actions.clickIngredient, services.targets),
      cauldron: createCauldronView(this, services.station, services.actions.clickCauldron, services.targets),
      ready: createReadyView(this, {
        station: services.station,
        selected: services.selection.selected,
        onClick: services.actions.clickReadyDrink,
        targets: services.targets,
      }),
      customers: createCustomersLayer(this, services),
    };
    const stopFeedback = createFeedbackLayer(this, services);
    // A click on an empty spot puts a picked-up drink back.
    this.input.on('pointerdown', (_pointer: unknown, over: readonly unknown[]) => {
      if (over.length === 0) services.actions.cancelSelection();
    });
    this.events.once('shutdown', () => {
      stopFeedback();
      this.views?.customers.destroy();
    });
  }

  update(): void {
    if (this.views === undefined) return;
    this.views.shelf.update();
    this.views.cauldron.update();
    this.views.ready.update();
    this.views.customers.update();
  }
}
