import AsyncStorage from '@react-native-async-storage/async-storage';
import { getIdentity } from '@/lib/identity';
import { getRemoteConfig } from '@/lib/remoteConfig';
import { supabase } from '@/lib/supabase';
import type { LeagueDay, Season } from './schedule';

const CACHE_KEY = 'lig.cache.v1';
const TIMEOUT_MS = 4000;

export interface LeagueData {
  season: Season;
  days: LeagueDay[];
}

const withTimeout = <T>(p: PromiseLike<T>): Promise<T | null> =>
  Promise.race([Promise.resolve(p), new Promise<null>((r) => setTimeout(() => r(null), TIMEOUT_MS))]);

/**
 * Etkin sezon + (RLS ile) şu an görünür günler. İki anahtar da AÇIK olmalı:
 * `remote_config.features.league_enabled` ve `league_seasons.enabled`. Yeniden yayın gerekmez.
 * Çevrimdışıysa son önbellek; hiç yoksa null.
 */
export async function loadLeague(lang: string): Promise<{ data: LeagueData | null; offline: boolean }> {
  const cfg = await getRemoteConfig();
  if (supabase && cfg.features.league_enabled) {
    try {
      const s = await withTimeout(
        supabase.from('league_seasons').select('id,name,starts_on,ends_on,qadr_day_no,lang').eq('enabled', true).eq('lang', lang).order('starts_on', { ascending: false }).limit(1).maybeSingle(),
      );
      if (s && !s.error) {
        if (!s.data) {
          await AsyncStorage.removeItem(CACHE_KEY).catch(() => {});
          return { data: null, offline: false };
        }
        const d = await withTimeout(supabase.from('league_days').select('day_no,question_ids,opens_at,is_final').eq('season_id', s.data.id).order('day_no'));
        if (d && !d.error) {
          const data: LeagueData = { season: s.data as Season, days: (d.data ?? []) as LeagueDay[] };
          AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data)).catch(() => {});
          return { data, offline: false };
        }
      }
    } catch {
      // önbelleğe düş
    }
  } else if (supabase && !cfg.features.league_enabled) {
    // Uzaktan kapatılmış: önbelleği de kullanma
    return { data: null, offline: false };
  }
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    const cached = raw ? (JSON.parse(raw) as LeagueData) : null;
    return { data: cached && cached.season.lang === lang ? cached : null, offline: true };
  } catch {
    return { data: null, offline: true };
  }
}

/** Lig lansmanda kapalıysa ana ekran kartı "Yakında" kalır. */
export async function isLeagueAvailable(lang: string): Promise<boolean> {
  return !!(await loadLeague(lang)).data;
}

/** Skoru sunucuya yazar (kullanıcı+sezon+gün başına tek). true = işlendi, false = tekrar denenmeli. */
export async function submitScore(seasonId: string, dayNo: number, score: number, displayName: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const me = await getIdentity();
    if (!me.online) return false;
    const { error } = await supabase.from('league_scores').insert({ season_id: seasonId, day_no: dayNo, score });
    if (error && error.code !== '23505') return false; // 23505: bu gün için skor zaten var
    // görünen ad sıralamada çıksın (kendi profilini günceller)
    await supabase.from('profiles').update({ display_name: displayName.slice(0, 24) }).eq('id', (await supabase.auth.getUser()).data.user?.id ?? '');
    return true;
  } catch {
    return false;
  }
}

export interface Row {
  rank_no: number;
  display_name: string;
  total_score: number;
}

export async function fetchLeaderboard(seasonId: string, dayNo: number | null): Promise<Row[] | null> {
  if (!supabase) return null;
  try {
    const res = await withTimeout(supabase.rpc('league_leaderboard', { p_season: seasonId, p_day: dayNo, p_limit: 20 }));
    return res && !res.error ? ((res.data ?? []) as Row[]) : null;
  } catch {
    return null;
  }
}
