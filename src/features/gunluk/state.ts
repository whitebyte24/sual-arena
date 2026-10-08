/** Günlük Soru kayıt biçimi ve güvenli ayrıştırma (saf TS). */
import { addDays, isDateKey } from '../../lib/date';
import { EMPTY_STREAK, type StreakState } from './daily';

export interface DayResult {
  /** Gösterilen (karıştırılmış) şık indeksleri; -1 yok */
  choices: number[];
  correct: boolean[];
}

export interface DailyState {
  streak: StreakState;
  results: Record<string, DayResult>;
  /** Yarım kalan gün: aynı soruyu tekrar cevaplayarak hile yapılmasın diye her cevap hemen kaydedilir. */
  progress: { day: string; choices: number[]; correct: boolean[] } | null;
}

export const EMPTY_DAILY: DailyState = { streak: EMPTY_STREAK, results: {}, progress: null };

const num = (v: unknown, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : d);

/** Bozuk/eski kaydı güvenli biçime getirir. */
export function sanitizeDaily(raw: unknown): DailyState {
  if (typeof raw !== 'object' || raw === null) return EMPTY_DAILY;
  const r = raw as Partial<DailyState>;
  const streak: StreakState = {
    streak: Math.max(0, Math.floor(num(r.streak?.streak))),
    best: Math.max(0, Math.floor(num(r.streak?.best))),
    lastDay: isDateKey(r.streak?.lastDay) ? r.streak!.lastDay : null,
  };
  const results: DailyState['results'] = {};
  for (const [day, v] of Object.entries(r.results ?? {})) {
    if (isDateKey(day) && Array.isArray(v?.choices) && Array.isArray(v?.correct)) results[day] = v;
  }
  const p = r.progress;
  const progress =
    p && isDateKey(p.day) && Array.isArray(p.choices) && Array.isArray(p.correct) ? { day: p.day, choices: p.choices, correct: p.correct } : null;
  return { streak, results, progress };
}

export function pruneResults(results: DailyState['results'], today: string, keepDays = 60): DailyState['results'] {
  const cutoff = addDays(today, -keepDays);
  return Object.fromEntries(Object.entries(results).filter(([d]) => d >= cutoff));
}
