import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { pickThemePref, type ThemePref } from '@/i18n/lang';

const KEY = 'settings.theme.v1';

function apply(pref: ThemePref) {
  try {
    Appearance.setColorScheme(pref === 'system' ? 'unspecified' : pref);
  } catch {
    // bazı ortamlarda (web) desteklenmeyebilir: sistem ayarına bırak
  }
}

export async function loadThemePref(): Promise<ThemePref> {
  try {
    return pickThemePref(await AsyncStorage.getItem(KEY));
  } catch {
    return 'system';
  }
}

/** Açılışta bir kez: kayıtlı tema tercihini uygular. */
export async function initAppearance(): Promise<ThemePref> {
  const pref = await loadThemePref();
  apply(pref);
  return pref;
}

export async function setThemePref(pref: ThemePref): Promise<void> {
  apply(pref);
  try {
    await AsyncStorage.setItem(KEY, pref);
  } catch {
    // yoksay
  }
}
