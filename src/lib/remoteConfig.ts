import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_ADS_CONFIG, sanitizeAdsConfig, type AdsConfig } from '@/features/ads/policy';
import { FREE_DUELS_PER_DAY } from '@/features/duello/quotaLogic';
import { supabase } from '@/lib/supabase';

export interface RemoteConfig {
  ads: AdsConfig;
  /** online_matching = acil durum anahtarı: false → çevrimiçi eşleşme/oda kapanır (düello BOT'a düşer). Varsayılan açık. */
  features: { league_enabled: boolean; free_duels_per_day: number; online_matching: boolean };
}

export const DEFAULT_REMOTE: RemoteConfig = {
  ads: DEFAULT_ADS_CONFIG,
  features: { league_enabled: false, free_duels_per_day: FREE_DUELS_PER_DAY, online_matching: true },
};

const KEY = 'remote.config.v1';
const TTL_MS = 10 * 60_000;

export function sanitizeRemote(rows: { key: string; value: unknown }[] | null | undefined): RemoteConfig {
  const by = Object.fromEntries((rows ?? []).map((r) => [r.key, r.value])) as Record<string, unknown>;
  const f = (typeof by.features === 'object' && by.features !== null ? by.features : {}) as Record<string, unknown>;
  const free = typeof f.free_duels_per_day === 'number' && Number.isFinite(f.free_duels_per_day) ? Math.round(f.free_duels_per_day) : FREE_DUELS_PER_DAY;
  return {
    ads: sanitizeAdsConfig(by.ads),
    features: {
      league_enabled: f.league_enabled === true,
      free_duels_per_day: Math.min(100, Math.max(1, free)),
      online_matching: f.online_matching !== false,
    },
  };
}

let memo: { at: number; value: RemoteConfig } | null = null;

/** Sunucudan (3 sn zaman aşımı) → önbellek → varsayılan. Çevrimdışıyken oyun etkilenmez. */
export async function getRemoteConfig(force = false): Promise<RemoteConfig> {
  if (!force && memo && Date.now() - memo.at < TTL_MS) return memo.value;
  let value: RemoteConfig | null = null;
  if (supabase) {
    try {
      const q = supabase.from('remote_config').select('key,value');
      const res = await Promise.race([q, new Promise<null>((r) => setTimeout(() => r(null), 3000))]);
      if (res && !res.error && res.data) {
        value = sanitizeRemote(res.data);
        AsyncStorage.setItem(KEY, JSON.stringify(res.data)).catch(() => {});
      }
    } catch {
      // önbelleğe düş
    }
  }
  if (!value) {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      value = raw ? sanitizeRemote(JSON.parse(raw)) : DEFAULT_REMOTE;
    } catch {
      value = DEFAULT_REMOTE;
    }
  }
  memo = { at: Date.now(), value };
  return value;
}
