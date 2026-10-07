import { describe, expect, it } from 'vitest';
import { economy } from './fixtures';
import { ingredients, type IngredientShopState } from '@/brewing/ingredients';
import { effectAmount, isUpgradeListed, toRowView, isIngredientListed, toIngredientRowView, roomDescription, toRoomRowView } from '@/economy/shop-model';
import { upgrades } from '@/economy/upgrade-data';
import { firstAffordable, quoteFor } from '@/economy/upgrades';
import { recipes } from '@/recipes/recipe-data';
import { toBookView } from '@/recipes/recipes';
import { ROOMS, roomOffer } from '@/rooms/rooms';
import { roomSign } from '@/rooms/rooms-view';
import { num } from '@/shared/numbers';

const swift = upgrades.find((u) => u.id === 'swift_cauldron');
if (swift === undefined) throw new Error('swift_cauldron missing');

describe('shop row view', () => {
  it('reads an effect as a percentage for factors and a plain number for added amounts', () => {
    expect(effectAmount({ stat: 'brewSpeed', mode: 'multiply', perLevel: 0.15 })).toBe('+15%');
    expect(effectAmount({ stat: 'storage', mode: 'add', perLevel: 1 })).toBe('+1');
    expect(effectAmount({ stat: 'offlineShare', mode: 'add', perLevel: 0.05 })).toBe('+5%');
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

const catalog = { ingredients, recipes };
const grape = ingredients.find((i) => i.id === 'moon_grape') ?? ingredients[0];
const state = (reputation: number, gold: number, bought: string[] = []): IngredientShopState => ({
  reputation, currencies: { gold: num(gold) }, ingredientsBought: bought, recipesDiscovered: ['slime_sap'],
});

describe('an ingredient in the shop', () => {
  it('shows the level that opens it, then its price, then that it is on the shelf', () => {
    if (grape === undefined) throw new Error('no ingredients');
    expect(toIngredientRowView(grape, state(0, 999), catalog)).toMatchObject({
      name: 'Moon Grape', level: 'Unlocks at Cozy Inn', buyLabel: 'Buy · 150', canBuy: false, maxed: false,
    });
    expect(toIngredientRowView(grape, state(40, 150), catalog)).toMatchObject({ level: '', canBuy: true });
  });

  it('leaves the shop once it is bought, but is listed while locked or for sale', () => {
    if (grape === undefined) throw new Error('no ingredients');
    expect(isIngredientListed(grape, state(0, 0), catalog)).toBe(true);
    expect(isIngredientListed(grape, state(40, 0), catalog)).toBe(true);
    expect(isIngredientListed(grape, state(40, 0, ['moon_grape']), catalog)).toBe(false);
  });
});

describe('the recipe book and the ingredient shop', () => {
  it('tells which shop ingredient a discoverable recipe still needs', () => {
    const book = (bought: string[]) => toBookView({ recipesDiscovered: [], reputation: 10, ingredientsBought: bought }, recipes);
    const hiccup = (bought: string[]) => book(bought).entries.find((e) => e.id === 'dragons_hiccup');
    expect(hiccup([])).toMatchObject({ kind: 'hidden', needs: 'Needs Fire Pepper from the shop' });
    expect(hiccup(['fire_pepper'])).not.toHaveProperty('needs');
    expect(book([]).entries.find((e) => e.id === 'bog_lantern')).not.toHaveProperty('needs');
  });
});

const lab = ROOMS.find((r) => r.id === 'alchemy_lab') ?? ROOMS[0];
const lounge = ROOMS.find((r) => r.id === 'vip_lounge') ?? ROOMS[0];
const roomState = (reputation: number, gold: number, built: string[] = []) => ({ reputation, currencies: { gold: num(gold) }, roomsBuilt: built });

describe('a room in the shop and on the upper floor', () => {
  it('describes its seats and bonuses with the amounts from the data', () => {
    if (lab === undefined || lounge === undefined) throw new Error('no rooms');
    expect(roomDescription(lab)).toMatch(/^The cauldron brews \+25% faster and the bar holds \+1 drink\./);
    expect(roomDescription(lounge)).toMatch(/^\+100% VIPs, and \+2 seats/);
  });

  it('shows the level that opens it, then its price', () => {
    if (lab === undefined) throw new Error('no rooms');
    expect(toRoomRowView(lab, roomState(0, 0))).toMatchObject({ name: 'Alchemy Lab', level: 'Unlocks at Popular Pub', canBuy: false });
    expect(toRoomRowView(lab, roomState(120, lab.buy.cost))).toMatchObject({ level: '', canBuy: true, buyLabel: expect.stringMatching(/^Build · /) });
  });

  it('has a sign while boarded up, and none once built', () => {
    if (lab === undefined) throw new Error('no rooms');
    expect(roomSign(lab, roomOffer(roomState(0, 0), lab))).toBe('Alchemy Lab\nUnlocks at Popular Pub');
    expect(roomSign(lab, roomOffer(roomState(120, 0), lab))).toMatch(/^Alchemy Lab\nBuild in the shop: /);
    expect(roomSign(lab, roomOffer(roomState(120, 0, ['alchemy_lab']), lab))).toBe('');
  });
});

const night = (id: string) => {
  const def = upgrades.find((u) => u.id === id);
  if (def === undefined) throw new Error(`no upgrade ${id}`);
  return def;
};
const levels = (owned: Record<string, number>) => ({ currencies: { gold: num(1e9) }, upgrades: owned });

describe('Night Shift in the shop', () => {
  it('is for sale only after the first staff member, and leaves the shop once bought', () => {
    const shift = night('night_shift');
    expect(isUpgradeListed(shift, levels({}))).toBe(false);
    expect(quoteFor(levels({}), shift, 1).affordable).toBe(false);
    expect(isUpgradeListed(shift, levels({ waitress: 1 }))).toBe(true);
    expect(quoteFor(levels({ waitress: 1 }), shift, 1).affordable).toBe(true);
    expect(isUpgradeListed(shift, levels({ waitress: 1, night_shift: 1 }))).toBe(false);
  });

  it('opens the share and hours upgrades only once Night Shift is bought, so nothing can buy them earlier', () => {
    const owls = night('night_owls');
    const nights = upgrades.filter((u) => u.kind === 'night' && u.id !== 'night_shift');
    expect(isUpgradeListed(owls, levels({ brewer_assistant: 1 }))).toBe(false);
    expect(firstAffordable(levels({ brewer_assistant: 1 }), nights)).toBeUndefined();
    expect(isUpgradeListed(owls, levels({ brewer_assistant: 1, night_shift: 1 }))).toBe(true);
    expect(toRowView(owls, levels({ night_shift: 1 }), 1).description).toMatch(/\+5% harder/);
  });
});
