import { effectiveVolume, MUSIC, SOUND_EVENTS, SOUNDS, type SoundDef, type SoundId, toggleMute } from '@/audio/audio';
import type { World } from '@/app/world';
import { createEl, domBounds } from '@/app/panels-view';
import type { EventBus, GameEvents } from '@/shared/events';
import './audio.css';

/** The same sound never starts twice within this time (a busy staff would otherwise rattle). */
const MIN_GAP_MS = 60;

/** Plays one placeholder sound: its notes one after the other, with a short fade so nothing clicks. */
function playSynth(ctx: AudioContext, sound: SoundDef, volume: number): void {
  const start = ctx.currentTime;
  const step = sound.noteMs / 1000;
  sound.notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = sound.wave;
    osc.frequency.value = freq;
    const at = start + i * step;
    gain.gain.setValueAtTime(sound.gain * volume, at);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + step);
    osc.connect(gain).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + step);
  });
}

/** Connects every sound hook in `SOUND_EVENTS` to the bus; `play` gets the sound id. */
function hookSounds(bus: EventBus<GameEvents>, play: (id: SoundId) => void): (() => void)[] {
  return Object.entries(SOUND_EVENTS).map(([event, sound]) =>
    bus.on(event as keyof GameEvents, (payload: unknown) => {
      const id = typeof sound === 'function' ? (sound as (p: unknown) => SoundId | null)(payload) : sound;
      if (id !== null && id !== undefined) play(id);
    }),
  );
}

/**
 * Sound: placeholder sounds on game events, music once a file is delivered (`MUSIC`), and a speaker button that turns it
 * all off. Browsers only allow sound after the player clicked, so nothing is made before the first click. The volume
 * and mute come from the settings (`effectiveVolume`). The button is the tutorial target `mute-button`.
 */
export function mountAudio(root: HTMLElement, world: World): () => void {
  const { store, bus, targets } = world;
  let ctx: AudioContext | null = null;
  const lastPlayed = new Map<SoundId, number>();
  const music = MUSIC.src === null ? null : Object.assign(new Audio(MUSIC.src), { loop: true });
  const volume = (): number => effectiveVolume(store.getState().settings);

  const unlock = (): void => {
    ctx ??= new AudioContext();
    void music?.play().catch(() => undefined);
  };
  window.addEventListener('pointerdown', unlock, { once: true });

  const play = (id: SoundId): void => {
    const v = volume();
    const now = performance.now();
    if (ctx === null || v <= 0 || now - (lastPlayed.get(id) ?? -Infinity) < MIN_GAP_MS) return;
    lastPlayed.set(id, now);
    playSynth(ctx, SOUNDS[id], v);
  };
  const stops = hookSounds(bus, play);

  const button = createEl('button', 'side-button mute-button');
  const render = (): void => {
    const muted = store.getState().settings.muted;
    button.textContent = muted ? '🔇' : '🔊';
    if (music !== null) music.volume = volume() * MUSIC.share;
  };
  button.addEventListener('click', () => toggleMute(world));
  root.append(button);
  render();
  const unsubscribe = store.subscribe(render);
  const stopTarget = targets.register('mute-button', () => domBounds(button, root));
  return () => {
    stops.forEach((stop) => stop());
    unsubscribe();
    stopTarget();
    window.removeEventListener('pointerdown', unlock);
    music?.pause();
    void ctx?.close();
    button.remove();
  };
}
