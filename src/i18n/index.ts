import { getLocales } from 'expo-localization';
import tr from '../../locales/tr.json';
import en from '../../locales/en.json';
import ar from '../../locales/ar.json';

export type Lang = 'tr' | 'ar' | 'en';
export const LANGS: Lang[] = ['tr', 'ar', 'en'];
export const RTL_LANGS: Lang[] = ['ar'];

type Dict = typeof tr;
type Join<K extends string, P extends string> = `${K}.${P}`;
type Paths<T> = {
  [K in keyof T & string]: T[K] extends string ? K : Join<K, Paths<T[K]>>;
}[keyof T & string];
export type TKey = Paths<Dict>;

const dicts: Record<Lang, Dict> = { tr, en, ar };
let current: Lang = detectLang();

function detectLang(): Lang {
  const code = getLocales()[0]?.languageCode;
  return code === 'tr' || code === 'ar' ? code : 'en';
}

export function setLang(lang: Lang) {
  current = lang;
}
export function getLang(): Lang {
  return current;
}
export function isRTL(lang: Lang = current): boolean {
  return RTL_LANGS.includes(lang);
}

export function t(key: TKey, params?: Record<string, string | number>): string {
  let value: unknown = dicts[current];
  for (const part of key.split('.')) value = (value as Record<string, unknown>)?.[part];
  let out = typeof value === 'string' ? value : key;
  if (params) for (const [k, v] of Object.entries(params)) out = out.replaceAll(`{${k}}`, String(v));
  return out;
}
