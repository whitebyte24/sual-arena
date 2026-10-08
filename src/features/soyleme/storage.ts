import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Settings } from './engine';

const SETTINGS_KEY = 'soyleme.settings.v1';
const SEEN_KEY = 'soyleme.seen.v1';
const SEEN_CAP = 3000;

async function readJson<T>(key: string): Promise<T | undefined> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : undefined;
  } catch {
    return undefined; // depolama okunamazsa oyun yine çalışır
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // yoksay
  }
}

export const loadSettings = () => readJson<Partial<Settings>>(SETTINGS_KEY);
export const saveSettings = (s: Settings) => writeJson(SETTINGS_KEY, s);

export async function loadSeen(): Promise<string[]> {
  const v = await readJson<string[]>(SEEN_KEY);
  return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
}

/** Görülen kart kimliklerini ekler; en son SEEN_CAP kadarını tutar. */
export async function addSeen(ids: string[]): Promise<void> {
  if (!ids.length) return;
  const prev = await loadSeen();
  const merged = [...prev.filter((id) => !ids.includes(id)), ...ids].slice(-SEEN_CAP);
  await writeJson(SEEN_KEY, merged);
}
