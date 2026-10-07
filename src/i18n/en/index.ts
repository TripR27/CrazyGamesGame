import { book } from '@/i18n/en/book';
import { customers } from '@/i18n/en/customers';
import { effects } from '@/i18n/en/effects';
import { feedback } from '@/i18n/en/feedback';
import { hud } from '@/i18n/en/hud';
import { ingredients } from '@/i18n/en/ingredients';
import { panel } from '@/i18n/en/panel';
import { recipes } from '@/i18n/en/recipes';
import { reputation } from '@/i18n/en/reputation';
import { rooms } from '@/i18n/en/rooms';
import { shop } from '@/i18n/en/shop';
import { tutorial } from '@/i18n/en/tutorial';
import { upgrades } from '@/i18n/en/upgrades';
import { welcome } from '@/i18n/en/welcome';
import type { Messages } from '@/i18n/translator';

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
};
