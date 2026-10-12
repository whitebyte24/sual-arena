import AsyncStorage from '@react-native-async-storage/async-storage';
import { mergeSeen } from './seenLogic';

const KEY = 'questions.seen.v1';

/** Daha önce oynanan sorular: yeni maçta görülmemişler öne alınır (match.pickQuestions). */
export async function loadSeenQuestions(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const v = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export async function addSeenQuestions(ids: readonly string[]): Promise<void> {
  if (!ids.length) return;
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(mergeSeen(await loadSeenQuestions(), ids)));
  } catch {
    // yoksay: tekrar önleme en iyi çabadır
  }
}
