import type { World } from '@/app/world';
import { heroStatus } from '@/heroes/heroes';

/**
 * Click a hero in the guild hall. With a drink picked up from the bar, an injured hero drinks it and is fit at once;
 * with nothing picked up, the side panel opens on the Heroes tab.
 */
export function clickHero(world: Pick<World, 'store' | 'bus' | 'clock' | 'station' | 'selection'>, heroId: string): void {
  const { store, bus, clock, station, selection } = world;
  const hero = store.getState().heroes[heroId];
  if (hero === undefined) return;
  const picked = selection.selected();
  if (picked === null) {
    bus.emit('heroes:requested', {});
    return;
  }
  if (heroStatus(hero, clock.now()) !== 'injured') return;
  station.ready.splice(station.ready.indexOf(picked), 1);
  selection.clear();
  store.update((s) => {
    const h = s.heroes[heroId];
    if (h !== undefined) h.injuredUntil = 0;
  });
  bus.emit('hero:healed', { id: heroId, recipeId: picked });
  bus.emit('saveRequested', {});
}
