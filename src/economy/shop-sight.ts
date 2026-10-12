import type { Content, World } from '@/app/world';
import { ingredientOffer, shopIngredients } from '@/brewing/ingredients';
import { decorOffer } from '@/decor/decor';
import type { RowView } from '@/economy/shop-model';
import type { UpgradeDef } from '@/economy/upgrade-data';
import { isUnlocked, levelsLeft } from '@/economy/upgrades';
import { GEAR, gearOffer } from '@/heroes/gear';
import { t } from '@/i18n/translator';
import { LEGACY, LEGACY_SIGHT_PREFIX, legacyCost } from '@/prestige/prestige';
import { levelFor, REPUTATION_LEVELS } from '@/reputation/reputation';
import { GUILD_ROOM_ID, roomOffer } from '@/rooms/rooms';
import { textKey } from '@/shared/content';
import type { GameState } from '@/shared/state';

/** Something comes in sight once the player holds this share of its first price (and its level is reached). */
export const SIGHT = { share: 0.5 } as const;

export type SightKind = 'upgrade' | 'ingredient' | 'room' | 'decor' | 'gear' | 'legacy';

/** The side-panel tab an offer is listed in. */
export type SightTab = 'shop' | 'heroes' | 'legacy';

/**
 * One offer as the shop's sight sees it: a key in `shopSeen` (`<kind>:<id>`), where it is listed, and how it stands. The
 * shop shows it once it was in sight in this tavern (`shopSeen`), until it is sold out.
 */
/** What the sight of every offer looks at: which ones were seen and are new, and the gold. */
export type SeenState = Pick<GameState, 'shopSeen' | 'shopNew' | 'currencies'>;

export interface SightEntry<S extends SeenState = GameState> {
  key: string;
  /** What it is (the first part of the key), so a view knows how to show and buy it. */
  kind: SightKind;
  id: string;
  tab: SightTab;
  /** The heading it is listed under; at most one teaser per group. */
  group: string;
  /** Listed from the start, so the shop is never empty (Swift Cauldron). */
  fromStart: boolean;
  /** Its level, or whatever else it waits for, is reached. */
  open(state: S): boolean;
  /** The first price, in gold or (the Legacy) Golden Hop, and how much of that the player holds now. */
  price: number;
  held(state: S): number;
  soldOut(state: S): boolean;
  name(): string;
  /** The teaser line while it waits for something else than gold ("Unlocks at …"); null: no teaser then. */
  lockedNote(): string | null;
  /** The teaser line while only the gold is short. */
  saveKey: string;
}

type SightContent = Pick<Content, 'upgrades' | 'ingredients' | 'recipes' | 'rooms' | 'decor'>;

const gold = (state: SeenState): number => state.currencies.gold.toNumber();
const levelName = (level: number): string => t(textKey('reputation', REPUTATION_LEVELS[level - 1]?.id ?? '', 'name'));
const atLevel = (level: number) => (state: GameState): boolean => levelFor(state.reputation) >= level;
const unlocksAt = (level: number) => (): string => t('shop.ingredient_locked', { level: levelName(level) });

function upgradeEntry(def: UpgradeDef): SightEntry {
  const after = (): string => (def.unlockedBy ?? []).map((id) => t(textKey('upgrades', id, 'name'))).join(t('shop.or'));
  return {
    key: `upgrade:${def.id}`, kind: 'upgrade', id: def.id, tab: 'shop', group: def.kind, fromStart: def.shownFromStart === true,
    open: (state) => isUnlocked(state.upgrades, def),
    price: def.baseCost,
    held: gold,
    soldOut: (state) => levelsLeft(state.upgrades, def) <= 0,
    name: () => t(textKey('upgrades', def.id, 'name')),
    lockedNote: () => t('shop.teaser_after', { name: after() }),
    saveKey: 'shop.teaser_save',
  };
}

/** The offers of the Shop tab, in shop order: ingredients, rooms, decorations, then the upgrades by kind. */
export function shopSightEntries(content: SightContent): SightEntry[] {
  // kind: the key prefix and the shop group; domain: where its name is in i18n.
  const oneTime = (kind: SightKind, domain: 'ingredients' | 'rooms' | 'decor', id: string, buy: { level: number; cost: number }, owned: (s: GameState) => boolean): SightEntry => ({
    key: `${kind}:${id}`, kind, id, tab: 'shop', group: domain, fromStart: false,
    open: atLevel(buy.level), price: buy.cost, held: gold, soldOut: owned,
    name: () => t(textKey(domain, id, 'name')),
    lockedNote: unlocksAt(buy.level), saveKey: 'shop.teaser_save',
  });
  return [
    ...shopIngredients(content).flatMap((def) => (def.buy === undefined ? [] : [oneTime('ingredient', 'ingredients', def.id, def.buy, (s) => ingredientOffer(s, def, content).status === 'owned')])),
    ...content.rooms.map((room) => oneTime('room', 'rooms', room.id, room.buy, (s) => roomOffer(s, room).status === 'owned')),
    ...content.decor.map((def) => oneTime('decor', 'decor', def.id, def.buy, (s) => decorOffer(s, def).status === 'owned')),
    ...content.upgrades.map(upgradeEntry),
  ];
}

type GearSightState = SeenState & Pick<GameState, 'gearOwned' | 'roomsBuilt'>;

/** The gear sold in the Heroes tab: in sight once the guild hall stands and half the price is there (no teaser before). */
export function gearSightEntries(): SightEntry<GearSightState>[] {
  return GEAR.flatMap((def) => {
    if (def.buy === undefined) return [];
    return [{
      key: `gear:${def.id}`, kind: 'gear' as const, id: def.id, tab: 'heroes' as const, group: 'gear', fromStart: false,
      open: (state: GearSightState) => state.roomsBuilt.includes(GUILD_ROOM_ID),
      price: def.buy.cost, held: gold,
      soldOut: (state: GearSightState) => gearOffer(state, def).status === 'owned',
      name: () => t(textKey('gear', def.id, 'name')),
      lockedNote: () => null, saveKey: 'shop.teaser_save',
    }];
  });
}

/** The Legacy bonuses: in sight with half the first price in Golden Hop; gone at their top level. */
type LegacySightState = SeenState & Pick<GameState, 'prestige'>;

export function legacySightEntries(): SightEntry<LegacySightState>[] {
  return LEGACY.map((def) => ({
    key: `${LEGACY_SIGHT_PREFIX}${def.id}`, kind: 'legacy' as const, id: def.id, tab: 'legacy' as const, group: 'legacy', fromStart: false,
    open: () => true,
    price: def.baseCost, held: (state: LegacySightState) => state.prestige.hops,
    soldOut: (state: LegacySightState) => legacyCost(state.prestige, def) === undefined,
    name: () => t(textKey('legacy', def.id, 'name')),
    lockedNote: () => null, saveKey: 'legacy.teaser',
  }));
}

export const allSightEntries = (content: SightContent): SightEntry[] => [...shopSightEntries(content), ...gearSightEntries(), ...legacySightEntries()];

/** Not seen yet, and right now its level is reached and half its price is there (cheap checks first: this runs on every change). */
function comesInSight(entry: SightEntry, state: GameState): boolean {
  if (state.shopSeen.includes(entry.key)) return false;
  if (!entry.fromStart && !(entry.held(state) >= entry.price * SIGHT.share && entry.open(state))) return false;
  return !entry.soldOut(state);
}

/**
 * Marks offers as seen the moment they come in sight, and as new (`shopNew`) so the shop can say so. What is in sight
 * when the game loads is marked silently: an old save does not light up everything at once. One line in createWorld.
 */
export function startShopSight({ store, content }: Pick<World, 'store' | 'content'>): void {
  const entries = allSightEntries(content);
  const look = (fresh: boolean): void => {
    const state = store.getState();
    let any = false;
    for (const entry of entries) any ||= comesInSight(entry, state);
    if (!any) return;
    store.update((s) => {
      for (const entry of entries) {
        if (!comesInSight(entry, s)) continue;
        s.shopSeen.push(entry.key);
        if (fresh) s.shopNew.push(entry.key);
      }
    });
  };
  look(false);
  store.subscribe(() => look(true));
}

/** How one offer shows in its tab: as a row, as the grey teaser of its group, or not at all. */
export type SightStatus = 'shown' | 'teaser' | 'hidden';

export const isShown = <S extends SeenState>(entry: SightEntry<S>, state: S): boolean =>
  (entry.fromStart || state.shopSeen.includes(entry.key)) && !entry.soldOut(state);

/** It came in sight and its tab was not opened since. */
export const isFresh = <S extends SeenState>(entry: SightEntry<S>, state: S): boolean => state.shopNew.includes(entry.key) && isShown(entry, state);

/** The status of each entry (same order): shown ones, plus per group the first one still to come as a teaser. */
export function sightStatuses<S extends SeenState>(entries: readonly SightEntry<S>[], state: S): SightStatus[] {
  const teased = new Set<string>();
  return entries.map((entry) => {
    if (isShown(entry, state)) return 'shown';
    if (teased.has(entry.group) || entry.soldOut(state) || (!entry.open(state) && entry.lockedNote() === null)) return 'hidden';
    teased.add(entry.group);
    return 'teaser';
  });
}

/** The grey teaser row: the name and what it waits for, without a price or a button. */
export function teaserRow<S extends SeenState>(entry: SightEntry<S>, state: S): RowView {
  const note = entry.open(state) ? t(entry.saveKey) : (entry.lockedNote() ?? '');
  return { name: entry.name(), description: '', level: note, buyLabel: '', canBuy: false, maxed: false, teaser: true };
}

/** The row for an entry by its status: its own view with the "New!" label, the teaser, or null when it is not listed. */
export function sightRow<S extends SeenState>(entry: SightEntry<S>, status: SightStatus, state: S, view: () => RowView): RowView | null {
  if (status === 'hidden') return null;
  return status === 'teaser' ? teaserRow(entry, state) : { ...view(), fresh: isFresh(entry, state) };
}

/** Whether a tab has something new in sight (its button and the Menu button get a dot). */
export const tabHasNew = (entries: readonly SightEntry[], state: GameState, tab: SightTab): boolean =>
  state.shopNew.length > 0 && entries.some((entry) => entry.tab === tab && isFresh(entry, state));

/** The player looked at a tab: what was new there is not any more. */
export function clearNew({ store }: Pick<World, 'store'>, entries: readonly SightEntry[], tab: SightTab): void {
  const keys = new Set(entries.filter((entry) => entry.tab === tab).map((entry) => entry.key));
  if (!store.getState().shopNew.some((key) => keys.has(key))) return;
  store.update((s) => void (s.shopNew = s.shopNew.filter((key) => !keys.has(key))));
}
