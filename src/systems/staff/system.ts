import type { EventBus } from '@/core/events';
import type { GameEvents } from '@/core/game-events';
import type { Rng } from '@/core/rng';
import type { RecipeDef } from '@/data/recipes';
import { publishBrewEvent, type BrewStation } from '@/systems/brewing';
import { waitingCustomers, type CustomerFloor } from '@/systems/customers';
import { serveAndPublish, type ServeDeps } from '@/systems/serving';
import { startWantedBrew } from './auto-brew';
import { readyCustomer } from './auto-serve';
import { createCharge } from './charge';

export interface StaffDeps {
  bus: EventBus<GameEvents>;
  station: BrewStation;
  floor: CustomerFloor;
  rng: Rng;
  /** What `serveAndPublish` needs besides the bus (economy, catalog and so on). */
  serve: Omit<ServeDeps, 'floor' | 'station' | 'rng'>;
  /** Read fresh on every tick, so a newly hired worker starts at once. */
  getKnownRecipes(): readonly RecipeDef[];
  /** Actions per second for each worker (0 means nobody is hired). */
  getRates(): { brew: number; serve: number };
}

/** Lets the hired staff work on every game tick. Returns a stop function. */
export function startStaff(deps: StaffDeps): () => void {
  const brewCharge = createCharge();
  const serveCharge = createCharge();
  return deps.bus.on('tick', ({ deltaMs }) => {
    const rates = deps.getRates();
    brewCharge.fill(deltaMs, rates.brew);
    serveCharge.fill(deltaMs, rates.serve);

    if (serveCharge.ready()) {
      const id = readyCustomer(waitingCustomers(deps.floor), deps.station);
      if (id !== undefined) {
        serveAndPublish({ ...deps.serve, floor: deps.floor, station: deps.station, rng: deps.rng, bus: deps.bus }, id);
        serveCharge.spend();
      }
    }
    if (brewCharge.ready()) {
      const events = startWantedBrew(deps.station, waitingCustomers(deps.floor), deps.getKnownRecipes(), deps.rng);
      if (events.length > 0) {
        events.forEach((event) => publishBrewEvent(deps.bus, event));
        brewCharge.spend();
      }
    }
  });
}
