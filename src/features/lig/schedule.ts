/** Ramazan Ligi: sezon günü ve bugünkü durumun hesabı — saf TS. */
import { dayNumber } from '../../lib/date';

export interface Season {
  id: string;
  name: string;
  starts_on: string;
  ends_on: string;
  qadr_day_no: number;
  lang: string;
}
export interface LeagueDay {
  day_no: number;
  question_ids: string[];
  opens_at: string;
  is_final: boolean;
}

/** Sezonun kaçıncı günü (1 tabanlı); sezondan önce ≤ 0. */
export const dayNoFor = (startsOn: string, today: string): number => dayNumber(today) - dayNumber(startsOn) + 1;
export const seasonLength = (s: Pick<Season, 'starts_on' | 'ends_on'>): number => dayNumber(s.ends_on) - dayNumber(s.starts_on) + 1;

export type LeagueStatus =
  | { kind: 'not-started'; startsOn: string }
  | { kind: 'ended' }
  | { kind: 'no-set'; dayNo: number }
  | { kind: 'locked'; dayNo: number; opensAt: number; isFinal: boolean }
  | { kind: 'open'; dayNo: number; isFinal: boolean }
  | { kind: 'done'; dayNo: number; isFinal: boolean };

/**
 * Bugünkü durum:
 *  - sezondan önce / sonra
 *  - set yok (sunucuda o gün için satır görünmüyor)
 *  - oynandı → done
 *  - iftar öncesi → locked (opensAt = şehrin iftar sonrası açılış anı)
 *  - aksi hâlde open
 * `iftarAt` null ise (kutup bölgesi vb.) kilit uygulanmaz.
 */
export function leagueStatus(p: {
  season: Season;
  days: readonly LeagueDay[];
  today: string;
  now: number;
  iftarAt: number | null;
  doneDays: readonly number[];
}): LeagueStatus {
  const dayNo = dayNoFor(p.season.starts_on, p.today);
  if (dayNo < 1) return { kind: 'not-started', startsOn: p.season.starts_on };
  if (dayNo > seasonLength(p.season)) return { kind: 'ended' };
  const day = p.days.find((d) => d.day_no === dayNo);
  if (!day) return { kind: 'no-set', dayNo };
  if (p.doneDays.includes(dayNo)) return { kind: 'done', dayNo, isFinal: day.is_final };
  if (p.iftarAt !== null && p.now < p.iftarAt) return { kind: 'locked', dayNo, opensAt: p.iftarAt, isFinal: day.is_final };
  return { kind: 'open', dayNo, isFinal: day.is_final };
}

/** Bildirim planı: bugünden başlayarak, henüz geçmemiş ve sezon içindeki en çok `max` gün için açılış anları. */
export function reminderPlan(p: {
  season: Season;
  today: string;
  now: number;
  openMsFor: (dateKey: string) => number | null;
  addDays: (key: string, n: number) => string;
  max?: number;
}): { dayNo: number; at: number }[] {
  const out: { dayNo: number; at: number }[] = [];
  for (let i = 0; i < 14 && out.length < (p.max ?? 7); i++) {
    const key = p.addDays(p.today, i);
    const dayNo = dayNoFor(p.season.starts_on, key);
    if (dayNo < 1) continue;
    if (dayNo > seasonLength(p.season)) break;
    const at = p.openMsFor(key);
    if (at !== null && at > p.now) out.push({ dayNo, at });
  }
  return out;
}
