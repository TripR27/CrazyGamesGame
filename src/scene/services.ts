import type { BrewStation } from '@/brewing/brewing';
import type { CustomerFloor } from '@/customers/customers';
import type { DrinkSelection } from '@/serving/serving';
import type { EventBus, GameEvents } from '@/shared/events';
import type { OneTimeOffer } from '@/shared/purchases';
import type { TargetRegistry } from '@/shared/targets';
import type { PlayerActions } from '@/systems/actions/player-actions';

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
