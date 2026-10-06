import { describe, expect, it } from 'vitest';
import { num } from '@/core/numbers';
import { toHudView } from '@/ui/hud-view';

describe('toHudView', () => {
  it('shows a fresh game as zeros', () => {
    expect(toHudView({ currencies: { gold: num(0) }, reputation: 0 })).toEqual({
      gold: '0',
      reputation: '0',
    });
  });

  it('formats gold with idle-game suffixes', () => {
    expect(toHudView({ currencies: { gold: num(1500) }, reputation: 3 }).gold).toBe('1.5K');
    expect(toHudView({ currencies: { gold: num('2.5e9') }, reputation: 3 }).gold).toBe('2.5B');
  });

  it('rounds reputation down to a whole number', () => {
    expect(toHudView({ currencies: { gold: num(0) }, reputation: 7.9 }).reputation).toBe('7');
  });
});
