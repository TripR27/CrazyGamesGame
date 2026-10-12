import { existsSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { newGame } from './flows/helpers';
import { audioUrl, effectiveVolume, MUSIC, SOUND_EVENTS, SOUND_IDS, toggleMute } from '@/audio/audio';
import { createInitialState } from '@/shared/state';

describe('sound', () => {
  it('plays at the volume, and not at all when muted here or by the platform', () => {
    const settings = { volume: 0.6, muted: false, language: 'en' };
    expect(effectiveVolume(settings)).toBe(0.6);
    expect(effectiveVolume({ ...settings, muted: true })).toBe(0);
    expect(effectiveVolume(settings, true)).toBe(0);
    expect(effectiveVolume({ ...settings, volume: 3 })).toBe(1);
  });

  it('turns on and off with the speaker button', () => {
    const g = newGame(createInitialState(0));
    toggleMute(g.world);
    expect(g.world.store.getState().settings.muted).toBe(true);
    toggleMute(g.world);
    expect(g.world.store.getState().settings.muted).toBe(false);
    expect(g.saves).toHaveBeenCalledTimes(2);
  });

  it('hooks only sounds that exist, and a boss strike sounds like a hit or a miss', () => {
    for (const sound of Object.values(SOUND_EVENTS)) {
      if (typeof sound === 'string') expect((SOUND_IDS as readonly string[]).includes(sound)).toBe(true);
    }
    const strike = SOUND_EVENTS['boss:struck'];
    expect(typeof strike === 'function' ? strike({ heroId: 'warrior', hit: true }) : null).toBe('hit');
    expect(typeof strike === 'function' ? strike({ heroId: 'warrior', hit: false }) : null).toBe('miss');
  });

  it('has a file for every sound and the music, within the size budget, with relative paths', () => {
    expect(audioUrl('coin')).toBe('/audio/coin.ogg'.replace(/^\//, import.meta.env.BASE_URL));
    const bytes = (name: string): number => statSync(`public/audio/${name}.ogg`).size;
    for (const id of [...SOUND_IDS, MUSIC.id]) expect(existsSync(`public/audio/${id}.ogg`), id).toBe(true);
    expect(SOUND_IDS.reduce((sum, id) => sum + bytes(id), 0)).toBeLessThan(400 * 1024);
    expect(bytes(MUSIC.id)).toBeLessThan(2 * 1024 * 1024);
  });
});
