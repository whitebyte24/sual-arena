/**
 * Sezon planı üretimi (saf TS): onaylı sorulardan 30 günlük set listesi. `scripts/make-league-sql.ts` kullanır.
 * Her gün 5 soru; Kadir Gecesi finali günü 10 soru. Sorular sezon içinde TEKRAR ETMEZ.
 * Gün numarası = "o takvim gününün iftarından sonra açılan set" (İslâmî gün akşam başlar):
 * "27. gece" 26. günün iftarıyla başlar → finale günü = kadirGecesi − 1.
 */
import { hashString, shuffle } from '../../lib/rng';

export interface PlannedDay {
  day_no: number;
  question_ids: string[];
  is_final: boolean;
  opens_at: string;
}

export const DEFAULT_QADR_NIGHT = 27;
export const NORMAL_SET = 5;
export const FINAL_SET = 10;

export const finalDayFor = (qadrNight: number): number => Math.max(1, qadrNight - 1);

/** Gerekli soru sayısı (finale dahil). */
export const questionsNeeded = (days = 30, qadrNight = DEFAULT_QADR_NIGHT): number =>
  (days - 1) * NORMAL_SET + (finalDayFor(qadrNight) <= days ? FINAL_SET : NORMAL_SET);

/**
 * `opens_at`: sezon başlangıcından (day_no−1) gün sonra, UTC+14'te yerel gece yarısı → dünyanın her yerinde
 * yerel gün başlamadan görünür olmaz (iftar kilidi istemcidedir).
 */
export const opensAtFor = (startsOn: string, dayNo: number): string => {
  const [y, m, d] = startsOn.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + dayNo - 1) - 14 * 3_600_000).toISOString();
};

export function planSeason(p: { questionIds: readonly string[]; startsOn: string; days?: number; qadrNight?: number; seedKey: string }): PlannedDay[] {
  const days = p.days ?? 30;
  const qadrNight = p.qadrNight ?? DEFAULT_QADR_NIGHT;
  const need = questionsNeeded(days, qadrNight);
  const unique = [...new Set(p.questionIds)].sort();
  if (unique.length < need) throw new Error(`Yetersiz soru: ${unique.length} var, ${need} gerekli (onaylı, aynı dilde).`);
  const [order] = shuffle(unique, hashString(`league|${p.seedKey}`));
  const finalDay = finalDayFor(qadrNight);
  const out: PlannedDay[] = [];
  let cursor = 0;
  for (let day = 1; day <= days; day++) {
    const isFinal = day === finalDay;
    const n = isFinal ? FINAL_SET : NORMAL_SET;
    out.push({ day_no: day, question_ids: order.slice(cursor, cursor + n), is_final: isFinal, opens_at: opensAtFor(p.startsOn, day) });
    cursor += n;
  }
  return out;
}
