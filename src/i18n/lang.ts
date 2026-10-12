/** Dil tercihi — saf TS (test edilebilir). */

export type Lang = 'tr' | 'ar' | 'en';
export const LANGS: readonly Lang[] = ['tr', 'ar', 'en'];
export const RTL_LANGS: readonly Lang[] = ['ar'];

/** Dil adları kendi dillerinde yazılır (kullanıcı bulabilsin diye çevrilmez). */
export const LANG_NAMES: Record<Lang, string> = { tr: 'Türkçe', ar: 'العربية', en: 'English' };

export const isLang = (v: unknown): v is Lang => typeof v === 'string' && (LANGS as readonly string[]).includes(v);
export const isRTLLang = (lang: Lang): boolean => RTL_LANGS.includes(lang);

/** Kayıtlı tercih > cihaz dili > İngilizce. */
export function pickInitialLang(stored: unknown, deviceCode: string | null | undefined): Lang {
  if (isLang(stored)) return stored;
  const code = (deviceCode ?? '').toLowerCase().split(/[-_]/)[0];
  return isLang(code) ? code : 'en';
}

export type ThemePref = 'system' | 'dark' | 'light';
export const THEME_PREFS: readonly ThemePref[] = ['system', 'dark', 'light'];
export const pickThemePref = (v: unknown): ThemePref => (THEME_PREFS as readonly unknown[]).includes(v) ? (v as ThemePref) : 'system';
