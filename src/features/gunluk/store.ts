import AsyncStorage from '@react-native-async-storage/async-storage';
import { EMPTY_DAILY, pruneResults, sanitizeDaily, type DailyState } from './state';

const KEY = 'daily.v1';

export async function loadDaily(): Promise<DailyState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? sanitizeDaily(JSON.parse(raw)) : EMPTY_DAILY;
  } catch {
    return EMPTY_DAILY;
  }
}

export async function saveDaily(state: DailyState, today: string): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify({ ...state, results: pruneResults(state.results, today) }));
  } catch {
    // depolama yoksa oyun yine de çalışır (seri kaydedilemez)
  }
}
