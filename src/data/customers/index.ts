import type { CustomerDef } from '@/data/customers/types';

// Placeholder numbers; tuned in step 13.
export const customers: readonly CustomerDef[] = [
  { id: 'knight', minLevel: 1, patienceSeconds: 60, spendMultiplier: 1, likes: ['speed', 'luck'] },
  { id: 'elf', minLevel: 2, patienceSeconds: 45, spendMultiplier: 1.3, likes: ['charm'] },
  { id: 'dwarf', minLevel: 3, patienceSeconds: 40, spendMultiplier: 1.6, likes: ['strength'] },
  { id: 'king', minLevel: 3, patienceSeconds: 30, spendMultiplier: 3, likes: [], vip: true, reputationBonus: 3 },
];
