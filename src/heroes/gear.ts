import type { World } from '@/app/world';
import { GUILD_ROOM_ID } from '@/rooms/rooms';
import type { EventBus, GameEvents } from '@/shared/events';
import { num, type Num } from '@/shared/numbers';
import { watchBuyable, type WatchSource } from '@/shared/purchases';
import type { GameState, HeroState } from '@/shared/state';

/** The four gear slots, each with its own role on a trip. */
export const GEAR_SLOTS = ['sword', 'shield', 'helmet', 'amulet'] as const;
export type GearSlot = (typeof GEAR_SLOTS)[number];

/**
 * One piece of gear. `power` is what it does in its slot (see `gearPower`): a sword brings more loot, a shield lowers
 * the chance of an injury, a helmet makes the trip shorter, an amulet makes drinks given along stronger (step 16).
 * With `buy` it is sold in the Heroes tab; without it only dungeons drop it. Texts: `gear.<id>.name`.
 */
export interface GearDef {
  id: string;
  slot: GearSlot;
  power: number;
  buy?: { cost: number };
}

/** Placeholder numbers, tuned with `npm run simulate`. Simple pieces for gold, better ones as loot. */
export const GEAR: readonly GearDef[] = [
  { id: 'rusty_sword', slot: 'sword', power: 0.25, buy: { cost: 4000 } },
  { id: 'wooden_shield', slot: 'shield', power: 0.3, buy: { cost: 4000 } },
  { id: 'leather_cap', slot: 'helmet', power: 0.15, buy: { cost: 4000 } },
  { id: 'lucky_charm', slot: 'amulet', power: 0.25, buy: { cost: 4000 } },
  { id: 'swamp_cleaver', slot: 'sword', power: 0.6 },
  { id: 'frog_shield', slot: 'shield', power: 0.6 },
  { id: 'mudwalker_helm', slot: 'helmet', power: 0.3 },
  { id: 'witch_eye', slot: 'amulet', power: 0.6 },
];

const gearById = (id: string | undefined): GearDef | undefined => GEAR.find((g) => g.id === id);

/** What the piece a hero wears in this slot adds (0 with nothing there). */
export const gearPower = (hero: Pick<HeroState, 'gear'>, slot: GearSlot): number => gearById(hero.gear[slot])?.power ?? 0;

/** The hero who wears this piece, if any. */
export function wearer(state: Pick<GameState, 'heroes'>, gearId: string): string | undefined {
  for (const id in state.heroes) {
    const gear = state.heroes[id]?.gear ?? {};
    for (const slot in gear) if (gear[slot] === gearId) return id;
  }
  return undefined;
}

/** How buying a piece stands: not sold (loot only, or no guild hall yet), for sale, or owned. */
export interface GearOffer {
  status: 'locked' | 'forSale' | 'owned';
  cost: Num;
  affordable: boolean;
}

type GearShopState = Pick<GameState, 'gearOwned' | 'roomsBuilt' | 'currencies'>;

/** Gear is sold once the guild hall stands. */
export function gearOffer(state: GearShopState, def: GearDef): GearOffer {
  const cost = num(def.buy?.cost ?? 0);
  if (state.gearOwned.includes(def.id)) return { status: 'owned', cost, affordable: false };
  if (def.buy === undefined || !state.roomsBuilt.includes(GUILD_ROOM_ID)) return { status: 'locked', cost, affordable: false };
  return { status: 'forSale', cost, affordable: state.currencies.gold.gte(cost) };
}

export const firstBuyableGear = (state: GearShopState): GearDef | undefined => GEAR.find((def) => gearOffer(state, def).affordable);

/** Buy a piece in the Heroes tab (once); does nothing when it is not sold, owned or too expensive. */
export function buyGearById({ store, bus }: Pick<World, 'store' | 'bus'>, id: string): void {
  const def = gearById(id);
  const offer = def === undefined ? undefined : gearOffer(store.getState(), def);
  if (def === undefined || offer?.affordable !== true) return;
  store.update((s) => {
    s.currencies.gold = s.currencies.gold.sub(offer.cost);
    s.gearOwned.push(def.id);
  });
  bus.emit('gear:bought', { id: def.id });
  bus.emit('saveRequested', {});
}

/** Publishes `gear:affordable` each time a piece of gear becomes buyable. Returns a stop function. */
export function watchGearShop(source: WatchSource<GearShopState>, bus: EventBus<GameEvents>): () => void {
  return watchBuyable(source, bus, (state) => firstBuyableGear(state) !== undefined, 'gear:affordable');
}

/**
 * Put an owned piece on a hero who is at home (in its own slot), or take the slot off with `gearId` null. A piece worn by
 * another hero at home moves over; one worn by a hero on a trip stays where it is.
 */
export function equipGear({ store, bus }: Pick<World, 'store' | 'bus'>, heroId: string, slot: GearSlot, gearId: string | null): void {
  const state = store.getState();
  const hero = state.heroes[heroId];
  const def = gearById(gearId ?? undefined);
  if (hero === undefined || hero.expedition !== null) return;
  if (gearId !== null && (def?.slot !== slot || !state.gearOwned.includes(gearId))) return;
  const other = gearId === null ? undefined : wearer(state, gearId);
  if (other !== undefined && other !== heroId && state.heroes[other]?.expedition !== null) return;
  store.update((s) => {
    if (other !== undefined) delete s.heroes[other]?.gear[slot];
    const h = s.heroes[heroId];
    if (h === undefined) return;
    if (gearId === null) delete h.gear[slot];
    else h.gear[slot] = gearId;
  });
  if (gearId !== null) bus.emit('gear:equipped', { heroId, id: gearId });
  bus.emit('saveRequested', {});
}

/**
 * An owned piece nobody wears, and a hero at home it would help: one with that slot empty, or with a weaker piece in it
 * (so a swap never goes back and forth). Null when there is none.
 */
export function gearToWear(state: Pick<GameState, 'heroes' | 'gearOwned'>): { heroId: string; slot: GearSlot; gearId: string } | null {
  for (const piece of GEAR) {
    if (!state.gearOwned.includes(piece.id) || wearer(state, piece.id) !== undefined) continue;
    for (const heroId in state.heroes) {
      const hero = state.heroes[heroId];
      if (hero !== undefined && hero.expedition === null && gearPower(hero, piece.slot) < piece.power) return { heroId, slot: piece.slot, gearId: piece.id };
    }
  }
  return null;
}

/** A drop from a dungeon: a piece of gear the player does not own yet, by weight. */
export interface GearDrop {
  gear: string;
  weight: number;
}

/** The loot-only pieces still to find among these drops. */
export const unfoundDrops = (state: Pick<GameState, 'gearOwned'>, drops: readonly GearDrop[]): GearDrop[] =>
  drops.filter((d) => !state.gearOwned.includes(d.gear));
