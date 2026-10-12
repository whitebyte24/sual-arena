/** Ligin cihazdaki kaydı — saf TS (biçim ve güvenli ayrıştırma). */
import { sanitizeAnswers, type RunAnswer } from './run';

export interface DayRecord {
  answers: RunAnswer[];
  /** Set tamamlandıysa toplam puan */
  score?: number;
  /** Skor sunucuya gitti mi (çevrimdışıysa false: sonra yeniden denenir) */
  submitted: boolean;
}

export interface LigState {
  cityId?: string;
  reminders: boolean;
  seasons: Record<string, Record<string, DayRecord>>;
}

export const EMPTY_LIG: LigState = { reminders: false, seasons: {} };

export function sanitizeLig(raw: unknown): LigState {
  if (typeof raw !== 'object' || raw === null) return EMPTY_LIG;
  const r = raw as Partial<LigState>;
  const seasons: LigState['seasons'] = {};
  for (const [sid, days] of Object.entries(r.seasons ?? {})) {
    if (typeof days !== 'object' || days === null) continue;
    const out: Record<string, DayRecord> = {};
    for (const [dn, rec] of Object.entries(days)) {
      if (!/^\d{1,2}$/.test(dn) || typeof rec !== 'object' || rec === null) continue;
      const rr = rec as Partial<DayRecord>;
      const score = typeof rr.score === 'number' && Number.isFinite(rr.score) && rr.score >= 0 ? Math.floor(rr.score) : undefined;
      out[dn] = { answers: sanitizeAnswers(rr.answers), ...(score !== undefined ? { score } : {}), submitted: rr.submitted === true };
    }
    seasons[sid] = out;
  }
  return { cityId: typeof r.cityId === 'string' ? r.cityId : undefined, reminders: r.reminders === true, seasons };
}

export const dayRecord = (s: LigState, seasonId: string, dayNo: number): DayRecord | undefined => s.seasons[seasonId]?.[String(dayNo)];

/** Tamamlanan (puanı yazılmış) günler. */
export const doneDays = (s: LigState, seasonId: string): number[] =>
  Object.entries(s.seasons[seasonId] ?? {})
    .filter(([, rec]) => rec.score !== undefined)
    .map(([dn]) => Number(dn))
    .sort((a, b) => a - b);

export function withDay(s: LigState, seasonId: string, dayNo: number, rec: DayRecord): LigState {
  return { ...s, seasons: { ...s.seasons, [seasonId]: { ...(s.seasons[seasonId] ?? {}), [String(dayNo)]: rec } } };
}

/** Sunucuya henüz gitmemiş skorlar. */
export function pendingScores(s: LigState): { seasonId: string; dayNo: number; score: number }[] {
  const out: { seasonId: string; dayNo: number; score: number }[] = [];
  for (const [sid, days] of Object.entries(s.seasons)) {
    for (const [dn, rec] of Object.entries(days)) if (rec.score !== undefined && !rec.submitted) out.push({ seasonId: sid, dayNo: Number(dn), score: rec.score });
  }
  return out;
}
