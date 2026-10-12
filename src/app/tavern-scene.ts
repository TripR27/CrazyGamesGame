import { Scene, AUTO, Game, Scale } from 'phaser';
import type { World } from '@/app/world';
import { addBackdrop } from '@/app/backdrop-view';
import { startJuice } from '@/app/juice-view';
import { clickCauldron } from '@/brewing/brewing';
import { shelfCount, shelfIds } from '@/brewing/ingredients';
import { createCauldronView, type CauldronView, createReadyView, type ReadyView, createShelfView, type ShelfView } from '@/brewing/brewing-view';
import { BACKGROUND_COLOR, GAME_HEIGHT, GAME_WIDTH } from '@/config';
import { createCustomersLayer, type CustomersLayer } from '@/customers/customers-view';
import { createDecorView, type DecorView } from '@/decor/decor-view';
import { createGuildView, type GuildView } from '@/heroes/guild-view';
import { clickShelf } from '@/heroes/hero-brewing';
import { createRoomsView, type RoomsView } from '@/rooms/rooms-view';
import { cancelSelection, clickReadyDrink } from '@/serving/serving';
import { createFeedbackLayer } from '@/serving/serving-view';
import { createStaffView, type StaffView } from '@/staff/staff-view';
import { createPeddlerView } from '@/rewards/rewards-view';

export const BOOT_SCENE_KEY = 'boot';

/** Entry scene. The pixel art is drawn in code (no files to load), so it goes straight to the tavern. */
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
  staff: StaffView;
  peddler: { update(): void };
  rooms: RoomsView;
  guild: GuildView;
  decor: DecorView;
}

/** The cross-section of the tavern: a pixel-art backdrop, plus the live parts. */
export class TavernScene extends Scene {
  private views?: Views;

  constructor(private readonly world: World) {
    super(TAVERN_SCENE_KEY);
  }

  create(): void {
    const { world } = this;
    addBackdrop(this);
    // Decorations lie on the backdrop, under everything that moves.
    const decor = createDecorView(this, world);
    // The rooms come first, so customers upstairs are drawn in front of them.
    const rooms = createRoomsView(this, world);
    const guild = createGuildView(this, world);
    this.views = {
      rooms,
      guild,
      decor,
      shelf: createShelfView(this, {
        getShelf: () => shelfIds(world),
        getCount: (id) => shelfCount(world, id),
        // Into the tavern cauldron, or into the hero cauldron while that one is picked.
        onClick: (id) => clickShelf(world, id),
        targets: world.targets,
      }),
      cauldron: createCauldronView(this, world.station, () => clickCauldron(world), world.targets),
      // The brewer stands behind the counter, so the drinks on the bar are drawn after (in front of) them.
      staff: createStaffView(this, world),
      ready: createReadyView(this, {
        station: world.station,
        selected: world.selection.selected,
        onClick: (slot) => clickReadyDrink(world, slot),
        targets: world.targets,
      }),
      // The peddler stands by the door; customers walking in pass in front of him.
      peddler: createPeddlerView(this, world),
      customers: createCustomersLayer(this, world),
    };
    const stopFeedback = createFeedbackLayer(this, world);
    const stopJuice = startJuice(this, world);
    // A click on an empty spot puts a picked-up drink back.
    this.input.on('pointerdown', (_pointer: unknown, over: readonly unknown[]) => {
      if (over.length === 0) cancelSelection(world);
    });
    this.events.once('shutdown', () => {
      stopFeedback();
      stopJuice();
      this.views?.customers.destroy();
    });
  }

  update(): void {
    if (this.views === undefined) return;
    this.views.shelf.update();
    this.views.cauldron.update();
    this.views.staff.update();
    this.views.ready.update();
    this.views.rooms.update();
    this.views.guild.update();
    this.views.decor.update();
    this.views.peddler.update();
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
    // Sprites at whole pixels keep the pixel art sharp; the art textures are nearest-neighbour each, so text stays smooth.
    render: { roundPixels: true },
    scene: [new BootScene(), new TavernScene(world)],
    // No engine banner in the console (no console output in production, SPECS chapter 9).
    banner: false,
  });
}
