import type { World } from '@/app/world';
import type { UpgradeEffect } from '@/economy/upgrade-data';
import { t } from '@/i18n/translator';
import { type RecipeDef, recipes } from '@/recipes/recipe-data';
import { textKey } from '@/shared/content';
import { formatNumber, num, type Num } from '@/shared/numbers';
import type { GameState } from '@/shared/state';

/** What an achievement counts. The value of each comes from `STAT_VALUES`. */
export type AchievementStat = 'served' | 'vipServed' | 'goldEarned' | 'recipes' | 'legendary' | 'trips' | 'bossWins' | 'taverns';

type StatState = Pick<GameState, 'stats' | 'recipesDiscovered' | 'prestige'>;

/** Legendary recipes the player knows (a loop, no new arrays: this runs on every store change). */
function legendaryKnown(state: StatState, all: readonly RecipeDef[]): number {
  let n = 0;
  for (const r of all) if (r.rarity === 'legendary' && state.recipesDiscovered.includes(r.id)) n += 1;
  return n;
}

/** The current value of each counted thing. A new kind of achievement is one more entry. */
export const STAT_VALUES: Readonly<Record<AchievementStat, (state: StatState) => number>> = {
  served: (s) => s.stats.served,
  vipServed: (s) => s.stats.vipServed,
  goldEarned: (s) => s.stats.goldEarned.toNumber(),
  recipes: (s) => s.recipesDiscovered.length,
  legendary: (s) => legendaryKnown(s, recipes),
  trips: (s) => s.stats.trips,
  bossWins: (s) => s.stats.bossWins,
  taverns: (s) => s.prestige.runs,
};

/**
 * An achievement: reached once `stat` reaches `goal`, and from then on a small bonus for good (like an upgrade level).
 * `big`: one of the great moments (the platform celebrates those in step 20). Texts: `achievements.<id>.name`.
 */
export interface AchievementDef {
  id: string;
  stat: AchievementStat;
  goal: number;
  bonus: UpgradeEffect;
  big?: true;
}

const pricier = (share: number): UpgradeEffect => ({ stat: 'sellPrice', mode: 'multiply', perLevel: share });
const faster = (share: number): UpgradeEffect => ({ stat: 'brewSpeed', mode: 'multiply', perLevel: share });

/** Placeholder goals and bonuses. A new achievement is one more entry and its name in i18n. */
export const ACHIEVEMENTS: readonly AchievementDef[] = [
  { id: 'first_pint', stat: 'served', goal: 1, bonus: pricier(0.01) },
  { id: 'regulars', stat: 'served', goal: 100, bonus: pricier(0.02) },
  { id: 'packed_house', stat: 'served', goal: 1000, bonus: faster(0.03) },
  { id: 'royal_treatment', stat: 'vipServed', goal: 10, bonus: { stat: 'vipChance', mode: 'multiply', perLevel: 0.05 } },
  { id: 'pocket_money', stat: 'goldEarned', goal: 10_000, bonus: pricier(0.01) },
  { id: 'gold_rush', stat: 'goldEarned', goal: 1_000_000, bonus: pricier(0.03) },
  { id: 'curious', stat: 'recipes', goal: 5, bonus: faster(0.02) },
  { id: 'recipe_hoarder', stat: 'recipes', goal: 21, bonus: pricier(0.05), big: true },
  { id: 'legend_in_a_glass', stat: 'legendary', goal: 1, bonus: pricier(0.03), big: true },
  { id: 'adventurer', stat: 'trips', goal: 10, bonus: faster(0.02) },
  { id: 'veteran', stat: 'trips', goal: 100, bonus: faster(0.03) },
  { id: 'witch_hunter', stat: 'bossWins', goal: 1, bonus: pricier(0.02) },
  { id: 'swamp_legend', stat: 'bossWins', goal: 25, bonus: pricier(0.03) },
  { id: 'new_owner', stat: 'taverns', goal: 1, bonus: pricier(0.05), big: true },
];

/** What the achievements reached add to the stats: each bonus once. */
export function achievementBonuses(reached: readonly string[] | undefined): { effect: UpgradeEffect; times: number }[] {
  if (reached === undefined || reached.length === 0) return [];
  return ACHIEVEMENTS.filter((a) => reached.includes(a.id)).map((a) => ({ effect: a.bonus, times: 1 }));
}

/** Marks every achievement whose goal is reached and announces each one. */
function checkAchievements({ store, bus }: Pick<World, 'store' | 'bus'>): void {
  const state = store.getState();
  for (const def of ACHIEVEMENTS) {
    if (state.achievements.includes(def.id) || STAT_VALUES[def.stat](state) < def.goal) continue;
    store.update((s) => void s.achievements.push(def.id));
    bus.emit('achievement:unlocked', { id: def.id, big: def.big === true });
    bus.emit('saveRequested', {});
  }
}

/**
 * Keeps the lifetime statistics (serves, VIPs, gold, trips, bosses beaten) and hands out achievements as soon as one is
 * reached, also for a save that reached it before achievements existed. One line in createWorld.
 */
export function startAchievements(world: Pick<World, 'store' | 'bus'>): void {
  const { store, bus } = world;
  const addGold = (gold: Num): void => store.update((s) => void (s.stats.goldEarned = s.stats.goldEarned.add(gold)));
  bus.on('customer:served', ({ gold, tip, vip }) =>
    store.update((s) => {
      s.stats.served += 1;
      if (vip) s.stats.vipServed += 1;
      s.stats.goldEarned = s.stats.goldEarned.add(gold).add(tip);
    }),
  );
  bus.on('offline:paid', ({ gold }) => addGold(gold));
  bus.on('hero:returned', ({ boss }) =>
    store.update((s) => {
      s.stats.trips += 1;
      if (boss === 'won') s.stats.bossWins += 1;
    }),
  );
  checkAchievements(world);
  store.subscribe(() => checkAchievements(world));
}

/** One achievement in the Trophies tab: reached or not, what it asks, its bonus and how far the player is. */
export interface TrophyView {
  id: string;
  name: string;
  /** "Serve 100 customers · Drinks +2%" */
  text: string;
  /** "37/100" while not reached, empty once reached. */
  progress: string;
  reached: boolean;
}

/** A count or an amount in the game's number style ("1.2K"). */
const fmt = (n: number | Num): string => formatNumber(typeof n === 'number' ? num(n) : n);

/** What a bonus does, as the player reads it: "Drinks +2%". */
const bonusText = (effect: UpgradeEffect): string => t(`achievements.bonus_${effect.stat}`, { n: Math.round(effect.perLevel * 100) });

export function toTrophyView(def: AchievementDef, state: StatState & Pick<GameState, 'achievements'>): TrophyView {
  const reached = state.achievements.includes(def.id);
  const value = Math.min(def.goal, Math.floor(STAT_VALUES[def.stat](state)));
  return {
    id: def.id,
    name: t(textKey('achievements', def.id, 'name')),
    text: t('achievements.line', { goal: t(`achievements.goal_${def.stat}`, { n: fmt(def.goal) }), bonus: bonusText(def.bonus) }),
    progress: reached ? '' : t('achievements.progress', { value: fmt(value), goal: fmt(def.goal) }),
    reached,
  };
}

/** The toast when an achievement is reached: its name and its bonus. */
export function toAchievementToast(id: string): { title: string; lines: string[] } {
  const def = ACHIEVEMENTS.find((a) => a.id === id);
  if (def === undefined) return { title: '', lines: [] };
  return { title: t('achievements.unlocked', { name: t(textKey('achievements', def.id, 'name')) }), lines: [bonusText(def.bonus), t('achievements.see_tab')] };
}

/** The lifetime statistics shown under the trophies. */
export function statLines(state: StatState): string[] {
  const { stats } = state;
  return [
    t('stats.served', { n: fmt(stats.served) }),
    t('stats.vip_served', { n: fmt(stats.vipServed) }),
    t('stats.gold', { n: fmt(stats.goldEarned) }),
    t('stats.recipes', { n: state.recipesDiscovered.length, total: recipes.length }),
    t('stats.trips', { n: fmt(stats.trips) }),
    t('stats.bosses', { n: fmt(stats.bossWins) }),
    t('stats.taverns', { n: state.prestige.runs }),
  ];
}
