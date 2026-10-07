import { describe, expect, it } from 'vitest';
import { economy } from '../systems/fixtures';
import { upgrades } from '@/data/upgrades/index';
import { effectAmount, toRowView } from '@/ui/shop/shop-view-model';

const swift = upgrades.find((u) => u.id === 'swift_cauldron');
if (swift === undefined) throw new Error('swift_cauldron missing');

describe('shop row view', () => {
  it('reads an effect as a percentage for factors and a plain number for added amounts', () => {
    expect(effectAmount({ stat: 'brewSpeed', mode: 'multiply', perLevel: 0.15 })).toBe('+15%');
    expect(effectAmount({ stat: 'storage', mode: 'add', perLevel: 1 })).toBe('+1');
  });

  it('shows name, level and the price of the next level, and disables buying when poor', () => {
    const view = toRowView(swift, economy(5).getState(), 1);
    expect(view.name).toBe('Swift Cauldron');
    expect(view.description).toContain('+10%');
    expect(view.level).toBe('Level 0');
    expect(view.buyLabel).toBe('Buy 1x · 20');
    expect(view.canBuy).toBe(false);
  });

  it('enables buying when the gold is enough and shows the pack price for x10 and max', () => {
    const state = economy(500).getState();
    expect(toRowView(swift, state, 1).canBuy).toBe(true);
    expect(toRowView(swift, state, 10).canBuy).toBe(true);
    expect(toRowView(swift, state, 'max').buyLabel).toMatch(/^Buy \d+x · /);
  });

  it('shows a maxed upgrade as such', () => {
    const state = economy(1e9).getState();
    state.upgrades.swift_cauldron = 15;
    const view = toRowView(swift, state, 'max');
    expect(view).toMatchObject({ maxed: true, canBuy: false, level: 'Level 15 (max)', buyLabel: 'Maxed' });
  });
});
