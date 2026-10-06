import type { Messages } from '@/i18n/translator';

/** The rooms on the upper floor, their signs while boarded up, and the shop group. `{seats}` is filled in from data. */
export const rooms: Messages = {
  'rooms.extension.name': 'Extension',
  'rooms.extension.description': '+{seats} seats upstairs, around one long table. More guests, more noise, more gold.',
  'rooms.alchemy_lab.name': 'Alchemy Lab',
  'rooms.alchemy_lab.description': 'The cauldron brews {brewSpeed} faster and the bar holds {storage} drink. Mind the purple smoke.',
  'rooms.vip_lounge.name': 'VIP Lounge',
  'rooms.vip_lounge.description': '{vipChance} VIPs, and +{seats} seats on a velvet sofa. Royalty loves velvet.',
  'rooms.sign_locked': '{name}\nUnlocks at {level}',
  'rooms.sign_for_sale': '{name}\nBuild in the shop: {cost}',
};
