import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { useSyncExternalStore } from 'react';
import { I18nManager, Platform } from 'react-native';
import tr from '../../locales/tr.json';
import en from '../../locales/en.json';
import ar from '../../locales/ar.json';
import { isRTLLang, pickInitialLang, type Lang } from './lang';

export { LANGS, LANG_NAMES, type Lang } from './lang';

type Dict = typeof tr;
type Join<K extends string, P extends string> = `${K}.${P}`;
type Paths<T> = {
  [K in keyof T & string]: T[K] extends string ? K : Join<K, Paths<T[K]>>;
}[keyof T & string];
export type TKey = Paths<Dict>;

const dicts: Record<Lang, Dict> = { tr, en, ar };
const KEY = 'settings.lang.v1';

let current: Lang = pickInitialLang(undefined, getLocales()[0]?.languageCode);
/** Yön değişti ama yerel düzen henüz eski: uygulamanın yeniden açılması gerekir. */
let restartNeeded = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function getLang(): Lang {
  return current;
}
export const isRTL = (lang: Lang = current): boolean => isRTLLang(lang);
export const needsRestart = () => restartNeeded;

/**
 * Düzenin GERÇEK yönü (simgeleri çevirmek için): yerelde `I18nManager`, web'de seçili dil.
 * Dil Arapçaya geçti ama yeniden başlatılmadıysa yerel düzen hâlâ soldan sağadır.
 */
export const layoutIsRTL = (): boolean => (Platform.OS === 'web' ? isRTLLang(current) : I18nManager.isRTL);

/** Yönü uygular. Yerelde `forceRTL` bir sonraki açılışta etkili olur. */
function applyDirection(lang: Lang) {
  const want = isRTLLang(lang);
  if (Platform.OS === 'web') {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = want ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
    }
    return;
  }
  I18nManager.allowRTL(true);
  if (I18nManager.isRTL !== want) {
    I18nManager.forceRTL(want);
    restartNeeded = true;
  } else {
    restartNeeded = false;
  }
}

/** Açılışta bir kez, ilk çizimden ÖNCE: kayıtlı dili yükle, yönü uygula. */
export async function initLang(): Promise<void> {
  let stored: string | null = null;
  try {
    stored = await AsyncStorage.getItem(KEY);
  } catch {
    // yoksay: cihaz diline düş
  }
  current = pickInitialLang(stored, getLocales()[0]?.languageCode);
  applyDirection(current);
  emit();
}

export async function setLang(lang: Lang): Promise<void> {
  if (lang === current) return;
  current = lang;
  try {
    await AsyncStorage.setItem(KEY, lang);
  } catch {
    // yoksay
  }
  applyDirection(lang);
  emit(); // kök yerleşim `key={lang}` ile yeniden kurulur
}

export function useLang(): Lang {
  return useSyncExternalStore(
    (cb) => (listeners.add(cb), () => void listeners.delete(cb)),
    () => current,
  );
}

export function t(key: TKey, params?: Record<string, string | number>): string {
  let value: unknown = dicts[current];
  for (const part of key.split('.')) value = (value as Record<string, unknown>)?.[part];
  let out = typeof value === 'string' ? value : key;
  if (params) for (const [k, v] of Object.entries(params)) out = out.replaceAll(`{${k}}`, String(v));
  return out;
}

/**
 * Büyük harf dönüşümü. Hermes (Android) `toLocaleUpperCase(yerel)` bağımsız değişkenini yok sayıp cihaz yerelini kullanabilir
 * (Türkçe cihazda İngilizce "family" → "FAMİLY"); bu yüzden dönüşümü kendimiz yaparız:
 * i/ı harflerini elle eşleriz (Türkçede i→İ, ı→I; diğer dillerde i→I), kalanı `toUpperCase()` ile.
 */
export const upper = (s: string): string =>
  (getLang() === 'tr' ? s.replace(/i/g, '\u0130').replace(/\u0131/g, 'I') : s.replace(/i/g, 'I')).toUpperCase();
