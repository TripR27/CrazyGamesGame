import { describe, expect, it, vi } from 'vitest';
import { newGame } from './flows/helpers';
import { DECORATIONS, buyDecorById, decorOffer, type DecorState, firstBuyableDecor, watchDecorShop } from '@/decor/decor';
import { toDecorRowView } from '@/economy/shop-model';
import { getMultipliers } from '@/economy/upgrades';
import { createEventBus, type GameEvents } from '@/shared/events';
import { num } from '@/shared/numbers';
import { createInitialState, createStore } from '@/shared/state';

const decor = (id: string) => {
  const def = DECORATIONS.find((d) => d.id === id);
  if (def === undefined) throw new Error(`no decoration ${id}`);
  return def;
};
const state = (reputation: number, gold: number, bought: string[] = []): DecorState => ({ reputation, currencies: { gold: num(gold) }, decorBought: bought });

/** A real world with `reputation` and `gold`. */
function game(reputation: number, gold: number) {
  const initial = createInitialState(0);
  initial.reputation = reputation;
  initial.currencies.gold = num(gold);
  return newGame(initial);
}

describe('buying decorations', () => {
  it('opens a decoration at its level and sells it once for its price', () => {
    const torch = decor('wall_torch');
    expect(decorOffer(state(0, 1e9), torch).status).toBe('locked');
    expect(firstBuyableDecor(state(10, torch.buy.cost - 1), DECORATIONS)).toBeUndefined();
    const g = game(10, torch.buy.cost + 5);
    const bought = vi.fn();
    g.world.bus.on('decor:bought', bought);
    buyDecorById(g.world, 'wall_torch');
    buyDecorById(g.world, 'wall_torch');
    expect(g.state.decorBought).toEqual(['wall_torch']);
    expect(g.state.currencies.gold.toNumber()).toBe(5);
    expect(bought).toHaveBeenCalledTimes(1);
    expect(g.saves).toHaveBeenCalled();
    expect(decorOffer(g.state, torch).status).toBe('owned');
  });

  it('does nothing for an unknown, locked or too expensive decoration', () => {
    const g = game(10, 100);
    buyDecorById(g.world, 'nope');
    buyDecorById(g.world, 'golden_tankard');
    buyDecorById(g.world, 'wall_torch');
    expect(g.state.decorBought).toEqual([]);
    expect(g.state.currencies.gold.toNumber()).toBe(100);
  });

  it('announces when a decoration becomes buyable', () => {
    const store = createStore(state(10, 0));
    const bus = createEventBus<GameEvents>();
    const heard = vi.fn();
    bus.on('decor:affordable', heard);
    watchDecorShop(store, bus, DECORATIONS);
    store.update((s) => void (s.currencies.gold = num(decor('wall_torch').buy.cost)));
    expect(heard).toHaveBeenCalledTimes(1);
  });
});

describe('decoration bonuses', () => {
  it('counts each bought decoration once on the stats upgrades use', () => {
    const before = getMultipliers({ upgrades: {} });
    const after = getMultipliers({ upgrades: {}, decorBought: ['wall_torch', 'woven_rug', 'royal_carpet'] });
    expect(after.sellPrice.toNumber()).toBeCloseTo(before.sellPrice.toNumber() * 1.03);
    expect(after.brewSpeed.toNumber()).toBeCloseTo(before.brewSpeed.toNumber() * 1.05);
    expect(after.vipChance.toNumber()).toBeCloseTo(before.vipChance.toNumber() * 1.25);
  });

  it('keeps every bonus small: a gold sink, not a power spike', () => {
    for (const def of DECORATIONS) for (const effect of def.effects) expect(effect.perLevel).toBeLessThanOrEqual(0.25);
  });
});

describe('a decoration in the shop', () => {
  it('shows its bonus, the level it unlocks at, and then its price', () => {
    const torch = decor('wall_torch');
    expect(toDecorRowView(torch, state(0, 0))).toMatchObject({ name: 'Wall Torch', level: 'Unlocks at Local Haunt', canBuy: false });
    expect(toDecorRowView(torch, state(0, 0)).description).toMatch(/^Drinks sell \+3% higher\./);
    expect(toDecorRowView(torch, state(10, torch.buy.cost))).toMatchObject({ level: '', canBuy: true, buyLabel: expect.stringMatching(/^Buy · /) });
  });
});
