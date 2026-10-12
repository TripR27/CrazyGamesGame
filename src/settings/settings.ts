import type { World } from '@/app/world';
import { createInitialState, type GameState } from '@/shared/state';

/** The languages the game can show; a new language is one more id here and its i18n file (later: nl). */
export const LANGUAGES = ['en'] as const;

/** Set the volume (0 to 1; anything outside is clamped). Audio (step 19) reads it. */
export function setVolume({ store, bus }: Pick<World, 'store' | 'bus'>, volume: number): void {
  const clamped = Math.min(1, Math.max(0, Number.isFinite(volume) ? volume : 0));
  store.update((s) => void (s.settings.volume = clamped));
  bus.emit('saveRequested', {});
}

/** Pick a language; an id the game does not have is ignored. */
export function setLanguage({ store, bus }: Pick<World, 'store' | 'bus'>, language: string): void {
  if (!(LANGUAGES as readonly string[]).includes(language)) return;
  store.update((s) => void (s.settings.language = language));
  bus.emit('saveRequested', {});
}

/**
 * Put a whole other game in place of this one (an imported save, or a fresh start) and save it. Everything at runtime
 * belongs to the old game, so the page reloads after `game:replaced`.
 */
function replaceGame({ store, bus }: Pick<World, 'store' | 'bus'>, next: GameState): void {
  store.update((s) => void Object.assign(s, next));
  bus.emit('saveRequested', {});
  bus.emit('game:replaced', {});
}

/** Start over completely: a new game (only the settings stay). */
export function resetGame(world: Pick<World, 'store' | 'bus' | 'clock'>): void {
  const fresh = createInitialState(world.clock.now());
  fresh.settings = { ...world.store.getState().settings };
  replaceGame(world, fresh);
}

/** Load a save the player pasted (already read and checked by the save manager). */
export function importGame(world: Pick<World, 'store' | 'bus'>, imported: GameState): void {
  replaceGame(world, imported);
}
