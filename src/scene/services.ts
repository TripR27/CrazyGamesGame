import type { EventBus } from '@/core/events';
import type { GameEvents } from '@/core/game-events';
import type { CustomerFloor } from '@/systems/customers';

/** What the scenes may read: the event bus and the live customer floor. Handed in from main.ts. */
export interface SceneServices {
  bus: EventBus<GameEvents>;
  floor: CustomerFloor;
}
