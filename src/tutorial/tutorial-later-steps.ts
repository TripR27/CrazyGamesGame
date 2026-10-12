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
 * The hint for the first gear: once a piece can be bought (the guild hall stands), the way to the Heroes tab and its buy
 * button, then the gear list of a hero at home. Gear is for sale before this lesson's turn, so both steps only count
 * while on screen; a player who already bought or wears gear gets the remaining steps done at once.
 */
export const gearLesson: readonly TutorialStep[] = [
  {
    id: 'gear_buy',
    lesson: 'gear',
    startWhen: { kind: 'event', event: 'gear:affordable' },
    target: 'guide-gear-buy',
    completeOn: { kind: 'event', event: 'gear:bought' },
    onlyWhenShown: true,
  },
  {
    id: 'gear_equip',
    lesson: 'gear',
    target: 'guide-gear-equip',
    completeOn: { kind: 'event', event: 'gear:equipped' },
    onlyWhenShown: true,
  },
];

/**
 * The hint for the first hero drink: click the hero cauldron in the guild hall, then brew; the drink goes into a bag.
 * Handing a hero a drink from the bar earlier must not skip lessons, so the second step only counts while on screen.
 */
export const heroBrewLesson: readonly TutorialStep[] = [
  {
    id: 'hero_brew_aim',
    lesson: 'hero_brew',
    startWhen: { kind: 'event', event: 'hero:recruited' },
    target: 'hero-cauldron',
    completeOn: { kind: 'event', event: 'guild:aimed' },
    onlyWhenShown: true,
  },
  {
    id: 'hero_brew_fill',
    lesson: 'hero_brew',
    target: 'guide-hero-drink',
    completeOn: { kind: 'event', event: 'hero:drink' },
    onlyWhenShown: true,
  },
];

/** The hint for the first choice card: points at the bold option while the card is open, then a closing line. */
export const cardLesson: readonly TutorialStep[] = [
  {
    id: 'card_pick',
    lesson: 'card',
    startWhen: { kind: 'event', event: 'card:opened' },
    target: 'guide-card',
    completeOn: { kind: 'event', event: 'card:resolved' },
    onlyWhenShown: true,
  },
  {
    id: 'card_done',
    lesson: 'card',
    target: 'hud-gold',
    completeOn: { kind: 'after', ms: 6000 },
  },
];

/**
 * The hint for the first boss: points at the strike button while the fight is on, then a closing line. The fight ends
 * with `boss:resolved` also when the hero comes back first, so the hint never waits for nothing.
 */
export const bossLesson: readonly TutorialStep[] = [
  {
    id: 'boss_fight',
    lesson: 'boss',
    startWhen: { kind: 'event', event: 'boss:opened' },
    target: 'boss-strike',
    completeOn: { kind: 'event', event: 'boss:resolved' },
    onlyWhenShown: true,
  },
  {
    id: 'boss_done',
    lesson: 'boss',
    target: 'hud-gold',
    completeOn: { kind: 'after', ms: 6000 },
  },
];

/**
 * The hint for Auto: once the Quartermaster can be bought, the way to the Heroes tab and its buy button, then a hero's
 * Auto switch, then a closing line. Both actions can happen before this lesson's turn, so they only count while on screen;
 * a player who already did them gets the remaining steps done at once.
 */
export const autoLesson: readonly TutorialStep[] = [
  {
    id: 'auto_buy',
    lesson: 'auto',
    startWhen: { kind: 'event', event: 'quartermaster:affordable' },
    target: 'guide-quartermaster-buy',
    completeOn: { kind: 'event', event: 'quartermaster:bought' },
    onlyWhenShown: true,
  },
  {
    id: 'auto_on',
    lesson: 'auto',
    target: 'guide-hero-auto',
    completeOn: { kind: 'event', event: 'hero:auto' },
    onlyWhenShown: true,
  },
  {
    id: 'auto_done',
    lesson: 'auto',
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
