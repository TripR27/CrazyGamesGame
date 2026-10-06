import { createTranslator } from './translator';
import { en } from './en';

const translator = createTranslator({ messages: en });

export const t = translator.t;
export const hasKey = translator.has;
export type { Messages, TranslateParams, Translator } from './translator';
