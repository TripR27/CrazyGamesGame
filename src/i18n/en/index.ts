import type { Messages } from '@/i18n/translator';
import { customers } from './customers';
import { feedback } from './feedback';
import { hud } from './hud';
import { ingredients } from './ingredients';
import { recipes } from './recipes';

/** One file per domain; adding a domain means adding a spread here. */
export const en: Messages = { ...hud, ...ingredients, ...recipes, ...customers, ...feedback };
