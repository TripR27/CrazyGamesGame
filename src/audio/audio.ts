import type { World } from '@/app/world';
import type { GameEvents } from '@/shared/events';
import type { GameState } from '@/shared/state';

/**
 * A placeholder sound, made by the browser (no file): a few short notes of one wave shape. Real sound files replace
 * these in the art pass (step 21); the ids stay. `gain` is the loudness at full volume.
 */
export interface SoundDef {
  wave: 'sine' | 'square' | 'triangle' | 'sawtooth';
  /** The notes in Hz, one after the other. */
  notes: readonly number[];
  noteMs: number;
  gain: number;
}

/** Placeholder sounds. A new sound is one more entry. */
export const SOUNDS = {
  plop: { wave: 'sine', notes: [520], noteMs: 60, gain: 0.2 },
  bubble: { wave: 'sine', notes: [300, 420], noteMs: 70, gain: 0.2 },
  coin: { wave: 'triangle', notes: [988, 1319], noteMs: 70, gain: 0.18 },
  buzz: { wave: 'sawtooth', notes: [140], noteMs: 160, gain: 0.08 },
  buy: { wave: 'square', notes: [660, 880], noteMs: 60, gain: 0.08 },
  eureka: { wave: 'triangle', notes: [523, 659, 784, 1047], noteMs: 90, gain: 0.2 },
  fanfare: { wave: 'square', notes: [523, 659, 784, 659, 1047], noteMs: 110, gain: 0.08 },
  horn: { wave: 'sawtooth', notes: [392, 523], noteMs: 140, gain: 0.07 },
  hit: { wave: 'square', notes: [180, 120], noteMs: 60, gain: 0.12 },
  miss: { wave: 'sine', notes: [300, 200], noteMs: 80, gain: 0.12 },
} as const satisfies Record<string, SoundDef>;

export type SoundId = keyof typeof SOUNDS;

/** Which game event plays which sound; a function picks one from the event (a hit or a miss). New sound hook = one entry. */
export const SOUND_EVENTS: { readonly [E in keyof GameEvents]?: SoundId | ((payload: GameEvents[E]) => SoundId | null) } = {
  'ingredient:clicked': 'plop',
  'brew:done': 'bubble',
  'customer:served': 'coin',
  'customer:refused': 'buzz',
  'upgrade:bought': 'buy',
  'ingredient:bought': 'buy',
  'room:built': 'buy',
  'decor:bought': 'buy',
  'gear:bought': 'buy',
  'recipe:discovered': 'eureka',
  'reputation:levelUp': 'fanfare',
  'achievement:unlocked': 'fanfare',
  'prestige:done': 'fanfare',
  'daily:claimed': 'coin',
  'hero:returned': 'horn',
  'boss:struck': ({ hit }) => (hit ? 'hit' : 'miss'),
};

/**
 * The music: a file the owner delivers later (put it in `public/audio/` and its path here). Until then there is no music;
 * the hook in the view plays it on a loop at the music share of the volume.
 */
export const MUSIC = { src: null as string | null, share: 0.5 };

/** How loud sounds play now (0 to 1): the volume, nothing when muted here or by the platform (which comes first, step 20). */
export function effectiveVolume(settings: GameState['settings'], platformMuted = false): number {
  return platformMuted || settings.muted ? 0 : Math.min(1, Math.max(0, settings.volume));
}

/** Sound on or off (the speaker button). */
export function toggleMute({ store, bus }: Pick<World, 'store' | 'bus'>): void {
  store.update((s) => void (s.settings.muted = !s.settings.muted));
  bus.emit('saveRequested', {});
}
