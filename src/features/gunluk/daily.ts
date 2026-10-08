/**
 * Günlük Soru — saf TS. Aynı gün + aynı dilde herkes aynı 5 soruyu alır (sunucu gerekmez):
 * havuz kimliğe göre sıralanır, her "tur" için sabit tohumlu bir permütasyon üretilir,
 * gün d, dizinin d*5 .. d*5+4. elemanlarını alır (tur bitmeden tekrar yok).
 */
import type { Question } from '../../content/schema';
import { addDays, dayNumber } from '../../lib/date';
import { hashString, shuffle } from '../../lib/rng';

export const DAILY_COUNT = 5;
/** Sayaç #1 bu gündür (lansman öncesi de pozitif kalsın diye geçmişte). */
export const DAILY_EPOCH = '2026-10-01';

export const dailyNumber = (key: string) => Math.max(1, dayNumber(key) - dayNumber(DAILY_EPOCH) + 1);

export function dailyQuestionIds(pool: readonly Question[], key: string, count = DAILY_COUNT): string[] {
  const sorted = [...pool].sort((a, b) => a.id.localeCompare(b.id));
  const n = sorted.length;
  if (n === 0) return [];
  const want = Math.min(count, n);
  const lang = sorted[0].lang;
  const perms = new Map<number, string[]>();
  const at = (k: number) => {
    const cycle = Math.floor(k / n);
    let perm = perms.get(cycle);
    if (!perm) {
      perm = shuffle(sorted.map((q) => q.id), hashString(`daily|${lang}|${cycle}`))[0];
      perms.set(cycle, perm);
    }
    return perm[k % n];
  };
  const out: string[] = [];
  const seen = new Set<string>();
  // tur sınırında aynı soru aynı güne düşerse atlanır
  for (let k = (dailyNumber(key) - 1) * count; out.length < want && k < (dailyNumber(key) - 1) * count + n + want; k++) {
    const id = at(k);
    if (!seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  return out;
}

/** Aynı günün herkes için aynı şık sırası: tohum gün numarasından. */
export const dailySeed = (key: string, lang: string) => hashString(`seed|${lang}|${key}`);

// ─── seri ────────────────────────────────────────────────────────────────────
export interface StreakState {
  streak: number;
  best: number;
  /** Son tamamlanan gün (YYYY-MM-DD) */
  lastDay: string | null;
}
export const EMPTY_STREAK: StreakState = { streak: 0, best: 0, lastDay: null };

export type StreakStatus = 'new' | 'done' | 'active' | 'repairable' | 'broken';

/**
 * done: bugün tamamlandı · active: dün tamamlandı, bugün bekliyor ·
 * repairable: tam 1 gün kaçırıldı (ödüllü reklamla kurtarılabilir, Faz 5) · broken: seri koptu.
 */
export function streakStatus(s: StreakState, today: string): StreakStatus {
  if (!s.lastDay) return 'new';
  if (s.lastDay === today) return 'done';
  if (s.lastDay === addDays(today, -1)) return 'active';
  if (s.lastDay === addDays(today, -2) && s.streak > 0) return 'repairable';
  return 'broken';
}

/** Ekranda gösterilecek seri: kopmuşsa 0. */
export function currentStreak(s: StreakState, today: string): number {
  const st = streakStatus(s, today);
  return st === 'broken' || st === 'new' ? 0 : s.streak;
}

export function completeDay(s: StreakState, today: string): StreakState {
  if (s.lastDay === today) return s;
  const st = streakStatus(s, today);
  const streak = st === 'active' || st === 'repairable' ? s.streak + 1 : 1;
  return { streak, best: Math.max(s.best, streak), lastDay: today };
}

/** Kaçırılan tek günü "oynanmış" sayar (yalnızca repairable iken). */
export function repairStreak(s: StreakState, today: string): StreakState {
  return streakStatus(s, today) === 'repairable' ? { ...s, lastDay: addDays(today, -1) } : s;
}

// ─── paylaşım ────────────────────────────────────────────────────────────────
export const emojiGrid = (correct: readonly boolean[]) => correct.map((c) => (c ? '🟩' : '🟥')).join('');

export function shareText(p: { header: string; correct: readonly boolean[]; streak: number; url: string }): string {
  const fire = p.streak > 0 ? ` 🔥${p.streak}` : '';
  return `${p.header}${fire}\n${emojiGrid(p.correct)}\n${p.url}`;
}
