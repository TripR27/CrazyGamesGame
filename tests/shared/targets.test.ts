import { describe, expect, it } from 'vitest';
import { createTargetRegistry } from '@/shared/targets';

describe('target registry', () => {
  it('returns the current bounds of a registered target', () => {
    const registry = createTargetRegistry();
    registry.register('cauldron', () => ({ x: 1, y: 2, w: 3, h: 4 }));
    expect(registry.resolve('cauldron')).toEqual({ x: 1, y: 2, w: 3, h: 4 });
  });

  it('follows a target that moves, because bounds are read on every call', () => {
    const registry = createTargetRegistry();
    const box = { x: 0, y: 0, w: 10, h: 10 };
    registry.register('customer:1', () => box);
    box.x = 50;
    expect(registry.resolve('customer:1')?.x).toBe(50);
  });

  it('knows nothing about unknown ids and hidden targets', () => {
    const registry = createTargetRegistry();
    registry.register('hidden', () => null);
    expect(registry.resolve('nope')).toBeNull();
    expect(registry.resolve('hidden')).toBeNull();
  });

  it('forgets a target when it unregisters, but not when a newer one took its id', () => {
    const registry = createTargetRegistry();
    const remove = registry.register('a', () => ({ x: 1, y: 1, w: 1, h: 1 }));
    remove();
    expect(registry.resolve('a')).toBeNull();

    const removeOld = registry.register('b', () => ({ x: 1, y: 1, w: 1, h: 1 }));
    registry.register('b', () => ({ x: 2, y: 2, w: 2, h: 2 }));
    removeOld();
    expect(registry.resolve('b')?.x).toBe(2);
  });
});
