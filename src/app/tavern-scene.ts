import { Scene, AUTO, Game, Scale } from 'phaser';
import type { PlayerActions } from '@/app/actions';
import { drawBar, drawCauldron, drawCustomerSlots, drawRoomShell, drawShelf, drawTables } from '@/app/backdrop-view';
import type { BrewStation } from '@/brewing/brewing';
import { createCauldronView, type CauldronView, createReadyView, type ReadyView, createShelfView, type ShelfView } from '@/brewing/brewing-view';
import { BACKGROUND_COLOR, GAME_HEIGHT, GAME_WIDTH } from '@/config';
import type { CustomerFloor } from '@/customers/customers';
import { createCustomersLayer, type CustomersLayer } from '@/customers/customers-view';
import { createRoomsView, type RoomsView } from '@/rooms/rooms-view';
import type { DrinkSelection } from '@/serving/serving';
import { createFeedbackLayer } from '@/serving/serving-view';
import type { EventBus, GameEvents } from '@/shared/events';
import type { OneTimeOffer } from '@/shared/purchases';
import type { TargetRegistry } from '@/shared/targets';

/** What the scenes may read and call. Handed in from the composition root (src/wiring). */
export interface SceneServices {
  bus: EventBus<GameEvents>;
  floor: CustomerFloor;
  station: BrewStation;
  /** The drink the player picked from the bar (read only; picking goes through the actions). */
  selection: Pick<DrinkSelection, 'selected'>;
  /** The only way the scene changes the game: mouse clicks as actions. */
  actions: PlayerActions;
  /** Ingredient ids to show on the shelf; read again every frame so new ones appear. */
  getShelf(): readonly string[];
  /** How a room stands (locked, for sale with its price, or built); read every frame. Undefined for an unknown room. */
  getRoomOffer(roomId: string): OneTimeOffer | undefined;
  /** Scene objects the tutorial can point at register themselves here. */
  targets: TargetRegistry;
}

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
    // The rooms come first, so customers upstairs are drawn in front of them.
    const rooms = createRoomsView(this, services);
    this.views = {
      rooms,
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
    this.views.rooms.update();
    this.views.customers.update();
  }
}

export function createGame(parent: string, services: SceneServices): Game {
  return new Game({
    type: AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: BACKGROUND_COLOR,
    scale: { mode: Scale.FIT, autoCenter: Scale.CENTER_BOTH },
    scene: [new BootScene(), new TavernScene(services)],
  });
}
