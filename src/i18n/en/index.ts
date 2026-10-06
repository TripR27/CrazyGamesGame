import type { Messages } from '@/i18n/translator';
import { book } from './book';
import { customers } from './customers';
import { effects } from './effects';
import { feedback } from './feedback';
import { hud } from './hud';
import { panel } from './panel';
import { ingredients } from './ingredients';
import { recipes } from './recipes';
import { reputation } from './reputation';
import { shop } from './shop';
import { tutorial } from './tutorial';
import { upgrades } from './upgrades';
import { welcome } from './welcome';

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
};
