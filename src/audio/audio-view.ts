import { audioUrl, effectiveVolume, MUSIC, SOUND_EVENTS, SOUND_IDS, type SoundId, toggleMute } from '@/audio/audio';
import type { World } from '@/app/world';
import { createEl, domBounds } from '@/app/panels-view';
import { debug, type EventBus, type GameEvents } from '@/shared/events';
import './audio.css';

/** The same sound never starts twice within this time (a busy staff would otherwise rattle). */
const MIN_GAP_MS = 60;
/** The music volume follows the volume, mute and ads at this rate. */
const SYNC_MS = 300;

/** Connects every sound hook in `SOUND_EVENTS` to the bus; `play` gets the sound id. */
function hookSounds(bus: EventBus<GameEvents>, play: (id: SoundId) => void): (() => void)[] {
  return Object.entries(SOUND_EVENTS).map(([event, sound]) =>
    bus.on(event as keyof GameEvents, (payload: unknown) => {
      const id = typeof sound === 'function' ? (sound as (p: unknown) => SoundId | null)(payload) : sound;
      if (id !== null && id !== undefined) play(id);
    }),
  );
}

/** Fetches and decodes one sound file; null when it cannot be loaded (the game then stays quiet for that sound). */
async function load(ctx: AudioContext, name: string): Promise<AudioBuffer | null> {
  try {
    const response = await fetch(audioUrl(name));
    return await ctx.decodeAudioData(await response.arrayBuffer());
  } catch (error) {
    debug('sound not loaded', name, error);
    return null;
  }
}

/** Starts the music loop (a gapless loop of a decoded buffer) and returns its volume control; null when it did not load. */
async function startMusic(ctx: AudioContext, volume: number): Promise<GainNode | null> {
  const buffer = await load(ctx, MUSIC.id);
  if (buffer === null) return null;
  const source = Object.assign(ctx.createBufferSource(), { buffer, loop: true });
  const gain = ctx.createGain();
  gain.gain.value = volume * MUSIC.share;
  source.connect(gain).connect(ctx.destination);
  source.start();
  return gain;
}

/**
 * Sound: the effects on game events and the music loop (files in `public/audio/`), and a speaker button that turns it
 * all off. Browsers only allow sound after the player clicked, so nothing is loaded or played before the first click.
 * The volume and mute come from the settings and the platform (`silenced`: CrazyGames muted the game, or an ad plays).
 * The music is a gapless loop of a decoded buffer. The button is the tutorial target `mute-button`.
 */
export function mountAudio(root: HTMLElement, world: World, silenced: () => boolean): () => void {
  const { store, bus, targets } = world;
  let ctx: AudioContext | null = null;
  const sounds = new Map<SoundId, AudioBuffer>();
  const lastPlayed = new Map<SoundId, number>();
  let musicGain: GainNode | null = null;
  const volume = (): number => effectiveVolume(store.getState().settings, silenced());

  const unlock = (): void => {
    const audio = (ctx ??= new AudioContext());
    for (const id of SOUND_IDS) void load(audio, id).then((buffer) => buffer !== null && sounds.set(id, buffer));
    void startMusic(audio, volume()).then((gain) => void (musicGain = gain));
  };
  window.addEventListener('pointerdown', unlock, { once: true });

  const play = (id: SoundId): void => {
    const v = volume();
    const buffer = sounds.get(id);
    const now = performance.now();
    if (ctx === null || buffer === undefined || v <= 0 || now - (lastPlayed.get(id) ?? -Infinity) < MIN_GAP_MS) return;
    lastPlayed.set(id, now);
    const gain = ctx.createGain();
    gain.gain.value = v;
    const source = Object.assign(ctx.createBufferSource(), { buffer });
    source.connect(gain).connect(ctx.destination);
    source.start();
  };
  const stops = hookSounds(bus, play);

  const button = createEl('button', 'side-button mute-button');
  const render = (): void => {
    button.textContent = store.getState().settings.muted ? '🔇' : '🔊';
  };
  const syncMusic = (): void => {
    if (musicGain !== null) musicGain.gain.value = volume() * MUSIC.share;
  };
  button.addEventListener('click', () => toggleMute(world));
  root.append(button);
  render();
  const unsubscribe = store.subscribe(() => {
    render();
    syncMusic();
  });
  const timer = window.setInterval(syncMusic, SYNC_MS);
  const stopTarget = targets.register('mute-button', () => domBounds(button, root));
  return () => {
    stops.forEach((stop) => stop());
    unsubscribe();
    window.clearInterval(timer);
    stopTarget();
    window.removeEventListener('pointerdown', unlock);
    void ctx?.close();
    button.remove();
  };
}
