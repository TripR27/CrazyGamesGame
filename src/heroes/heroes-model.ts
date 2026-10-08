import { DUNGEONS, GUILD_ROOM_ID, HERO_CLASSES, HEROES, type HeroClassDef, guildBuilt, heroStatus, heroWaitMs, hireOffer, xpToNext } from '@/heroes/heroes';
import { t } from '@/i18n/translator';
import { REPUTATION_LEVELS } from '@/reputation/reputation';
import { ROOMS } from '@/rooms/rooms';
import { textKey } from '@/shared/content';
import { formatNumber } from '@/shared/numbers';
import type { GameState } from '@/shared/state';

/** What the Heroes tab and the guild hall read. */
export type HeroesState = Pick<GameState, 'heroes' | 'roomsBuilt' | 'currencies' | 'ingredientStock'>;

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
}

export interface HeroesView {
  /** Without the guild hall there are no heroes yet: just this line. */
  noGuild: string | null;
  stockTitle: string;
  /** One line per dungeon ingredient held, or the line that there is nothing yet; empty without the guild hall. */
  stock: string[];
  cards: HeroCardView[];
}

const name = (domain: 'heroes' | 'dungeons' | 'ingredients', id: string): string => t(textKey(domain, id, 'name'));
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

/** One hero's card: name and class, level and XP, where they are, and what the player can do. */
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
  };
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
    stock: built ? stockLines(state) : [],
    cards: built ? HERO_CLASSES.map((def) => toHeroCard(def, state, now)) : [],
  };
}
