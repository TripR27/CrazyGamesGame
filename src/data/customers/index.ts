import type { CustomerDef } from './types';

export type { CustomerDef, CustomerId } from './types';

// Placeholder numbers; tuned in step 11 and 13.
export const customers: readonly CustomerDef[] = [
  { id: 'knight', minReputation: 0, patienceSeconds: 60, spendMultiplier: 1, likes: ['speed'] },
  { id: 'elf', minReputation: 10, patienceSeconds: 45, spendMultiplier: 1.3, likes: ['charm'] },
  { id: 'dwarf', minReputation: 25, patienceSeconds: 40, spendMultiplier: 1.6, likes: ['strength'] },
];
