import type { World } from '@/app/world';
import { gearPower } from '@/heroes/gear';
import { HERO_CLASSES } from '@/heroes/heroes';
import type { RecipeDef } from '@/recipes/recipe-data';
import type { Effect } from '@/shared/content';
import { type Rng, randomIndex } from '@/shared/random';
import type { Expedition, GameState, HeroState, TripCard } from '@/shared/state';

/**
 * How a trip turns out differently: `duration` multiplies the time left, `loot` adds a share of loot rolls, `injury` adds
 * to the chance of coming back hurt, `gearChance` to the chance of finding gear, and `extra` is loot on top.
 */
export interface TripMods {
  duration: number;
  loot: number;
  injury: number;
  gearChance: number;
  extra: Record<string, number>;
}

export const noMods = (): TripMods => ({ duration: 1, loot: 0, injury: 0, gearChance: 0, extra: {} });

/** Adds `more` to `into` (factors multiply, the rest adds up). */
export function addMods(into: TripMods, more: Partial<TripMods>): TripMods {
  into.duration *= more.duration ?? 1;
  into.loot += more.loot ?? 0;
  into.injury += more.injury ?? 0;
  into.gearChance += more.gearChance ?? 0;
  for (const [id, n] of Object.entries(more.extra ?? {})) into.extra[id] = (into.extra[id] ?? 0) + n;
  return into;
}

/**
 * What one drink taken along does on a trip, per effect (the same icons as in the tavern), with `p` its power: speed
 * brings the hero back sooner, luck brings more loot (and gear), strength makes them tougher. Charm helps with the
 * figures met on the way (see the witch card). Placeholder numbers; a new effect is one more entry.
 */
export const TRIP_EFFECTS: Readonly<Record<Effect, (p: number) => Partial<TripMods>>> = {
  speed: (p) => ({ duration: Math.max(0.5, 1 - 0.15 * p) }),
  luck: (p) => ({ loot: 0.15 * p, gearChance: 0.01 * p }),
  strength: (p) => ({ injury: -0.05 * p }),
  charm: () => ({}),
};

/** One option on a card. A drink of `boost.effect` along (or handed over) makes it better, by its power. */
export interface CardOption {
  id: string;
  /** The safe choice, taken when the player does not choose in time (and always while away). */
  default?: true;
  /** Hands over one drink taken along; only possible with a drink. */
  needsDrink?: true;
  mods: Partial<TripMods>;
  boost?: { effect: Effect; mods: (p: number) => Partial<TripMods> };
}

/** A choice card met on a trip. Texts: `cards.<id>.title`, `cards.<id>.text` and `cards.<id>.<option id>`. */
export interface CardDef {
  id: string;
  options: readonly CardOption[];
}

/** Placeholder numbers. Bold options bring more; the default is always safe. */
export const CARDS: readonly CardDef[] = [
  {
    id: 'path',
    options: [
      { id: 'mud', mods: { duration: 0.75, injury: 0.08 } },
      { id: 'planks', default: true, mods: {} },
    ],
  },
  {
    id: 'frog',
    options: [
      { id: 'fight', mods: { loot: 0.3, injury: 0.15 }, boost: { effect: 'strength', mods: (p) => ({ loot: 0.15 * p, injury: -0.1 * p }) } },
      { id: 'sneak', default: true, mods: {} },
    ],
  },
  {
    id: 'witch',
    options: [
      { id: 'give', needsDrink: true, mods: { extra: { witch_moss: 1 } }, boost: { effect: 'charm', mods: (p) => ({ extra: { witch_moss: Math.round(p) }, gearChance: 0.04 * p }) } },
      { id: 'walk', default: true, mods: {} },
    ],
  },
];

export const TRIP_CARDS = {
  perTrip: 2,
  /** How long a card waits for the player before the safe default is taken. */
  timeoutMs: 10_000,
} as const;

const cardDef = (id: string): CardDef | undefined => CARDS.find((c) => c.id === id);
const effectOf = (recipes: readonly RecipeDef[], id: string): Effect | undefined => recipes.find((r) => r.id === id)?.effect;

/** How strongly one drink works for this hero: their class, times their amulet. */
export function drinkPower(heroId: string, hero: Pick<HeroState, 'gear'>): number {
  const potion = HERO_CLASSES.find((c) => c.id === heroId)?.potionPower ?? 1;
  return potion * (1 + gearPower(hero, 'amulet'));
}

/** The power of one effect among these drinks: one drink's power for each drink with that effect. */
const effectPower = (recipes: readonly RecipeDef[], drinks: readonly string[], effect: Effect, power: number): number =>
  drinks.filter((id) => effectOf(recipes, id) === effect).length * power;

/** What the drinks along do on the trip (speed is used when the hero leaves, the rest when they are back). */
export function drinkMods(recipes: readonly RecipeDef[], drinks: readonly string[], power: number): TripMods {
  const mods = noMods();
  for (const id of drinks) {
    const effect = effectOf(recipes, id);
    if (effect !== undefined) addMods(mods, TRIP_EFFECTS[effect](power));
  }
  return mods;
}

/** The cards of a new trip: `perTrip` different ones, spread evenly over the trip. */
export function scheduleCards(start: number, durationMs: number, rng: Rng): TripCard[] {
  const pool = [...CARDS];
  const count = Math.min(TRIP_CARDS.perTrip, pool.length);
  return Array.from({ length: count }, (_, i) => {
    const [card] = pool.splice(randomIndex(rng, pool.length), 1);
    return { id: card?.id ?? '', at: Math.round(start + (durationMs * (i + 1)) / (count + 1)), choice: null };
  });
}

/** The card open on this trip right now (its time came, not decided yet), or undefined. */
export const openCard = (trip: Expedition, now: number): TripCard | undefined => trip.cards.find((c) => c.choice === null && c.at <= now);

/** The options a card offers on this trip: one that needs a drink only with a drink along. */
export function cardOptions(trip: Expedition, card: TripCard): readonly CardOption[] {
  return (cardDef(card.id)?.options ?? []).filter((o) => o.needsDrink !== true || trip.drinks.length > 0);
}

/** The drink to hand over for an option that needs one: one with the boosting effect if there is one. */
export function drinkToGive(recipes: readonly RecipeDef[], trip: Expedition, option: CardOption): string | undefined {
  return trip.drinks.find((id) => effectOf(recipes, id) === option.boost?.effect) ?? trip.drinks[0];
}

/** What the options taken on a trip do in the end (the drink handed over, or the drinks along, power their boosts). */
export function cardMods(recipes: readonly RecipeDef[], trip: Expedition, power: number): TripMods {
  const mods = noMods();
  for (const card of trip.cards) {
    const option = cardDef(card.id)?.options.find((o) => o.id === card.choice);
    if (option === undefined) continue;
    addMods(mods, { ...option.mods, duration: 1 });
    if (option.boost === undefined) continue;
    const drinks = option.needsDrink === true ? (card.drink === undefined ? [] : [card.drink]) : trip.drinks;
    const p = effectPower(recipes, drinks, option.boost.effect, power);
    if (p > 0) addMods(mods, option.boost.mods(p));
  }
  return mods;
}

/**
 * Decide the open card of a hero's trip. A bold option can shorten the rest of the trip at once; one that needs a drink
 * takes it from the drinks along. `picked`: the player chose (false: the safe default after the timeout, or while away).
 */
export function decideCard({ store, bus, clock, content }: Pick<World, 'store' | 'bus' | 'clock' | 'content'>, heroId: string, optionId: string, picked = true): void {
  const now = clock.now();
  const trip = store.getState().heroes[heroId]?.expedition;
  const card = trip == null ? undefined : (picked ? openCard(trip, now) : trip.cards.find((c) => c.choice === null));
  const option = trip == null || card === undefined ? undefined : cardOptions(trip, card).find((o) => o.id === optionId);
  if (trip == null || card === undefined || option === undefined) return;
  const drink = option.needsDrink === true ? drinkToGive(content.recipes, trip, option) : undefined;
  store.update((s) => {
    const t = s.heroes[heroId]?.expedition;
    const c = t?.cards.find((x) => x.at === card.at);
    if (t == null || c === undefined) return;
    c.choice = option.id;
    if (drink !== undefined) {
      c.drink = drink;
      t.drinks.splice(t.drinks.indexOf(drink), 1);
    }
    const duration = option.mods.duration ?? 1;
    if (duration !== 1 && t.endsAt > now) t.endsAt = now + Math.round((t.endsAt - now) * duration);
  });
  bus.emit('card:resolved', { heroId, cardId: card.id, optionId: option.id, picked });
  bus.emit('saveRequested', {});
}

/** The first card open on any trip right now (heroes in class order), with its hero; undefined when none is open. */
export function currentCard(state: Pick<GameState, 'heroes'>, now: number): { heroId: string; trip: Expedition; card: TripCard } | undefined {
  for (const def of HERO_CLASSES) {
    const trip = state.heroes[def.id]?.expedition;
    const card = trip == null ? undefined : openCard(trip, now);
    if (trip != null && card !== undefined) return { heroId: def.id, trip, card };
  }
  return undefined;
}

/** The option a bold player takes: the first one that is not the safe default. */
export const boldOption = (trip: Expedition, card: TripCard): CardOption | undefined => cardOptions(trip, card).find((o) => o.default !== true);

/** The safe option of a card. */
export const defaultOption = (cardId: string): string => cardDef(cardId)?.options.find((o) => o.default === true)?.id ?? '';
