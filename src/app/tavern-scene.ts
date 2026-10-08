import { Scene, AUTO, Game, Scale } from 'phaser';
import type { World } from '@/app/world';
import { drawBar, drawCauldron, drawCustomerSlots, drawRoomShell, drawShelf, drawTables } from '@/app/backdrop-view';
import { clickCauldron, clickIngredient } from '@/brewing/brewing';
import { shelfIds } from '@/brewing/ingredients';
import { createCauldronView, type CauldronView, createReadyView, type ReadyView, createShelfView, type ShelfView } from '@/brewing/brewing-view';
import { BACKGROUND_COLOR, GAME_HEIGHT, GAME_WIDTH } from '@/config';
import { createCustomersLayer, type CustomersLayer } from '@/customers/customers-view';
import { createDecorView, type DecorView } from '@/decor/decor-view';
import { createGuildView, type GuildView } from '@/heroes/guild-view';
import { createRoomsView, type RoomsView } from '@/rooms/rooms-view';
import { cancelSelection, clickReadyDrink } from '@/serving/serving';
import { createFeedbackLayer } from '@/serving/serving-view';

export const BOOT_SCENE_KEY = 'boot';

/** Entry scene. Asset loading joins here in the art pass; for now everything is drawn in code. */
export class BootScene extends Scene {
  constructor() {
    super(BOOT_SCENE_KEY);
  }

  create(): void {
    this.scene.start(TAVERN_SCENE_KEY);
  }
}

export const TAVERN_SCENE_KEY = 'tavern';

interface Views {
  customers: CustomersLayer;
  shelf: ShelfView;
  cauldron: CauldronView;
  ready: ReadyView;
  rooms: RoomsView;
  guild: GuildView;
  decor: DecorView;
}

/** Placeholder cross-section of the tavern: static shapes on one Graphics object, plus the live parts. */
export class TavernScene extends Scene {
  private views?: Views;

  constructor(private readonly world: World) {
    super(TAVERN_SCENE_KEY);
  }

  create(): void {
    const { world } = this;
    const g = this.add.graphics();
    drawRoomShell(g);
    drawShelf(g);
    drawTables(g);
    drawBar(g);
    drawCauldron(g);
    // Decorations lie on the backdrop; the seat outlines go on top, so a rug never hides where customers sit.
    const decor = createDecorView(this, world);
    drawCustomerSlots(this.add.graphics());
    // The rooms come first, so customers upstairs are drawn in front of them.
    const rooms = createRoomsView(this, world);
    const guild = createGuildView(this, world);
    this.views = {
      rooms,
      guild,
      decor,
      shelf: createShelfView(this, () => shelfIds(world), (id) => clickIngredient(world, id), world.targets),
      cauldron: createCauldronView(this, world.station, () => clickCauldron(world), world.targets),
      ready: createReadyView(this, {
        station: world.station,
        selected: world.selection.selected,
        onClick: (slot) => clickReadyDrink(world, slot),
        targets: world.targets,
      }),
      customers: createCustomersLayer(this, world),
    };
    const stopFeedback = createFeedbackLayer(this, world);
    // A click on an empty spot puts a picked-up drink back.
    this.input.on('pointerdown', (_pointer: unknown, over: readonly unknown[]) => {
      if (over.length === 0) cancelSelection(world);
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
    this.views.rooms.update();
    this.views.guild.update();
    this.views.decor.update();
    this.views.customers.update();
  }
}

export function createGame(parent: string, world: World): Game {
  return new Game({
    type: AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: BACKGROUND_COLOR,
    scale: { mode: Scale.FIT, autoCenter: Scale.CENTER_BOTH },
    scene: [new BootScene(), new TavernScene(world)],
  });
}
