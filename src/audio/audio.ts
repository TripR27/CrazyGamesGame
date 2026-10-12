import type { World } from '@/app/world';
import type { GameEvents } from '@/shared/events';
import type { GameState } from '@/shared/state';

/** The sound effects: every id is a file `public/audio/<id>.ogg` (made with code, see docs/ASSETS.md). */
export const SOUND_IDS = ['plop', 'bubble', 'coin', 'buzz', 'buy', 'eureka', 'fanfare', 'horn', 'hit', 'miss'] as const;
export type SoundId = (typeof SOUND_IDS)[number];

/** Relative paths (CrazyGames wants them; the build uses `base: './'`). */
export const audioUrl = (name: string): string => `${import.meta.env.BASE_URL}audio/${name}.ogg`;

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

/** The music: one loop, played at the music share of the volume. */
export const MUSIC = { id: 'music_tavern', share: 0.5 } as const;

/** How loud sounds play now (0 to 1): the volume, nothing when muted here or by the platform (which comes first, step 20). */
export function effectiveVolume(settings: GameState['settings'], platformMuted = false): number {
  return platformMuted || settings.muted ? 0 : Math.min(1, Math.max(0, settings.volume));
}

/** Sound on or off (the speaker button). */
export function toggleMute({ store, bus }: Pick<World, 'store' | 'bus'>): void {
  store.update((s) => void (s.settings.muted = !s.settings.muted));
  bus.emit('saveRequested', {});
}
