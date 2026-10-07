import { type IngredientDef, ingredientOffer, type IngredientCatalog, type IngredientShopState } from '@/brewing/ingredients';
import type { UpgradeDef, UpgradeEffect } from '@/economy/upgrade-data';
import { quoteFor, type UpgradeState, levelOf, type BuyAmount } from '@/economy/upgrades';
import { t } from '@/i18n/translator';
import { REPUTATION_LEVELS } from '@/reputation/reputation';
import { type RoomDef, roomOffer, type RoomState } from '@/rooms/rooms';
import { textKey } from '@/shared/content';
import { formatNumber } from '@/shared/numbers';
import type { OneTimeOffer } from '@/shared/purchases';

/** Everything one shop row shows, as plain strings and flags (so it is easy to test). */
export interface RowView {
  name: string;
  description: string;
  level: string;
  buyLabel: string;
  canBuy: boolean;
  maxed: boolean;
}

/** The effect of one level as the player reads it: "+10%" for factors, "+1" for added amounts. */
export function effectAmount(effect: UpgradeEffect): string {
  return effect.mode === 'multiply' ? `+${Math.round(effect.perLevel * 100)}%` : `+${effect.perLevel}`;
}

export function toRowView(def: UpgradeDef, state: UpgradeState, amount: BuyAmount): RowView {
  const level = levelOf(state.upgrades, def);
  const deal = quoteFor(state, def, amount);
  const maxed = deal.count === 0;
  return {
    name: t(textKey('upgrades', def.id, 'name')),
    description: t(textKey('upgrades', def.id, 'description'), { amount: effectAmount(def.effect) }),
    level: t(maxed ? 'shop.level_max' : 'shop.level', { level }),
    buyLabel: maxed ? t('shop.maxed') : `${t('shop.buy', { count: deal.count })} · ${formatNumber(deal.cost)}`,
    canBuy: deal.affordable,
    maxed,
  };
}

/** A bought ingredient leaves the shop (see `isListed`). */
export const isIngredientListed = (def: IngredientDef, state: IngredientShopState, catalog: IngredientCatalog): boolean =>
  isListed(ingredientOffer(state, def, catalog));

/** One ingredient in the shop: locked until its level, then for sale once. */
export function toIngredientRowView(def: IngredientDef, state: IngredientShopState, catalog: IngredientCatalog): RowView {
  const labels = {
    name: t(textKey('ingredients', def.id, 'name')),
    description: t('shop.ingredient_text'),
    level: def.buy?.level ?? 1,
    buyKey: 'shop.buy_once',
  };
  return toOneTimeRowView(labels, ingredientOffer(state, def, catalog));
}

/** What a one-time purchase (an ingredient, a room) shows in the shop besides its offer. */
export interface OneTimeLabels {
  name: string;
  description: string;
  /** The reputation level it is for sale from. */
  level: number;
  /** i18n key of the buy button, with `{cost}`. */
  buyKey: string;
}

const levelName = (level: number): string => t(textKey('reputation', REPUTATION_LEVELS[level - 1]?.id ?? '', 'name'));

/** Bought ones leave the shop: they are there for good, so listing them would only clutter it. */
export const isListed = (offer: OneTimeOffer): boolean => offer.status !== 'owned';

/** One row for a one-time purchase: locked until its level ("Unlocks at …"), then for sale with its price. */
export function toOneTimeRowView(labels: OneTimeLabels, offer: OneTimeOffer): RowView {
  return {
    name: labels.name,
    description: labels.description,
    level: offer.status === 'locked' ? t('shop.ingredient_locked', { level: levelName(labels.level) }) : '',
    buyLabel: t(labels.buyKey, { cost: formatNumber(offer.cost) }),
    canBuy: offer.affordable,
    maxed: false,
  };
}

/** The description of a room, with its seats and the amount of each effect filled in (`{seats}`, `{brewSpeed}`, …). */
export function roomDescription(room: RoomDef): string {
  const amounts = Object.fromEntries(room.effects.map((e) => [e.stat, effectAmount(e)]));
  return t(textKey('rooms', room.id, 'description'), { seats: room.seats, ...amounts });
}

/** One room in the shop: locked until its level, then for sale once (built rooms leave the shop). */
export function toRoomRowView(room: RoomDef, state: RoomState): RowView {
  const labels = { name: t(textKey('rooms', room.id, 'name')), description: roomDescription(room), level: room.buy.level, buyKey: 'shop.build_once' };
  return toOneTimeRowView(labels, roomOffer(state, room));
}
