import { supabase } from '@/lib/supabase';

/** Sunucuda o gün/dil için sabitlenmiş 5 soru varsa döner; yoksa/çevrimdışıysa null (istemci deterministik seçime düşer). */
export async function fetchDailyOverride(day: string, lang: string, timeoutMs = 2500): Promise<string[] | null> {
  if (!supabase) return null;
  try {
    const query = supabase.from('daily_sets').select('question_ids').eq('day', day).eq('lang', lang).maybeSingle();
    const res = await Promise.race([query, new Promise<null>((r) => setTimeout(() => r(null), timeoutMs))]);
    const ids = res && 'data' in res ? res.data?.question_ids : null;
    return Array.isArray(ids) && ids.length === 5 && ids.every((x) => typeof x === 'string') ? ids : null;
  } catch {
    return null;
  }
}
