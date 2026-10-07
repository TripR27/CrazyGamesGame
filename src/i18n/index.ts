import { en } from '@/i18n/en/index';
import { createTranslator } from '@/i18n/translator';

const translator = createTranslator({ messages: en });

export const t = translator.t;
export const hasKey = translator.has;
