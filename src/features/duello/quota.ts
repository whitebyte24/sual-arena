import AsyncStorage from '@react-native-async-storage/async-storage';
import { dateKey } from '@/lib/date';

/** Ücretsiz plan: günde 10 düello. Uzaktan ayarlanabilir değer Faz 5'te remote_config'ten gelecek. */
export const FREE_DUELS_PER_DAY = 10;
const KEY = 'duel.quota.v1';

export interface Quota {
  day: string;
  used: number;
}

/** Gün değiştiyse sayaç sıfırlanır. */
export function normalizeQuota(stored: Partial<Quota> | undefined, today: string): Quota {
  return stored?.day === today && Number.isFinite(stored.used) ? { day: today, used: Math.max(0, Number(stored.used)) } : { day: today, used: 0 };
}

export const remainingDuels = (q: Quota, limit = FREE_DUELS_PER_DAY) => Math.max(0, limit - q.used);

export async function loadQuota(): Promise<Quota> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return normalizeQuota(raw ? JSON.parse(raw) : undefined, dateKey());
  } catch {
    return normalizeQuota(undefined, dateKey());
  }
}

export async function consumeDuel(): Promise<Quota> {
  const q = await loadQuota();
  const next = { ...q, used: q.used + 1 };
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // yoksay
  }
  return next;
}
