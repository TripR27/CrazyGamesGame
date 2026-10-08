import type { Messages } from '@/i18n/translator';

/** The rooms on the upper floor, their signs while boarded up, and the shop group. `{seats}` is filled in from data. */
export const rooms: Messages = {
  'rooms.extension.name': 'Extension',
  'rooms.extension.description': '+{seats} seats upstairs, around one long table. More guests, more noise, more gold.',
  'rooms.alchemy_lab.name': 'Alchemy Lab',
  'rooms.alchemy_lab.description': 'The cauldron brews {brewSpeed} faster and the bar holds {storage} drink. Mind the purple smoke.',
  'rooms.vip_lounge.name': 'VIP Lounge',
  'rooms.vip_lounge.description': '{vipChance} VIPs, and +{seats} seats on a velvet sofa. Royalty loves velvet.',
  'rooms.guild_hall.name': 'Guild Hall',
  'rooms.guild_hall.description': 'Heroes move in upstairs. A warrior comes along; send them to dungeons for rare ingredients.',
  'rooms.sign_locked': '{name}\nUnlocks at {level}',
  'rooms.sign_for_sale': '{name}\nBuild in the shop: {cost}',
};

/** The decorations downstairs. `{sellPrice}`, `{brewSpeed}` and `{vipChance}` are filled in from data. */
export const decor: Messages = {
  'decor.wall_torch.name': 'Wall Torch',
  'decor.wall_torch.description': 'Drinks sell {sellPrice} higher. Everything looks expensive by torchlight.',
  'decor.woven_rug.name': 'Woven Rug',
  'decor.woven_rug.description': 'The cauldron brews {brewSpeed} faster. Warm feet, quick hands.',
  'decor.boar_trophy.name': 'Boar Trophy',
  'decor.boar_trophy.description': 'Drinks sell {sellPrice} higher. Nobody haggles while the boar is watching.',
  'decor.everburning_torch.name': 'Everburning Torch',
  'decor.everburning_torch.description': 'The cauldron brews {brewSpeed} faster. Never goes out, never stops showing off.',
  'decor.royal_carpet.name': 'Royal Carpet',
  'decor.royal_carpet.description': '{vipChance} VIPs. Royalty can smell a red carpet from three kingdoms away.',
  'decor.golden_tankard.name': 'Golden Tankard',
  'decor.golden_tankard.description': 'Drinks sell {sellPrice} higher. Too heavy to drink from, perfect for bragging.',
};

export const shop: Messages = {
  'shop.tab': 'Shop',
  'shop.title': 'Upgrades',
  'shop.kind_ingredients': 'Ingredients',
  'shop.ingredient_text': 'Opens up new recipes. Buy it once and it stays on the shelf; using it is free.',
  'shop.ingredient_locked': 'Unlocks at {level}',
  'shop.ingredient_owned': 'On the shelf',
  'shop.buy_once': 'Buy · {cost}',
  'shop.owned': 'Owned',
  'shop.kind_rooms': 'Rooms',
  'shop.build_once': 'Build · {cost}',
  'shop.kind_decor': 'Decorations',
  'shop.kind_cauldron': 'Cauldron',
  'shop.kind_tavern': 'Tavern',
  'shop.kind_staff': 'Staff',
  'shop.kind_night': 'Night Shift',
  'shop.level': 'Level {level}',
  'shop.level_max': 'Level {level} (max)',
  'shop.buy': 'Buy {count}x',
  'shop.maxed': 'Maxed',
  'shop.amount_1': 'x1',
  'shop.amount_10': 'x10',
  'shop.amount_max': 'Max',
};

/** `{amount}` is the effect per level, filled in from the upgrade data (for example "+10%"). */
export const upgrades: Messages = {
  'upgrades.swift_cauldron.name': 'Swift Cauldron',
  'upgrades.swift_cauldron.description': 'The cauldron brews {amount} faster per level. It denies being in a hurry.',
  'upgrades.better_prices.name': 'Better Prices',
  'upgrades.better_prices.description': 'Drinks sell for {amount} more per level. Nobody checks the menu anyway.',
  'upgrades.extra_seat.name': 'Extra Seat',
  'upgrades.extra_seat.description': '{amount} customer can sit in the tavern per level. More seats, more thirst.',
  'upgrades.bigger_bar.name': 'Bigger Bar',
  'upgrades.brewer_assistant.name': "Brewer's Assistant",
  'upgrades.brewer_assistant.description': 'Starts the drink a waiting customer wants. Each level adds {amount} brews per second. Works for exposure.',
  'upgrades.waitress.name': 'Waitress',
  'upgrades.waitress.description': 'Serves ready drinks to the right customer. Each level adds {amount} serves per second. Tips not included.',
  'upgrades.bigger_bar.description': '{amount} drink fits on the bar per level. Cheers to shelf space.',
  'upgrades.night_shift.name': 'Night Shift',
  'upgrades.night_shift.description': 'Staff keep working while you are away, just a bit slower. Someone has to mop at 3 AM.',
  'upgrades.night_owls.name': 'Night Owls',
  'upgrades.night_owls.description': 'While you are away, staff work {amount} harder per level. Coffee helps.',
  'upgrades.long_night.name': 'Long Night',
  'upgrades.long_night.description': 'Staff keep working {amount} hour longer while you are away, per level. Sleep is overrated.',
};
