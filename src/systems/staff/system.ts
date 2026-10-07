import { BREWING } from '@/data/brewing';
import type { RecipeDef } from '@/data/recipes/types';
import type { EventBus, GameEvents } from '@/shared/events';
import type { Rng } from '@/shared/random';
import { emptyCauldron } from '@/systems/brewing/station';
import { publishBrewEvent } from '@/systems/brewing/system';
import type { BrewStation } from '@/systems/brewing/types';
import { waitingCustomers } from '@/systems/customers/floor';
import type { CustomerFloor } from '@/systems/customers/types';
import { serveAndPublish } from '@/systems/serving/publish';
import type { ServeDeps } from '@/systems/serving/serve';
import { startWantedBrew } from '@/systems/staff/auto-brew';
import { readyCustomer } from '@/systems/staff/auto-serve';
import { createCharge } from '@/systems/staff/charge';
import { createStaleWatch } from '@/systems/staff/stale-cauldron';

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
  const stale = createStaleWatch(BREWING.staleCauldronMs);
  return deps.bus.on('tick', ({ deltaMs }) => {
    const rates = deps.getRates();
    if (stale.isStale(deps.station.contents, deltaMs) && rates.brew > 0) emptyCauldron(deps.station);
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
