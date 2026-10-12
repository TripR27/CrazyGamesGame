import { describe, expect, it } from 'vitest';
import { newGame } from './flows/helpers';
import { effectiveVolume, MUSIC, SOUND_EVENTS, SOUNDS, toggleMute } from '@/audio/audio';
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
      if (typeof sound === 'string') expect(sound in SOUNDS).toBe(true);
    }
    const strike = SOUND_EVENTS['boss:struck'];
    expect(typeof strike === 'function' ? strike({ heroId: 'warrior', hit: true }) : null).toBe('hit');
    expect(typeof strike === 'function' ? strike({ heroId: 'warrior', hit: false }) : null).toBe('miss');
  });

  it('has quiet, short placeholder sounds, and no music until a file is delivered', () => {
    for (const sound of Object.values(SOUNDS)) {
      expect(sound.notes.length).toBeGreaterThan(0);
      expect(sound.gain).toBeLessThanOrEqual(0.3);
      expect(sound.notes.length * sound.noteMs).toBeLessThanOrEqual(600);
    }
    expect(MUSIC.src).toBeNull();
  });
});
