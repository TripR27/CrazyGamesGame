import type { Messages } from '@/i18n/translator';

/**
 * Drink effects as the player sees them. Every effect has an icon (emoji placeholders until the art pass), a book
 * line, a word and an explanation for the mascot, and the line that floats up after serving (`{n}`: tip or reputation).
 */
export const effects: Messages = {
  'effects.order': '{icon} {drink}',
  'effects.liked_order': '♥{icon} {drink}',
  'effects.with_icon': '{icon} {text}',
  'effects.liked_float': '{line} ♥x2',
  'effects.reputation': '+{n} reputation',
  'effects.strength.icon': '💪',
  'effects.strength.name': 'Strength: pays more',
  'effects.strength.short': 'strength',
  'effects.strength.does': 'they pay more',
  'effects.strength.served': 'Big spender!',
  'effects.speed.icon': '⚡',
  'effects.speed.name': 'Speed: drinks faster',
  'effects.speed.short': 'speed',
  'effects.speed.does': 'they drink faster and free the seat sooner',
  'effects.speed.served': 'Quick drinker!',
  'effects.luck.icon': '🍀',
  'effects.luck.name': 'Luck: may tip',
  'effects.luck.short': 'luck',
  'effects.luck.does': 'they may leave a tip',
  'effects.luck.served': '+{n} tip!',
  'effects.luck.missed': 'No tip this time',
  'effects.charm.icon': '💖',
  'effects.charm.name': 'Charm: more reputation',
  'effects.charm.short': 'charm',
  'effects.charm.does': 'they bring extra reputation',
  'effects.charm.served': '+{n} reputation',
};
