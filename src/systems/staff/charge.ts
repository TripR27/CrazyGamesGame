/**
 * How a worker keeps its pace: charge builds up with time and one action costs a full charge.
 * Charge is capped at one action, so a worker with nothing to do does not save up a burst for later.
 */
export interface Charge {
  fill(deltaMs: number, actionsPerSecond: number): void;
  ready(): boolean;
  spend(): void;
}

export function createCharge(): Charge {
  let charge = 0;
  return {
    fill(deltaMs, actionsPerSecond) {
      charge = Math.min(1, charge + (actionsPerSecond * deltaMs) / 1000);
    },
    ready: () => charge >= 1,
    spend() {
      charge = Math.max(0, charge - 1);
    },
  };
}
