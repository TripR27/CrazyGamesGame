import type { Messages } from '@/i18n/translator';

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
  'tutorial.staff_done.text': 'Hired! They are slower than you, but they never ask for a break. They even keep working when you close the tab.',
  'tutorial.vip_spot.text': 'A VIP! Royalty wants {royal}, the fanciest thing we make. Pays triple, waits for nobody.',
  'tutorial.vip_done.text': 'Ka-ching. Keep the crown happy and the crown keeps paying.',
  'tutorial.upgrade_done.text': 'Ahh, shopping. Your gold went down and somehow you feel richer. Welcome to economics.',
};
