import AsyncStorage from '@react-native-async-storage/async-storage';
import { EMPTY_LIG, sanitizeLig, type LigState } from './ligState';

const KEY = 'lig.v1';

export async function loadLig(): Promise<LigState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? sanitizeLig(JSON.parse(raw)) : EMPTY_LIG;
  } catch {
    return EMPTY_LIG;
  }
}

export async function saveLig(s: LigState): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // depolama yoksa oyun yine çalışır (ilerleme/skor kaydedilemez)
  }
}
