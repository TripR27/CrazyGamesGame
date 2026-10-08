import type { TutorialStep } from '@/tutorial/tutorial-steps';

/** Lessons for what opens later in a run: rooms, decorations, heroes and their loot. The order is in TUTORIAL_STEPS. */

/** The hint for the first room: starts once one can be built, then points at it on the upper floor. */
export const roomLesson: readonly TutorialStep[] = [
  {
    id: 'room_buy',
    lesson: 'room',
    startWhen: { kind: 'event', event: 'rooms:affordable' },
    target: 'guide-room-buy',
    completeOn: { kind: 'event', event: 'room:built' },
  },
  {
    id: 'room_done',
    lesson: 'room',
    target: 'guide-new-room',
    completeOn: { kind: 'after', ms: 5500 },
  },
];

/**
 * The hint for the first decoration: starts once one can be bought, then points at it in the tavern. Decorations are
 * for sale long before this lesson's turn, so buying one early only counts while the hint is on screen (it must not
 * skip the lessons before it); a player who already owns one gets just the closing line.
 */
export const decorLesson: readonly TutorialStep[] = [
  {
    id: 'decor_buy',
    lesson: 'decor',
    startWhen: { kind: 'event', event: 'decor:affordable' },
    target: 'guide-decor-buy',
    completeOn: { kind: 'event', event: 'decor:bought' },
    onlyWhenShown: true,
  },
  {
    id: 'decor_done',
    lesson: 'decor',
    target: 'guide-new-decor',
    completeOn: { kind: 'after', ms: 5500 },
  },
];

/**
 * The hint for the first hero: starts when the warrior moves into the guild hall, points the way to the Heroes tab
 * and the send button, then at the guild hall. Sending only counts while the hint is on screen, so a trip made while
 * an earlier lesson waits never skips that lesson; a player whose heroes travelled already gets just the closing line.
 */
export const heroLesson: readonly TutorialStep[] = [
  {
    id: 'hero_send',
    lesson: 'hero',
    startWhen: { kind: 'event', event: 'hero:recruited' },
    target: 'guide-hero-send',
    completeOn: { kind: 'event', event: 'hero:departed' },
    onlyWhenShown: true,
  },
  {
    id: 'hero_done',
    lesson: 'hero',
    target: 'room:guild_hall',
    completeOn: { kind: 'after', ms: 6500 },
  },
];

/**
 * The hint for the first loot: when a hero first brings dungeon ingredients home, points at one on the shelf. It
 * explains the count (every drink with it uses one) and sends the player to the recipe book for what to make.
 */
export const lootLesson: readonly TutorialStep[] = [
  {
    id: 'loot_shelf',
    lesson: 'loot',
    startWhen: { kind: 'event', event: 'hero:returned' },
    target: 'guide-loot',
    completeOn: { kind: 'after', ms: 8000 },
  },
];
