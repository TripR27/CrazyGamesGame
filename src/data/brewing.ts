/** Placeholder numbers for the manual brew-and-serve loop; tuned in step 9 and 13. */
export const BREWING = {
  /** Most ingredients that fit in the cauldron at once (the biggest recipe has three). */
  maxIngredients: 3,
  /** Finished drinks that can wait on the bar. Storage upgrades raise this in step 9. */
  storageCapacity: 3,
} as const;

export const SERVING = {
  reputationPerServe: 1,
  /** A served customer stays this long to drink before the seat frees up (speed drinks make it shorter). */
  drinkMs: 5000,
} as const;
