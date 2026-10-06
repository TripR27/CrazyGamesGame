import type { ReputationLevel } from '@/data/reputation/levels';
import { defineTable, type ContentTable } from './table';

/** Levels need a name, must start at 0 and climb, and may only teach recipes that exist. */
export const reputationTable = (items: readonly ReputationLevel[]): ContentTable =>
  defineTable({
    domain: 'reputation',
    items,
    textFields: ['name'],
    check: (level, ctx) =>
      (level.teaches ?? []).filter((id) => !ctx.has('recipes', id)).map((id) => `teaches unknown recipe "${id}"`),
    checkSet: (all) => [
      ...(all[0]?.minReputation === 0 ? [] : ['the first level must start at 0 reputation']),
      ...all
        .filter((level, i) => i > 0 && level.minReputation <= (all[i - 1]?.minReputation ?? 0))
        .map((level) => `level ${level.id} must need more reputation than the one before`),
    ],
  });
