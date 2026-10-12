/** "Hatalı soru bildir" — saf TS (test edilebilir). Tablo: supabase `question_reports`. */
import type { ContentLang } from '../../content/schema';

export const REASONS = ['wrong_answer', 'typo', 'offensive', 'unclear', 'other'] as const;
export type Reason = (typeof REASONS)[number];
export const NOTE_MAX = 500;
export const QUEUE_CAP = 50;

export interface Report {
  question_id: string;
  lang: ContentLang;
  reason: Reason;
  note?: string;
}

export const isReason = (v: unknown): v is Reason => (REASONS as readonly unknown[]).includes(v);

/** Girdiyi temizler: notu kırpar ve sınırlar; geçersiz neden/biçimde null. */
export function buildReport(input: { questionId: string; lang: ContentLang; reason: unknown; note?: string }): Report | null {
  if (!/^q-(tr|ar|en)-[a-z]+-\d{6}$/.test(input.questionId) || !isReason(input.reason)) return null;
  const note = input.note?.trim().slice(0, NOTE_MAX);
  return { question_id: input.questionId, lang: input.lang, reason: input.reason, ...(note ? { note } : {}) };
}

/** Çevrimdışı kuyruk: aynı soru için yalnızca en son bildirim kalır; sınır aşılırsa en eskiler atılır. */
export function enqueue(queue: readonly Report[], r: Report, cap = QUEUE_CAP): Report[] {
  const next = [...queue.filter((x) => x.question_id !== r.question_id), r];
  return next.length > cap ? next.slice(next.length - cap) : next;
}

/** Kuyruğu bozuk/eski kayıttan güvenle okur. */
export function sanitizeQueue(raw: unknown): Report[] {
  if (!Array.isArray(raw)) return [];
  const out: Report[] = [];
  for (const x of raw) {
    const r = x && typeof x === 'object' ? buildReport({ questionId: String((x as Report).question_id), lang: (x as Report).lang, reason: (x as Report).reason, note: (x as Report).note }) : null;
    if (r) out.push(r);
  }
  return out;
}
