import { describe, expect, it } from 'vitest';
import { decorTable, ingredientTable, reputationTable, roomTable, tutorialTable } from './validate-content';
import { validateContent, type ContentTable, customerTable, feedbackTable, recipeTable, upgradeTable } from './validate-core';
import { ingredients, type IngredientDef } from '@/brewing/ingredients';
import { customers, type CustomerDef } from '@/customers/customer-data';
import type { DecorDef } from '@/decor/decor';
import { upgrades, type UpgradeDef } from '@/economy/upgrade-data';
import { hasKey } from '@/i18n/translator';
import { recipes, STARTER_RECIPE_IDS, type RecipeDef } from '@/recipes/recipe-data';
import { REPUTATION_LEVELS } from '@/reputation/reputation';
import type { RoomDef } from '@/rooms/rooms';
import { EFFECTS } from '@/shared/content';

describe('game content', () => {
  it('passes validation with the English translations', () => {
    expect(validateContent(hasKey)).toEqual([]);
  });

  it('has the content of step 12: 6 ingredients, 13 recipes, 3 customer types and a VIP', () => {
    expect(ingredients).toHaveLength(6);
    expect(recipes).toHaveLength(13);
    expect(customers.filter((c) => c.vip !== true)).toHaveLength(3);
    expect(customers.filter((c) => c.vip === true)).toHaveLength(1);
  });

  it('lets a new player start: a regular customer at the first level', () => {
    expect(customers.some((c) => c.minLevel === 1 && c.vip !== true)).toBe(true);
  });

  it('has a starter recipe made only of shop ingredients', () => {
    const shop = new Set(ingredients.filter((i) => i.source === 'shop').map((i) => i.id));
    const starter = recipes.filter((r) => r.tier === 1 && r.ingredients.every((i) => shop.has(i)));
    expect(starter.length).toBeGreaterThan(0);
  });

  it('only gives new players recipes that exist', () => {
    const ids = new Set(recipes.map((r) => r.id));
    expect(STARTER_RECIPE_IDS.length).toBeGreaterThan(0);
    expect(STARTER_RECIPE_IDS.filter((id) => !ids.has(id))).toEqual([]);
  });

  it('covers every drink effect with at least one recipe', () => {
    const covered = new Set(recipes.map((r) => r.effect));
    expect([...covered].sort()).toEqual([...EFFECTS].sort());
  });

  it('only unlocks recipes whose shop ingredients can be bought by that level', () => {
    const available = (id: string, level: number): boolean => {
      const def = ingredients.find((i) => i.id === id);
      return def !== undefined && def.source === 'shop' && (def.buy?.level ?? 1) <= level;
    };
    const tooEarly = REPUTATION_LEVELS.flatMap((l, i) =>
      (l.unlocks ?? []).filter((id) => !(recipes.find((r) => r.id === id)?.ingredients ?? []).every((ing) => available(ing, i + 1))),
    );
    expect(tooEarly).toEqual([]);
  });

  it('sells one new ingredient per level from level 2 on', () => {
    expect(ingredients.filter((i) => i.buy !== undefined).map((i) => i.buy?.level)).toEqual([2, 3, 4]);
  });

  it('uses every ingredient in at least one recipe', () => {
    const used = new Set(recipes.flatMap((r) => r.ingredients));
    expect(ingredients.filter((i) => !used.has(i.id))).toEqual([]);
  });
});

const allKeys = (): boolean => true;
const noKeys = (): boolean => false;
const ing = (id: string, over: Partial<IngredientDef> = {}): IngredientDef => ({
  id, tier: 1, rarity: 'common', source: 'shop', ...over,
});
const rec = (id: string, over: Partial<RecipeDef> = {}): RecipeDef => ({
  id, tier: 1, rarity: 'common', ingredients: ['a', 'b'], brewSeconds: 3, basePrice: 5, effect: 'luck', ...over,
});
const cust = (id: string, over: Partial<CustomerDef> = {}): CustomerDef => ({
  id, minLevel: 1, patienceSeconds: 30, spendMultiplier: 1, likes: ['luck'], ...over,
});
const base = (): ContentTable[] => [ingredientTable([ing('a'), ing('b')])];
const problems = (...tables: ContentTable[]): string[] => validateContent(allKeys, tables);

describe('validateContent', () => {
  it('accepts a small valid set', () => {
    expect(problems(...base(), recipeTable([rec('r1')]), customerTable([cust('c1')]))).toEqual([]);
  });

  it('reports duplicate ids and non-snake_case ids', () => {
    const out = problems(ingredientTable([ing('a'), ing('a'), ing('Bad-Id')]));
    expect(out.join('\n')).toMatch(/id is used more than once/);
    expect(out.join('\n')).toMatch(/must be snake_case/);
  });

  it('reports recipes that point at unknown ingredients', () => {
    const out = problems(...base(), recipeTable([rec('r1', { ingredients: ['a', 'ghost'] })]));
    expect(out).toEqual(['recipes.r1: unknown ingredient "ghost"']);
  });

  it('reports a shop purchase at a wrong level, for free, or of a dungeon ingredient', () => {
    const out = problems(ingredientTable([
      ing('a', { buy: { level: 1, cost: 10 } }), ing('b', { buy: { level: 2, cost: 0 } }), ing('c', { source: 'dungeon:cave', buy: { level: 2, cost: 5 } }),
    ]));
    expect(out).toEqual([expect.stringMatching(/^ingredients\.a: buy\.level/), expect.stringMatching(/^ingredients\.b: buy\.cost/), 'ingredients.c: only shop ingredients can be bought']);
  });

  it('reports repeated ingredients and wrong ingredient counts', () => {
    const out = problems(...base(), recipeTable([rec('r1', { ingredients: ['a', 'a'] })]));
    expect(out).toEqual(['recipes.r1: ingredient "a" is listed twice']);
    const one = rec('r2', { ingredients: ['a'] as unknown as RecipeDef['ingredients'] });
    expect(problems(...base(), recipeTable([one]))).toContain('recipes.r2: needs 2 or 3 ingredients');
  });

  it('reports two recipes with the same combination, whatever the order', () => {
    const out = problems(...base(), recipeTable([rec('r1'), rec('r2', { ingredients: ['b', 'a'] })]));
    expect(out).toEqual(['recipes: two recipes share the combination a+b']);
  });

  it('reports a recipe that is a part of a bigger recipe, since it could never be finished', () => {
    const big = rec('big', { ingredients: ['a', 'b', 'c'] });
    const out = problems(...base(), ingredientTable([ing('c')]), recipeTable([rec('small'), big]));
    expect(out).toContain('recipes: recipe small is a part of recipe big');
  });

  it('reports missing feedback lines', () => {
    const out = validateContent((k) => k === 'feedback.pool.1', [feedbackTable([{ id: 'served', lines: 2 }])]);
    expect(out).toEqual(['missing translation key feedback.served.1', 'missing translation key feedback.served.2']);
  });

  it('reports invalid numbers and unknown effects or rarities', () => {
    const bad = rec('r1', { brewSeconds: 0, basePrice: -1, tier: 0, effect: 'rage' as never, rarity: 'meh' as never });
    expect(problems(...base(), recipeTable([bad]))).toHaveLength(5);
    expect(problems(customerTable([cust('c1', { spendMultiplier: 0, minLevel: 0 })]))).toHaveLength(2);
  });

  it('reports a bad ingredient source', () => {
    const out = problems(ingredientTable([ing('a', { source: 'moon' as never })]));
    expect(out).toHaveLength(1);
  });

  it('reports every missing translation key', () => {
    const out = validateContent(noKeys, [ingredientTable([ing('a')]), customerTable([cust('c1')])]);
    expect(out).toEqual([
      'missing translation key ingredients.a.name',
      'missing translation key customers.c1.name',
      'missing translation key customers.c1.tagline',
    ]);
  });

  it('works on the real ingredient list too', () => {
    expect(validateContent(allKeys, [ingredientTable(ingredients)])).toEqual([]);
  });
});

const allKeysLevels = (): boolean => true;
const recipe: RecipeDef = { id: 'r1', tier: 1, rarity: 'common', ingredients: ['a', 'b'], brewSeconds: 3, basePrice: 5, effect: 'luck' };
const recipesOnly = recipeTable([recipe]);
// The recipe table also complains about its unknown ingredients; only the reputation lines matter here.
const levelProblems = (...levels: Parameters<typeof reputationTable>[0]): string[] =>
  validateContent(allKeysLevels, [recipesOnly, reputationTable(levels)]).filter((p) => p.startsWith('reputation'));

describe('validating reputation levels', () => {
  it('accepts levels that start at 0, climb and teach existing recipes', () => {
    expect(levelProblems({ id: 'one', minReputation: 0 }, { id: 'two', minReputation: 5, unlocks: ['r1'] })).toEqual([]);
  });

  it('reports a first level above 0, a level that does not climb and an unknown recipe', () => {
    expect(levelProblems({ id: 'one', minReputation: 3 })).toEqual(['reputation: the first level must start at 0 reputation']);
    expect(levelProblems({ id: 'one', minReputation: 0 }, { id: 'two', minReputation: 0 })).toEqual([
      'reputation: level two must need more reputation than the one before',
    ]);
    expect(levelProblems({ id: 'one', minReputation: 0, unlocks: ['nope'] })).toEqual([
      'reputation.one: unlocks unknown recipe "nope"',
    ]);
  });

  it('reports level names without a translation', () => {
    expect(validateContent(() => false, [reputationTable([{ id: 'one', minReputation: 0 }])])).toEqual([
      'missing translation key reputation.one.name',
    ]);
  });

  it('reports a customer whose level does not exist, or a negative reputation bonus', () => {
    const king = { id: 'k', minLevel: 99, patienceSeconds: 30, spendMultiplier: 3, likes: [], reputationBonus: -1 };
    expect(validateContent(allKeysLevels, [customerTable([king])])).toHaveLength(2);
  });
});

const room = (over: Partial<RoomDef> = {}): RoomDef => ({ id: 'r', buy: { level: 2, cost: 10 }, seats: 1, effects: [], ...over });
const roomProblems = (r: RoomDef): string[] => validateContent(() => true, [roomTable([r])]);

describe('room validation', () => {
  it('accepts a room with seats or an effect', () => {
    expect(roomProblems(room())).toEqual([]);
    expect(roomProblems(room({ seats: 0, effects: [{ stat: 'brewSpeed', mode: 'multiply', perLevel: 0.1 }] }))).toEqual([]);
  });

  it('reports a wrong level, a free room, a room that does nothing and an unknown stat', () => {
    expect(roomProblems(room({ buy: { level: 1, cost: 10 } }))).toEqual([expect.stringMatching(/buy\.level/)]);
    expect(roomProblems(room({ buy: { level: 2, cost: 0 } }))).toEqual([expect.stringMatching(/buy\.cost/)]);
    expect(roomProblems(room({ seats: 0 }))).toEqual(['rooms.r: a room must add seats or an effect']);
    const odd = room({ effects: [{ stat: 'luck' as 'seats', mode: 'add', perLevel: 1 }] });
    expect(roomProblems(odd)).toEqual([expect.stringMatching(/effect stat "luck"/)]);
  });
});

describe('validating tutorial steps', () => {
  it('reports tutorial steps with unknown targets, bad timers and split lessons', () => {
    const step = (id: string, lesson: string, over: object = {}) => ({
      id, lesson, target: 'cauldron', completeOn: { kind: 'event' as const, event: 'tick' as const }, ...over,
    });
    const out = validateContent(() => true, [
      tutorialTable([step('s1', 'x', { target: 'moon' }), step('s2', 'y', { completeOn: { kind: 'after', ms: 0 } }), step('s3', 'x')]),
    ]);
    expect(out).toContain('tutorial.s1: unknown target "moon"');
    expect(out).toContain('tutorial.s2: completeOn.ms must be a positive number, got 0');
    expect(out).toContain('tutorial: lesson x has steps that are not next to each other');
  });
});

const upgradeProblems = (...items: UpgradeDef[]): string[] => validateContent(() => true, [upgradeTable(items)]);
const upgrade = (over: Partial<UpgradeDef> = {}): UpgradeDef => ({
  id: 'u1', kind: 'cauldron', baseCost: 5, growth: 1.1,
  effect: { stat: 'brewSpeed', mode: 'multiply', perLevel: 0.1 }, ...over,
});

describe('upgrade validation', () => {
  it('accepts a sound upgrade and the real upgrade list', () => {
    expect(upgradeProblems(upgrade())).toEqual([]);
    expect(upgrades.length).toBeGreaterThan(0);
  });

  it('reports a free upgrade, no growth and a zero max level', () => {
    expect(upgradeProblems(upgrade({ baseCost: 0, growth: 1, maxLevel: 0 }))).toHaveLength(3);
  });

  it('rejects an upgrade that changes nothing', () => {
    const idle = upgrade({ effect: { stat: 'brewSpeed', mode: 'multiply', perLevel: 0 } });
    expect(upgradeProblems(idle)).toEqual(['upgrades.u1: effect.perLevel must be a positive number, got 0']);
  });
});

const decorItem = (over: Partial<DecorDef> = {}): DecorDef => ({
  id: 'd', buy: { level: 2, cost: 10 }, effects: [{ stat: 'sellPrice', mode: 'multiply', perLevel: 0.03 }], ...over,
});
const decorProblems = (d: DecorDef): string[] => validateContent(() => true, [decorTable([d])]);

describe('decoration validation', () => {
  it('accepts a decoration with a bonus', () => {
    expect(decorProblems(decorItem())).toEqual([]);
  });

  it('reports a wrong level, a free decoration and one without a bonus', () => {
    expect(decorProblems(decorItem({ buy: { level: 1, cost: 10 } }))).toEqual([expect.stringMatching(/buy\.level/)]);
    expect(decorProblems(decorItem({ buy: { level: 2, cost: 0 } }))).toEqual([expect.stringMatching(/buy\.cost/)]);
    expect(decorProblems(decorItem({ effects: [] }))).toEqual(['decor.d: a decoration must give a bonus']);
  });
});
