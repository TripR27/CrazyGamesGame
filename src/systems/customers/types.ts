import type { LeaveReason } from '@/core/game-events';
import type { CustomerDef } from '@/data/customers';
import type { RecipeDef } from '@/data/recipes';

/** A customer currently in the tavern. Not saved: the floor starts empty on every launch. */
export interface CustomerInstance {
  id: number;
  typeId: string;
  /** The drink this customer ordered. */
  recipeId: string;
  /** Seat number, 0 to capacity - 1. The scene maps it to a spot; the system never knows positions. */
  seat: number;
  patienceMs: number;
  patienceMaxMs: number;
  /** The customer likes the effect of the drink they ordered (it counts double). */
  liked: boolean;
  /** Set once served: time left to finish the drink. Undefined while still waiting for it. */
  drinkMsLeft?: number;
}

export interface CustomerFloor {
  capacity: number;
  customers: CustomerInstance[];
  nextId: number;
  spawnInMs: number;
}

/** What the system needs to know about the player (interface segregation: not the whole state). */
export interface CustomerContext {
  reputation: number;
  unlockedRecipeIds: readonly string[];
  /** Most customers allowed in the tavern at once (the tutorial lowers this to one). */
  maxCustomers: number;
  /** Patience stops running down (the tutorial freezes it so nobody leaves in the middle of a lesson). */
  freezePatience: boolean;
}

/** The content tables, passed in so tests and the simulator can use their own. */
export interface CustomerCatalog {
  customerTypes: readonly CustomerDef[];
  recipes: readonly RecipeDef[];
}

export type CustomerChange =
  | { kind: 'arrived'; id: number; liked: boolean }
  | { kind: 'left'; id: number; reason: LeaveReason };
