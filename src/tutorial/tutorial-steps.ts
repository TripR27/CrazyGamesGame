import type { GameEvents } from '@/shared/events';

export type TutorialEvent = keyof GameEvents;

export interface EventTrigger {
  kind: 'event';
  event: TutorialEvent;
}

/** `after` counts game time from the moment the step became visible. */
export type Trigger = EventTrigger | { kind: 'after'; ms: number };

/**
 * One tutorial step. The speech text is the i18n key `tutorial.<id>.text`.
 * `target` is a registry id or one of the guide aliases (see targets.ts).
 */
export interface TutorialStep {
  id: string;
  /** Steps of one lesson belong together; a lesson that cannot be resumed mid-way restarts. */
  lesson: string;
  /** The step stays hidden until this happens. Omitted: it shows as soon as the previous step is done. */
  startWhen?: EventTrigger;
  target: string;
  completeOn: Trigger;
  /** The step relies on things that are not saved (cauldron, bar); after a reload the lesson restarts. */
  needsLiveState?: boolean;
  /**
   * The completing event is only a way to get somewhere (opening a panel tab), not a real action: it counts only
   * while this step is on screen and never finishes it ahead of time. Already there when the step shows: done at once.
   */
  onlyWhenShown?: boolean;
}

/** Aliases the guide resolves to a concrete target while playing (see systems/tutorial/guide.ts). */
export const GUIDE_TARGETS = [
  'guide-ingredient', 'guide-drink', 'guide-customer', 'guide-shop', 'guide-book',
  'guide-upgrade', 'guide-staff', 'guide-seats', 'guide-liked', 'guide-vip', 'guide-ingredient-buy', 'guide-new-ingredient',
  'guide-room-buy', 'guide-new-room',
] as const;

/** Targets registered by the scene and the HUD under a fixed id. */
export const FIXED_TARGETS = ['cauldron', 'hud-gold', 'panel-button', 'book-panel'] as const;

export const KNOWN_TARGETS: readonly string[] = [...GUIDE_TARGETS, ...FIXED_TARGETS];

/** The first lesson: ingredient, cauldron, wait, pick the drink up, hand it over, first gold. */
export const basicsLesson: readonly TutorialStep[] = [
  {
    id: 'basics_add',
    lesson: 'basics',
    startWhen: { kind: 'event', event: 'customer:arrived' },
    target: 'guide-ingredient',
    completeOn: { kind: 'event', event: 'ingredient:clicked' },
  },
  {
    id: 'basics_finish',
    lesson: 'basics',
    target: 'guide-ingredient',
    completeOn: { kind: 'event', event: 'brew:started' },
  },
  {
    id: 'basics_wait',
    lesson: 'basics',
    target: 'cauldron',
    completeOn: { kind: 'event', event: 'brew:done' },
    needsLiveState: true,
  },
  {
    id: 'basics_pick',
    lesson: 'basics',
    target: 'guide-drink',
    completeOn: { kind: 'event', event: 'drink:picked' },
    needsLiveState: true,
  },
  {
    id: 'basics_serve',
    lesson: 'basics',
    target: 'guide-customer',
    completeOn: { kind: 'event', event: 'customer:served' },
    needsLiveState: true,
  },
  {
    id: 'basics_gold',
    lesson: 'basics',
    target: 'hud-gold',
    completeOn: { kind: 'after', ms: 4500 },
  },
];

/** The hint for customer preferences: starts at the first order of a liked drink (♥), done once one is served. */
export const likesLesson: readonly TutorialStep[] = [
  {
    id: 'likes_spot',
    lesson: 'likes',
    startWhen: { kind: 'event', event: 'likes:ordered' },
    target: 'guide-liked',
    completeOn: { kind: 'event', event: 'likes:served' },
    // A liked drink served during the basics must not skip this lesson: it shows at the next liked order.
    onlyWhenShown: true,
  },
  {
    id: 'likes_done',
    lesson: 'likes',
    target: 'hud-gold',
    completeOn: { kind: 'after', ms: 6000 },
  },
];

/** The hint for the first upgrade: starts when the player can pay for one, then unfold the panel on the shop tab, buy, done. */
export const upgradeLesson: readonly TutorialStep[] = [
  {
    id: 'upgrade_open',
    lesson: 'upgrade',
    startWhen: { kind: 'event', event: 'upgrade:affordable' },
    target: 'guide-shop',
    completeOn: { kind: 'event', event: 'shop:opened' },
    onlyWhenShown: true,
  },
  {
    id: 'upgrade_buy',
    lesson: 'upgrade',
    target: 'guide-upgrade',
    completeOn: { kind: 'event', event: 'upgrade:bought' },
  },
  {
    id: 'upgrade_done',
    lesson: 'upgrade',
    target: 'hud-gold',
    completeOn: { kind: 'after', ms: 4500 },
  },
];

/** The hint for the first extra seat: you start with one seat, so more customers need a purchase. */
export const seatsLesson: readonly TutorialStep[] = [
  {
    id: 'seats_buy',
    lesson: 'seats',
    startWhen: { kind: 'event', event: 'seats:affordable' },
    target: 'guide-seats',
    completeOn: { kind: 'event', event: 'seats:bought' },
  },
  {
    id: 'seats_done',
    lesson: 'seats',
    target: 'hud-gold',
    completeOn: { kind: 'after', ms: 4500 },
  },
];

/** The hint for the recipe book: once the first recipes can be discovered (level 2), open the book tab and read. */
export const bookLesson: readonly TutorialStep[] = [
  {
    id: 'book_open',
    lesson: 'book',
    startWhen: { kind: 'event', event: 'reputation:levelUp' },
    target: 'guide-book',
    completeOn: { kind: 'event', event: 'book:opened' },
    onlyWhenShown: true,
  },
  {
    id: 'book_read',
    lesson: 'book',
    target: 'book-panel',
    completeOn: { kind: 'after', ms: 7000 },
  },
];

/** The hint for the first ingredient from the shop: starts once one can be bought, then points at it on the shelf. */
export const ingredientLesson: readonly TutorialStep[] = [
  {
    id: 'ingredient_buy',
    lesson: 'ingredient',
    startWhen: { kind: 'event', event: 'ingredients:affordable' },
    target: 'guide-ingredient-buy',
    completeOn: { kind: 'event', event: 'ingredient:bought' },
  },
  {
    id: 'ingredient_done',
    lesson: 'ingredient',
    target: 'guide-new-ingredient',
    completeOn: { kind: 'after', ms: 5500 },
  },
];

/** The hint for the first staff member: starts when the player can pay for one, then done. */
export const staffLesson: readonly TutorialStep[] = [
  {
    id: 'staff_hire',
    lesson: 'staff',
    startWhen: { kind: 'event', event: 'staff:affordable' },
    target: 'guide-staff',
    completeOn: { kind: 'event', event: 'staff:hired' },
  },
  {
    id: 'staff_done',
    lesson: 'staff',
    target: 'hud-gold',
    completeOn: { kind: 'after', ms: 4500 },
  },
];

/** The hint for the first VIP: points at them until they get their (expensive) drink. */
export const vipLesson: readonly TutorialStep[] = [
  {
    id: 'vip_spot',
    lesson: 'vip',
    startWhen: { kind: 'event', event: 'vip:arrived' },
    target: 'guide-vip',
    completeOn: { kind: 'event', event: 'vip:served' },
  },
  {
    id: 'vip_done',
    lesson: 'vip',
    target: 'hud-gold',
    completeOn: { kind: 'after', ms: 4500 },
  },
];

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

/** All tutorial steps in order. A new lesson is a new file plus one spread here. */
export const TUTORIAL_STEPS: readonly TutorialStep[] = [
  ...basicsLesson,
  ...likesLesson,
  ...upgradeLesson,
  ...seatsLesson,
  ...bookLesson,
  ...ingredientLesson,
  ...staffLesson,
  ...vipLesson,
  ...roomLesson,
];
