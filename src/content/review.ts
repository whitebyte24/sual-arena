/** İnsan editör onay akışı — saf TS (test edilebilir). */
import { REVIEW_STATUSES, type ReviewStatus } from './schema';

export type Decisions = Record<string, ReviewStatus>;

export interface ApplyResult<T> {
  items: T[];
  changed: string[];
  /** kararı olup dosyada bulunmayan kimlikler */
  unknown: string[];
  /** geçersiz durum değeri taşıyan kararlar */
  invalid: string[];
}

export const isStatus = (v: unknown): v is ReviewStatus => (REVIEW_STATUSES as readonly unknown[]).includes(v);

/**
 * Kararları uygular. Yalnızca `review_status` değişir; başka hiçbir alana dokunulmaz.
 * Bilinmeyen kimlik ve geçersiz durum sessizce yutulmaz: ayrı listelenir.
 */
export function applyDecisions<T extends { id: string; review_status: ReviewStatus }>(items: readonly T[], decisions: Decisions): ApplyResult<T> {
  const changed: string[] = [];
  const invalid: string[] = [];
  const present = new Set(items.map((i) => i.id));
  const out = items.map((item) => {
    const d = decisions[item.id];
    if (d === undefined) return item;
    if (!isStatus(d)) {
      invalid.push(item.id);
      return item;
    }
    if (d === item.review_status) return item;
    changed.push(item.id);
    return { ...item, review_status: d };
  });
  const unknown = Object.keys(decisions).filter((id) => !present.has(id));
  return { items: out, changed, unknown, invalid };
}

/** Yalnızca onaylı öğelerin sayısı (dil × kategori/seviye), lansman hedefleriyle karşılaştırmak için. */
export function approvedCounts(items: readonly { lang: string; category?: string; level?: string; review_status: ReviewStatus }[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const i of items) {
    if (i.review_status !== 'approved') continue;
    const key = `${i.lang}/${i.category ?? i.level ?? '-'}`;
    out[key] = (out[key] ?? 0) + 1;
  }
  return out;
}
