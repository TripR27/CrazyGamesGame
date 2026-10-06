import { describe, expect, it } from 'vitest';
import { recipes } from '@/data/recipes';
import { toBookView, type BookEntry } from '@/ui/recipe-book/book-view-model';

const entry = (entries: BookEntry[], id: string): BookEntry | undefined => entries.find((e) => e.id === id);

describe('the recipe book', () => {
  it('shows progress and how to make every known drink', () => {
    const view = toBookView({ recipesDiscovered: ['slime_sap', 'glowcap_stout'], reputation: 0, ingredientsBought: [] }, recipes);
    expect(view.progress).toBe(`2/${recipes.length} discovered`);
    expect(entry(view.entries, 'slime_sap')).toEqual({
      kind: 'known',
      id: 'slime_sap',
      name: 'Slime Sap',
      ingredients: [{ id: 'swamp_slime', name: 'Swamp Slime' }, { id: 'wild_honey', name: 'Wild Honey' }],
      details: ['4s brew', '8 gold', '💖 Charm: more reputation'],
      rarity: 'common',
    });
  });

  it('shows a hint for a drink that can be discovered, and the level for one that cannot yet', () => {
    const view = toBookView({ recipesDiscovered: [], reputation: 10, ingredientsBought: [] }, recipes);
    expect(entry(view.entries, 'bog_lantern')).toMatchObject({ kind: 'hidden', rarity: 'common' });
    expect(entry(view.entries, 'bog_lantern')).toHaveProperty('hint', expect.stringContaining('Swamp'));
    expect(entry(view.entries, 'moonlight_merlot')).toEqual({ kind: 'locked', id: 'moonlight_merlot', unlock: 'Unlocks at Cozy Inn' });
  });

  it('lists every recipe, in content order', () => {
    const view = toBookView({ recipesDiscovered: [], reputation: 0, ingredientsBought: [] }, recipes);
    expect(view.entries.map((e) => e.id)).toEqual(recipes.map((r) => r.id));
  });
});
