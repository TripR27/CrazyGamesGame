import { describe, expect, it } from 'vitest';
import { hasKey, t, createTranslator } from '@/i18n/translator';

describe('createTranslator', () => {
  const tr = createTranslator({
    messages: { 'a.b': 'Hello', 'a.gold': 'You earned {n} gold from {who}' },
    fallback: { 'a.b': 'Fallback', 'a.only_fallback': 'Backup' },
  });

  it('returns the message for a known key', () => {
    expect(tr.t('a.b')).toBe('Hello');
  });

  it('fills in parameters, including numbers', () => {
    expect(tr.t('a.gold', { n: 12, who: 'a troll' })).toBe('You earned 12 gold from a troll');
  });

  it('keeps a placeholder visible when its parameter is missing', () => {
    expect(tr.t('a.gold', { n: 1 })).toBe('You earned 1 gold from {who}');
  });

  it('falls back to the fallback language for missing keys only', () => {
    expect(tr.t('a.only_fallback')).toBe('Backup');
    expect(tr.t('a.b')).toBe('Hello');
  });

  it('returns the key itself when nothing matches', () => {
    expect(tr.t('nope.nothing')).toBe('nope.nothing');
  });

  it('reports which keys exist', () => {
    expect(tr.has('a.b')).toBe(true);
    expect(tr.has('a.only_fallback')).toBe(true);
    expect(tr.has('nope')).toBe(false);
  });
});

describe('default English translator', () => {
  it('translates real game content', () => {
    expect(t('recipes.slime_sap.name')).toBe('Slime Sap');
    expect(hasKey('customers.knight.name')).toBe(true);
  });
});
