import AsyncStorage from '@react-native-async-storage/async-storage';
import { dateKey } from '@/lib/date';
import { addBonus, normalizeQuota, type Quota } from './quotaLogic';

export { FREE_DUELS_PER_DAY, remainingDuels, type Quota } from './quotaLogic';
const KEY = 'duel.quota.v1';

export async function loadQuota(): Promise<Quota> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return normalizeQuota(raw ? JSON.parse(raw) : undefined, dateKey());
  } catch {
    return normalizeQuota(undefined, dateKey());
  }
}

async function save(q: Quota): Promise<Quota> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(q));
  } catch {
    // yoksay
  }
  return q;
}

export async function consumeDuel(): Promise<Quota> {
  const q = await loadQuota();
  return save({ ...q, used: q.used + 1 });
}

/** Ödüllü reklam: bugün için ek düello hakkı. */
export async function grantBonusDuels(n: number): Promise<Quota> {
  return save(addBonus(await loadQuota(), n));
}
