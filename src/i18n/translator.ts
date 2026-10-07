import { en } from '@/i18n/en';
import { debug } from '@/shared/events';

export type Messages = Readonly<Record<string, string>>;
export type TranslateParams = Readonly<Record<string, string | number>>;

export interface Translator {
  /** Look up `key`; unknown keys return the key itself so gaps are visible. */
  t(key: string, params?: TranslateParams): string;
  has(key: string): boolean;
}

export interface TranslatorOptions {
  messages: Messages;
  /** Used for keys missing from `messages`, so a partial translation never shows gaps. */
  fallback?: Messages;
}

function interpolate(template: string, params: TranslateParams | undefined, key: string): string {
  return template.replace(/\{(\w+)\}/g, (placeholder, name: string) => {
    const value = params?.[name];
    if (value === undefined) {
      debug('missing i18n param', key, name);
      return placeholder;
    }
    return String(value);
  });
}

export function createTranslator({ messages, fallback }: TranslatorOptions): Translator {
  const find = (key: string): string | undefined => messages[key] ?? fallback?.[key];
  return {
    has: (key) => find(key) !== undefined,
    t(key, params) {
      const template = find(key);
      if (template === undefined) {
        debug('missing i18n key', key);
        return key;
      }
      return interpolate(template, params, key);
    },
  };
}

const translator = createTranslator({ messages: en });

export const t = translator.t;
export const hasKey = translator.has;
