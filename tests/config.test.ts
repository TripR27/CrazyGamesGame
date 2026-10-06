import { describe, expect, it } from 'vitest';
import { GAME_HEIGHT, GAME_WIDTH } from '@/config';

describe('game config', () => {
  it('uses a 16:9 design resolution', () => {
    expect(GAME_WIDTH / GAME_HEIGHT).toBeCloseTo(16 / 9, 5);
  });
});
