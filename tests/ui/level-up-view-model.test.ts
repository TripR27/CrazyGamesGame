import { describe, expect, it } from 'vitest';
import { customers } from '@/data/customers';
import { toLevelUpView } from '@/ui/level-up/level-up-view-model';

describe('the level-up message', () => {
  it('names the new level and what it brings, keeping new recipe names a secret', () => {
    expect(toLevelUpView(3, customers)).toEqual({
      title: 'Level up! Cozy Inn',
      lines: ['New customer: Thirsty Dwarf', 'New customer: King Grumblebeard', 'New recipes to discover: 2. Check the recipe book!'],
    });
  });

  it('has just the title for a level that brings nothing new', () => {
    const levels = [{ id: 'shabby_shack', minReputation: 0 }, { id: 'local_haunt', minReputation: 5 }];
    expect(toLevelUpView(2, [], levels)).toEqual({ title: 'Level up! Local Haunt', lines: [] });
  });

  it('is empty for a level that does not exist', () => {
    expect(toLevelUpView(42, customers)).toEqual({ title: '', lines: [] });
  });
});
