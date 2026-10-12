import type { RowView } from '@/economy/shop-model';
import { gearSightEntries, sightRow, sightStatuses } from '@/economy/shop-sight';
import { quartermasterOffer } from '@/heroes/auto';
import { GEAR, GEAR_SLOTS, type GearDef, type GearSlot, gearOffer, wearer } from '@/heroes/gear';
import { DUNGEONS } from '@/heroes/expedition';
import { HERO_CLASSES, HEROES, type HeroClassDef, guildBuilt, heroStatus, heroWaitMs, hireOffer, xpToNext } from '@/heroes/heroes';
import { t } from '@/i18n/translator';
import { REPUTATION_LEVELS } from '@/reputation/reputation';
import { GUILD_ROOM_ID, ROOMS } from '@/rooms/rooms';
import { textKey } from '@/shared/content';
import { formatNumber } from '@/shared/numbers';
import type { GameState } from '@/shared/state';

/** What the Heroes tab and the guild hall read. */
export type HeroesState = Pick<GameState, 'heroes' | 'roomsBuilt' | 'currencies' | 'ingredientStock' | 'gearOwned' | 'quartermaster' | 'shopSeen' | 'shopNew'>;

/** A countdown as "1:05" (rounded up, so it never shows 0:00 while time is left). */
export function clockText(ms: number): string {
  const total = Math.ceil(Math.max(0, ms) / 1000);
  return t('heroes.clock', { m: Math.floor(total / 60), s: String(total % 60).padStart(2, '0') });
}

/** The button on a hero's card: send them out, hire them, or nothing to do right now (away or resting). */
export interface HeroAction {
  kind: 'send' | 'hire' | 'none';
  label: string;
  enabled: boolean;
}

export interface HeroCardView {
  id: string;
  /** "Brakka · Warrior" */
  title: string;
  tagline: string;
  /** Empty for a hero who is not hired yet. */
  level: string;
  xp: string;
  /** Progress to the next level, 0 to 1 (full at the top level). */
  xpFraction: number;
  status: string;
  action: HeroAction;
  /** The drinks in the bag, or taken along on the trip; empty for a hero who is not hired yet. */
  bag: string;
  /** The four gear slots; empty for a hero who is not hired yet. */
  slots: SlotView[];
  /** The Auto switch (with the Quartermaster, for a hired hero), or null. */
  auto: { label: string; on: boolean } | null;
}

/** One gear slot on a hero's card: what can go in it, what is in it, and whether it can change now (only at home). */
export interface SlotView {
  slot: GearSlot;
  label: string;
  /** `id` '' is the empty slot. */
  options: { id: string; label: string }[];
  selected: string;
  enabled: boolean;
}

export interface HeroesView {
  /** Without the guild hall there are no heroes yet: just this line. */
  noGuild: string | null;
  stockTitle: string;
  /** What drinks taken along do; empty without the guild hall. */
  drinksHelp: string;
  /** One line per dungeon ingredient held, or the line that there is nothing yet; empty without the guild hall. */
  stock: string[];
  /** Gear for sale that came in sight, and one grey teaser of the next piece; empty without the guild hall. */
  gearShop: { id: string; row: RowView }[];
  /** The Quartermaster while it is for sale, otherwise null. */
  quartermaster: RowView | null;
  cards: HeroCardView[];
}

const name = (domain: 'heroes' | 'dungeons' | 'ingredients' | 'recipes', id: string): string => t(textKey(domain, id, 'name'));
const firstDungeon = DUNGEONS[0];

function statusLine(def: HeroClassDef, state: HeroesState, now: number): { status: string; action: HeroAction } {
  const hero = state.heroes[def.id];
  if (hero === undefined) {
    const offer = hireOffer(state, def);
    const label = t('heroes.hire', { cost: formatNumber(offer.cost) });
    return { status: t('heroes.status_unhired'), action: { kind: 'hire', label, enabled: offer.affordable } };
  }
  const time = clockText(heroWaitMs(hero, now));
  const where = hero.expedition === null ? '' : name('dungeons', hero.expedition.dungeon);
  const send = t('heroes.send', { dungeon: firstDungeon === undefined ? '' : name('dungeons', firstDungeon.id) });
  const byStatus = {
    home: { status: t('heroes.status_home'), action: { kind: 'send', label: send, enabled: true } },
    away: { status: t('heroes.status_away', { dungeon: where, time }), action: { kind: 'none', label: t('heroes.away'), enabled: false } },
    injured: { status: t('heroes.status_injured', { time }), action: { kind: 'none', label: t('heroes.resting'), enabled: false } },
  } as const;
  return byStatus[heroStatus(hero, now)];
}

/** What a piece does, as the player reads it: "+25% loot", "trips 15% shorter". */
export const gearDoes = (def: GearDef): string => t(`gear.does_${def.slot}`, { n: Math.round(def.power * 100) });
const gearName = (id: string): string => t(textKey('gear', id, 'name'));

/** A hero's four slots. A piece worn by a hero who is on a trip cannot move, so it is not offered to the others. */
function slotViews(heroId: string, state: HeroesState): SlotView[] {
  const hero = state.heroes[heroId];
  if (hero === undefined) return [];
  return GEAR_SLOTS.map((slot) => {
    const owned = GEAR.filter((g) => g.slot === slot && state.gearOwned.includes(g.id));
    const options = owned.flatMap((g) => {
      const on = wearer(state, g.id);
      if (on !== undefined && on !== heroId && state.heroes[on]?.expedition !== null) return [];
      const label = t('gear.option', { name: gearName(g.id), does: gearDoes(g) });
      return [{ id: g.id, label: on === undefined || on === heroId ? label : t('gear.worn_by', { gear: label, hero: name('heroes', on) }) }];
    });
    return {
      slot,
      label: t(`gear.slot_${slot}`),
      options: [{ id: '', label: t('gear.none') }, ...options],
      selected: hero.gear[slot] ?? '',
      enabled: hero.expedition === null,
    };
  });
}

/** The bag line on a hero's card: what waits in the bag, or what went along on the trip. */
function bagLine(state: HeroesState, heroId: string): string {
  const hero = state.heroes[heroId];
  if (hero === undefined) return '';
  const names = (ids: readonly string[]): string => ids.map((id) => name('recipes', id)).join(', ');
  if (hero.expedition !== null) return hero.expedition.drinks.length === 0 ? t('heroes.took_nothing') : t('heroes.took', { drinks: names(hero.expedition.drinks) });
  return hero.bag.length === 0 ? t('heroes.bag_empty') : t('heroes.bag', { drinks: names(hero.bag) });
}

/** One hero's card: name and class, level and XP, where they are, their bag and gear, and what the player can do. */
export function toHeroCard(def: HeroClassDef, state: HeroesState, now: number): HeroCardView {
  const hero = state.heroes[def.id];
  const top = hero !== undefined && hero.level >= HEROES.maxLevel;
  const next = hero === undefined ? 0 : xpToNext(hero.level);
  return {
    id: def.id,
    title: t('heroes.name_class', { name: name('heroes', def.id), class: t(textKey('heroes', def.id, 'class')) }),
    tagline: t(textKey('heroes', def.id, 'tagline')),
    level: hero === undefined ? '' : t(top ? 'heroes.level_max' : 'heroes.level', { level: hero.level }),
    xp: hero === undefined || top ? '' : t('heroes.xp', { xp: hero.xp, next }),
    xpFraction: hero === undefined ? 0 : top ? 1 : hero.xp / next,
    ...statusLine(def, state, now),
    bag: bagLine(state, def.id),
    slots: slotViews(def.id, state),
    auto: hero === undefined || !state.quartermaster ? null : { label: t(hero.auto ? 'heroes.auto_on' : 'heroes.auto_off'), on: hero.auto },
  };
}

const gearEntries = gearSightEntries();

/** One piece for sale as a shop row. */
function gearRow(def: GearDef, state: HeroesState): RowView {
  const offer = gearOffer(state, def);
  const description = t('gear.option', { name: t(`gear.slot_${def.slot}`), does: gearDoes(def) });
  return { name: gearName(def.id), description, level: '', buyLabel: t('shop.buy_once', { cost: formatNumber(offer.cost) }), canBuy: offer.affordable, maxed: false };
}

/** The gear for sale in the Heroes tab, as shop rows: what came in sight, and a teaser of the next piece (a bought piece leaves). */
function gearShop(state: HeroesState): { id: string; row: RowView }[] {
  const statuses = sightStatuses(gearEntries, state);
  return gearEntries.flatMap((entry, i) => {
    const def = GEAR.find((g) => g.id === entry.id);
    const row = def === undefined ? null : sightRow(entry, statuses[i] ?? 'hidden', state, () => gearRow(def, state));
    return row === null ? [] : [{ id: entry.id, row }];
  });
}

/** The Quartermaster as a shop row while it is for sale. */
function quartermasterRow(state: HeroesState): RowView | null {
  const offer = quartermasterOffer(state);
  if (offer.status !== 'forSale') return null;
  const buyLabel = t('shop.buy_once', { cost: formatNumber(offer.cost) });
  return { name: t('heroes.quartermaster.name'), description: t('heroes.quartermaster.description'), level: '', buyLabel, canBuy: offer.affordable, maxed: false };
}

/** The dungeon ingredients held, in the order the dungeons drop them. */
function stockLines(state: HeroesState): string[] {
  const ids = [...new Set(DUNGEONS.flatMap((d) => d.drops.map((drop) => drop.ingredient)))];
  const lines = ids
    .filter((id) => (state.ingredientStock[id] ?? 0) > 0)
    .map((id) => t('heroes.stock_item', { name: name('ingredients', id), n: state.ingredientStock[id] ?? 0 }));
  return lines.length > 0 ? lines : [t('heroes.stock_empty')];
}

/** The Heroes tab as plain strings. */
export function toHeroesView(state: HeroesState, now: number): HeroesView {
  const guildLevel = ROOMS.find((r) => r.id === GUILD_ROOM_ID)?.buy.level ?? 1;
  const levelName = t(textKey('reputation', REPUTATION_LEVELS[guildLevel - 1]?.id ?? '', 'name'));
  const built = guildBuilt(state);
  return {
    noGuild: built ? null : t('heroes.no_guild', { level: levelName }),
    stockTitle: t('heroes.stock_title'),
    drinksHelp: built ? t('heroes.drinks_help') : '',
    stock: built ? stockLines(state) : [],
    gearShop: gearShop(state),
    quartermaster: quartermasterRow(state),
    cards: built ? HERO_CLASSES.map((def) => toHeroCard(def, state, now)) : [],
  };
}
