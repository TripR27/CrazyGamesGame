import { describe, expect, it } from 'vitest';
import { customers } from '@/data/customers';
import { toLevelUpView } from '@/ui/level-up/level-up-view-model';

describe('the level-up message', () => {
  it('names the new level and what it brings: new customers and new recipes', () => {
    expect(toLevelUpView(3, customers)).toEqual({
      title: 'Level up! Cozy Inn',
      lines: ['New customer: Thirsty Dwarf', 'New customer: King Grumblebeard', "New recipe: Dragon's Hiccup"],
    });
  });

  it('has just the title for a level that brings nothing new', () => {
    expect(toLevelUpView(6, customers)).toEqual({ title: 'Level up! Legendary Hall', lines: [] });
  });

  it('is empty for a level that does not exist', () => {
    expect(toLevelUpView(42, customers)).toEqual({ title: '', lines: [] });
  });
});
