import { formatNumber } from '@/core/format';
import type { RoomDef } from '@/data/rooms';
import { REPUTATION_LEVELS } from '@/data/reputation/levels';
import { textKey } from '@/data/text-key';
import { t } from '@/i18n';
import type { OneTimeOffer } from '@/systems/purchases';

/** The sign on a boarded-up room: its name, and the level it opens at or its price. Empty once it is built. */
export function roomSign(room: RoomDef, offer: OneTimeOffer): string {
  if (offer.status === 'owned') return '';
  const name = t(textKey('rooms', room.id, 'name'));
  if (offer.status === 'locked') {
    const level = t(textKey('reputation', REPUTATION_LEVELS[room.buy.level - 1]?.id ?? '', 'name'));
    return t('rooms.sign_locked', { name, level });
  }
  return t('rooms.sign_for_sale', { name, cost: formatNumber(offer.cost) });
}
