import type { Messages } from '@/i18n/translator';

/** The recipe book panel, and the "Eureka!" line when a recipe is discovered. */
export const book: Messages = {
  'book.tab': 'Recipes',
  'book.title': 'Recipe Book',
  'book.progress': '{found}/{total} discovered',
  'book.legend_title': 'What drinks do',
  'book.legend_does': '{name}: {does}',
  'book.legend_liked': '♥ in an order: the customer loves that effect, so it counts double.',
  'book.brew_time': '{s}s brew',
  'book.price': '{n} gold',
  'book.locked': 'Unlocks at {level}',
  'book.unknown': 'a later level',
  'book.needs': 'Needs {ingredients} from the shop',
  'book.hidden_name': '???',
  'book.eureka': 'Eureka! {drink}!',
  'book.rarity_common': 'Common',
  'book.rarity_uncommon': 'Uncommon',
  'book.rarity_rare': 'Rare',
  'book.rarity_epic': 'Epic',
  'book.rarity_legendary': 'Legendary',
};

export const customers: Messages = {
  'customers.knight.name': 'Sir Dents-a-Lot',
  'customers.knight.tagline': 'Late for a quest. Always. Nobody knows which one.',
  'customers.elf.name': 'Elf with Opinions',
  'customers.elf.tagline': 'Has read your menu and would like to discuss it.',
  'customers.dwarf.name': 'Thirsty Dwarf',
  'customers.dwarf.tagline': 'Small, loud and carrying an axe for emotional support.',
  'customers.king.name': 'King Grumblebeard',
  'customers.king.tagline': 'Rules three kingdoms and zero patience. Tips in crowns.',
  /** A VIP's order bubble; `{order}` is the drink, with a ♥ when liked. */
  'customers.vip_order': '👑 {order}',
};

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
  'effects.strength.name': 'Strength',
  'effects.strength.short': 'strength',
  'effects.strength.does': 'they pay more',
  'effects.strength.served': 'Big spender!',
  'effects.speed.icon': '⚡',
  'effects.speed.name': 'Speed',
  'effects.speed.short': 'speed',
  'effects.speed.does': 'they drink faster and free the seat sooner',
  'effects.speed.served': 'Quick drinker!',
  'effects.luck.icon': '🍀',
  'effects.luck.name': 'Luck',
  'effects.luck.short': 'luck',
  'effects.luck.does': 'they may leave a tip',
  'effects.luck.served': '+{n} tip!',
  'effects.luck.missed': 'No tip this time',
  'effects.charm.icon': '💖',
  'effects.charm.name': 'Charm',
  'effects.charm.short': 'charm',
  'effects.charm.does': 'they bring extra reputation',
  'effects.charm.served': '+{n} reputation',
};

/** `{drink}` is the drink the customer ordered (or got). Pool sizes live in data/feedback.ts. */
export const feedback: Messages = {
  'feedback.served.1': 'Ah, {drink}! Tastes like victory and mild regret.',
  'feedback.served.2': 'This {drink} just fixed my entire personality.',
  'feedback.served.3': 'I would die for this {drink}. Not today, but soon.',
  'feedback.served.4': 'My ancestors are applauding the {drink}. They are very loud.',
  'feedback.wrong.1': 'I ordered {drink}, not a surprise.',
  'feedback.wrong.2': 'That is not {drink}. That is a cry for help.',
  'feedback.wrong.3': 'Even my horse knows that is not {drink}.',
  'feedback.wrong.4': 'Bold choice. Wrong, but bold. Where is my {drink}?',
  'feedback.nothing.1': 'Is my {drink} coming, or should I ask the cauldron nicely?',
  'feedback.nothing.2': 'Empty hands! I ordered {drink}, not air.',
  'feedback.nothing.3': 'I have waited so long my beard has opinions. {drink}, please.',
  'feedback.nothing.4': 'Nothing ready? Fine. I will wait. Dramatically.',
  'feedback.fizzle.1': 'The cauldron burps and gives up.',
  'feedback.fizzle.2': 'That combination smells like a sock with secrets.',
  'feedback.fizzle.3': 'Poof! The ingredients have left the chat.',
  'feedback.full.1': 'The bar is full of drinks. Serve something first!',
  'feedback.full.2': 'No room on the bar. Customers, assemble!',
  'feedback.busy.1': 'Patience! The cauldron is already bubbling.',
  'feedback.busy.2': 'One brew at a time. The cauldron is shy.',
};

export const hud: Messages = {
  'hud.gold': 'Gold',
  'hud.reputation': 'Reputation',
  'hud.skip_tutorial': 'Skip tutorial',
};

export const ingredients: Messages = {
  'ingredients.swamp_slime.name': 'Swamp Slime',
  'ingredients.wild_honey.name': 'Wild Honey',
  'ingredients.glowcap.name': 'Glowcap Mushroom',
  'ingredients.fire_pepper.name': 'Fire Pepper',
  'ingredients.moon_grape.name': 'Moon Grape',
  'ingredients.troll_sweat.name': 'Troll Sweat',
};

/** The one button that unfolds the side panel (with its tabs) and folds it away again. */
export const panel: Messages = {
  'panel.open': '☰ Menu',
  'panel.close': '✕',
};

export const recipes: Messages = {
  'recipes.slime_sap.name': 'Slime Sap',
  'recipes.slime_sap.hint': 'Something green, something sweet. Do not ask where the green comes from.',
  'recipes.glowcap_stout.name': 'Glowcap Stout',
  'recipes.glowcap_stout.hint': 'Glows in the dark. Drinkers finish it fast, mostly out of worry.',
  'recipes.dragons_hiccup.name': "Dragon's Hiccup",
  'recipes.dragons_hiccup.hint': 'Sweet, then spicy, then the curtains are on fire.',
  'recipes.moonlight_merlot.name': 'Moonlight Merlot',
  'recipes.moonlight_merlot.hint': 'Grapes that only ripen when nobody is looking. Terribly fancy.',
  'recipes.trolls_toll.name': "Troll's Toll",
  'recipes.trolls_toll.hint': 'A bridge, a fee and a lot of sweat. Pay up.',
  'recipes.bog_lantern.name': 'Bog Lantern',
  'recipes.bog_lantern.hint': 'Swamp plus something that glows. Lucky drinkers swear by it, unlucky ones swear at it.',
  'recipes.swamp_fire.name': 'Swamp Fire',
  'recipes.swamp_fire.hint': 'Something spicy meets something slimy. Drinkers leave quickly. Very quickly.',
  'recipes.honeyed_moon.name': 'Honeyed Moon',
  'recipes.honeyed_moon.hint': 'A night-time fruit with a sweet tooth. Elves write poems about it.',
  'recipes.gym_sock_mead.name': 'Gym Sock Mead',
  'recipes.gym_sock_mead.hint': 'Troll effort, sweetened. Builds muscle and ends friendships.',
  'recipes.spicy_spores.name': 'Spicy Spores',
  'recipes.spicy_spores.hint': 'A mushroom, but angry. Rumour says the lucky ones find coins in it.',
  'recipes.troll_torch.name': 'Troll Torch',
  'recipes.troll_torch.hint': 'Glows like a mushroom, smells like a troll. Strong in every sense.',
  'recipes.dusk_sangria.name': 'Dusk Sangria',
  'recipes.dusk_sangria.hint': 'Fire meets moonlight. Very romantic, slightly flammable.',
  'recipes.berserker_brew.name': 'Berserker Brew',
  'recipes.berserker_brew.hint': 'The hottest pepper and the sweatiest troll. Only for heroes and idiots.',
};

/** Reputation level names, and the HUD message when a new level is reached. */
export const reputation: Messages = {
  'reputation.shabby_shack.name': 'Shabby Shack',
  'reputation.local_haunt.name': 'Local Haunt',
  'reputation.cozy_inn.name': 'Cozy Inn',
  'reputation.popular_pub.name': 'Popular Pub',
  'reputation.famous_tavern.name': 'Famous Tavern',
  'reputation.legendary_hall.name': 'Legendary Hall',
  'reputation.level_up': 'Level up! {level}',
  'reputation.new_customer': 'New customer: {name}',
  'reputation.new_ingredient': 'New in the shop: {name}',
  'reputation.new_recipes': 'New recipes to discover: {n}. Check the recipe book!',
};

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

/** The mascot is a grumpy talking cauldron. `{ingredient}`, `{drink}`, `{effect}` and the like are filled in by the guide. */
export const tutorial: Messages = {
  'tutorial.basics_add.text': 'Hey, you. Yes, you. Toss some {ingredient} into me. I do not bite. Much.',
  'tutorial.basics_finish.text': 'Now {ingredient}. Together that makes {drink}. Do not ask me how, I just work here.',
  'tutorial.basics_wait.text': 'Brewing! Do not stare at me. It makes me nervous.',
  'tutorial.basics_pick.text': 'Done! Click the drink on the bar to pick it up. Careful, it is still warm.',
  'tutorial.basics_serve.text': 'Now click the customer who ordered it. Hand it to the wrong one and I will judge you.',
  'tutorial.basics_gold.text': 'Gold! Shiny. Keep the drinks coming and I will keep bubbling.',
  'tutorial.likes_spot.text': 'See the ♥? {liked} is a {effect} drink: {does}. This one loves that, so it counts double. Serve it!',
  'tutorial.likes_done.text': 'Every drink shows its effect as an icon, and a ♥ makes it double. The recipe book explains them all.',
  'tutorial.book_open.text': 'New level, new drinks to discover! Open the menu and the Recipes tab, it remembers what you forget.',
  'tutorial.book_read.text': 'Grey cards are drinks nobody has brewed yet. Read the hint, then throw things into me. Eureka guaranteed. Mostly.',
  'tutorial.upgrade_open.text': 'Psst. You have gold burning a hole in your pocket. Open the menu, then the Shop tab.',
  'tutorial.upgrade_buy.text': 'Buy {upgrade}. Upgrades make your tavern faster and richer. Gold is for spending, not for hugging.',
  /** Fills in {upgrade} or {staff} when nothing can be bought right now. */
  'tutorial.any_upgrade': 'an upgrade',
  'tutorial.seats_buy.text': 'One customer at a time? Buy an Extra Seat in the Shop tab. More chairs, more thirst.',
  'tutorial.seats_done.text': 'A new chair! Customers come in gradually, so keep an eye on the door.',
  'tutorial.ingredient_buy.text': 'Fresh stock! {shopIngredient} is for sale in the Shop tab. Buy it once and it stays on the shelf for good.',
  'tutorial.ingredient_done.text': 'There it is, on the shelf. The recipe book knows what to throw in with it. I am ready. Probably.',
  'tutorial.staff_hire.text': 'Tired of doing everything yourself? Hire {staff} in the Shop tab. They work while you complain.',
  'tutorial.staff_done.text': 'Hired! Slower than you, but they never ask for a break. Buy Night Shift in the Shop tab and they even work while you are away.',
  'tutorial.vip_spot.text': 'A VIP! Royalty wants {royal}, the fanciest thing we make. Pays triple, waits for nobody.',
  'tutorial.vip_done.text': 'Ka-ching. Keep the crown happy and the crown keeps paying.',
  'tutorial.room_buy.text': 'This shack has an upstairs? Build the {room} in the Shop tab. More room, more customers, more chaos.',
  'tutorial.room_done.text': 'Look up! A brand new room. Customers will find it on their own. They always find the drinks.',
  'tutorial.decor_buy.text': 'This place looks like a cave. Buy the {decor} in the Shop tab. Pretty things pay off, a little.',
  'tutorial.decor_done.text': 'Fancy! Every decoration gives a small bonus forever. Almost respectable in here now.',
  'tutorial.upgrade_done.text': 'Ahh, shopping. Your gold went down and somehow you feel richer. Welcome to economics.',
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

export const welcome: Messages = {
  'welcome.title': 'Welcome back!',
  'welcome.away': 'You were away for {time}.',
  'welcome.served': 'Customers served: {served}',
  'welcome.gold': 'Gold earned: {gold}',
  'welcome.nobody':
    'Nobody was working while you were away. Hire a brewer and a waitress, then buy Night Shift, and they keep the tavern running for you.',
  'welcome.missed': 'Your staff went home. With Night Shift they could have earned {gold} gold.',
  'welcome.night_shift': 'Buy Night Shift in the shop and they keep working while you are away.',
  'welcome.capped': 'Staff stop working after {limit} away.',
  'welcome.collect': 'Great!',
  'time.hours': '{n}h',
  'time.minutes': '{n}m',
  'time.seconds': '{n}s',
};

/** One file per domain; adding a domain means adding a spread here. */
export const en: Messages = {
  ...hud,
  ...ingredients,
  ...recipes,
  ...reputation,
  ...customers,
  ...effects,
  ...feedback,
  ...tutorial,
  ...shop,
  ...upgrades,
  ...welcome,
  ...book,
  ...panel,
  ...rooms,
  ...decor,
};
