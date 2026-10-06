import { describe, expect, it, vi } from 'vitest';
import { createEventBus } from '@/core/events';
import type { GameEvents } from '@/core/game-events';
import type { Rng } from '@/core/rng';
import { SERVING } from '@/data/brewing';
import type { Effect } from '@/data/common';
import type { CustomerDef } from '@/data/customers';
import { serveAndPublish, serveCustomer, type ServeDeps } from '@/systems/serving';
import { ab, economy, floorWith, station } from '../fixtures';

/** One customer of type `fan` (who likes `likes`) waits for a 10-gold drink with `effect`, which is ready. */
function setup(effect: Effect, likes: Effect[], rng: Rng = () => 0.5) {
  const drink = { ...ab, effect };
  const fan: CustomerDef = { id: 'fan', minLevel: 1, patienceSeconds: 60, spendMultiplier: 1, likes };
  const floor = floorWith(['fan', 'ab']);
  floor.customers[0]!.liked = likes.includes(effect);
  const s = station();
  s.ready.push('ab');
  const eco = economy();
  const deps: ServeDeps = { floor, station: s, economy: eco, catalog: { customerTypes: [fan], recipes: [drink] }, rng };
  return { deps, eco };
}

function serveOnce(effect: Effect, likes: Effect[], rng?: Rng) {
  const { deps, eco } = setup(effect, likes, rng);
  const outcome = serveCustomer(deps, 1);
  const gold = eco.getState().currencies.gold.toNumber();
  return { outcome, gold, reputation: eco.getState().reputation, drinkMs: deps.floor.customers[0]?.drinkMsLeft };
}

describe('serving with drink effects', () => {
  it('strength: the customer pays more, double when liked', () => {
    expect(serveOnce('strength', []).gold).toBe(13); // 10 x 1.25, rounded
    expect(serveOnce('strength', ['strength']).gold).toBe(15);
  });

  it('speed: the customer finishes the drink sooner, much sooner when liked', () => {
    expect(serveOnce('charm', []).drinkMs).toBe(SERVING.drinkMs);
    expect(serveOnce('speed', []).drinkMs).toBeCloseTo(SERVING.drinkMs * 0.6);
    expect(serveOnce('speed', ['speed']).drinkMs).toBeCloseTo(SERVING.drinkMs * 0.2);
  });

  it('luck: a tip by chance, more often when liked', () => {
    const tipped = serveOnce('luck', [], () => 0.1);
    expect(tipped.gold).toBe(15);
    expect(tipped.outcome.kind === 'served' && tipped.outcome.event.tip.toNumber()).toBe(5);
    expect(serveOnce('luck', [], () => 0.4).gold).toBe(10); // 25% chance missed
    expect(serveOnce('luck', ['luck'], () => 0.4).gold).toBe(15); // 50% chance hit
  });

  it('charm: extra reputation, double when liked', () => {
    expect(serveOnce('charm', []).reputation).toBe(SERVING.reputationPerServe + 1);
    const liked = serveOnce('charm', ['charm']);
    expect(liked.reputation).toBe(SERVING.reputationPerServe + 2);
    expect(liked.outcome).toMatchObject({ kind: 'served', event: { extraReputation: 2, liked: true } });
  });

  it('announces a liked drink, so the tutorial can follow it', () => {
    const bus = createEventBus<GameEvents>();
    const likedServed = vi.fn();
    bus.on('likes:served', likedServed);
    serveAndPublish({ ...setup('strength', []).deps, bus }, 1);
    expect(likedServed).not.toHaveBeenCalled();
    serveAndPublish({ ...setup('charm', ['charm']).deps, bus }, 1);
    expect(likedServed).toHaveBeenCalledWith({ id: 1 });
  });
});
