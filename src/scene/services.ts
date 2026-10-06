import type { EventBus } from '@/core/events';
import type { GameEvents } from '@/core/game-events';
import type { TargetRegistry } from '@/core/target-registry';
import type { PlayerActions } from '@/systems/actions';
import type { BrewStation } from '@/systems/brewing';
import type { CustomerFloor } from '@/systems/customers';
import type { DrinkSelection } from '@/systems/serving';

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
  /** Scene objects the tutorial can point at register themselves here. */
  targets: TargetRegistry;
}
