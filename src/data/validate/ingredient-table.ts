import { RARITIES } from '@/data/common';
import type { IngredientDef } from '@/data/ingredients/types';
import { REPUTATION_LEVELS } from '@/data/reputation/levels';
import { isTier, oneOf, positive, tierRule } from '@/data/validate/rules';
import { defineTable, type ContentTable } from '@/data/validate/table';

const SOURCE_PATTERN = /^(shop|dungeon:[a-z][a-z0-9_]*)$/;

/** A shop purchase opens at a level after the first (level 1 ingredients are simply basic) and costs gold. */
const buyRule = (i: IngredientDef): string[] => [
  ...(i.source === 'shop' ? [] : ['only shop ingredients can be bought']),
  ...(isTier(i.buy?.level ?? 0) && (i.buy?.level ?? 0) >= 2 && (i.buy?.level ?? 0) <= REPUTATION_LEVELS.length
    ? [] : [`buy.level must be a level from 2 to ${REPUTATION_LEVELS.length}`]),
  ...positive(i.buy?.cost ?? 0, 'buy.cost'),
];

export const ingredientTable = (items: readonly IngredientDef[]): ContentTable =>
  defineTable({
    domain: 'ingredients',
    items,
    textFields: ['name'],
    check: (i) => [
      ...tierRule(i.tier),
      ...oneOf(i.rarity, RARITIES, 'rarity'),
      ...(SOURCE_PATTERN.test(i.source) ? [] : [`source "${i.source}" must be shop or dungeon:<id>`]),
      ...(i.buy === undefined ? [] : buyRule(i)),
    ],
  });
