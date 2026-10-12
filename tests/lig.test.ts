import { describe, expect, it } from 'vitest';
import { CITIES, cityById, guessCityId } from '../src/features/lig/cities';
import { EMPTY_LIG, doneDays, pendingScores, sanitizeLig, withDay } from '../src/features/lig/ligState';
import { IFTAR_SAFETY_MINUTES, formatClock, iftarOpenMs, sunsetUtcMs } from '../src/features/lig/prayer';
import { isRunComplete, sanitizeAnswers, scoreRun } from '../src/features/lig/run';
import { dayNoFor, leagueStatus, reminderPlan, seasonLength, type LeagueDay, type Season } from '../src/features/lig/schedule';
import { DEFAULT_QADR_NIGHT, FINAL_SET, NORMAL_SET, finalDayFor, opensAtFor, planSeason, questionsNeeded } from '../src/features/lig/seasonPlan';
import { makeResolver } from '../src/features/duello/match';
import { addDays } from '../src/lib/date';
import { mkQ } from './helpers/fixtures';

/** UTC ms → "SS:DD" (verilen UTC farkıyla) */
const clock = (ms: number, offsetH: number) => {
  const d = new Date(ms + offsetH * 3_600_000);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
};
const hm = (h: number, m: number) => h * 60 + m;

describe('gün batımı (iftar) hesabı', () => {
  it('ekinoks, ekvator, Greenwich: gün batımı ≈ 18:08 UTC (gün 12 sa 7 dk: kırılma + güneş çapı)', () => {
    const t = sunsetUtcMs(2027, 3, 20, 0, 0)!;
    expect(Math.abs(clock(t, 0) - hm(18, 8))).toBeLessThanOrEqual(4);
  });
  it('İstanbul 8 Şubat 2027: Türkiye kalıcı UTC+3 → öğle ≈ 13:16, gün batımı ≈ 18:27 (elle hesapla uyumlu)', () => {
    const t = sunsetUtcMs(2027, 2, 8, 41.01, 28.98)!;
    expect(clock(t, 3)).toBeGreaterThanOrEqual(hm(18, 15));
    expect(clock(t, 3)).toBeLessThanOrEqual(hm(18, 40));
  });
  it('Mekke 8 Şubat 2027 ≈ 18:18 (UTC+3)', () => {
    const t = sunsetUtcMs(2027, 2, 8, 21.42, 39.83)!;
    expect(Math.abs(clock(t, 3) - hm(18, 18))).toBeLessThanOrEqual(6);
  });
  it('Londra 21 Haziran 2027 ≈ 21:21 (UTC+1)', () => {
    const t = sunsetUtcMs(2027, 6, 21, 51.51, -0.13)!;
    expect(Math.abs(clock(t, 1) - hm(21, 21))).toBeLessThanOrEqual(6);
  });
  it('mevsim: İstanbul\'da kış akşamı yaz akşamından erken', () => {
    const winter = clock(sunsetUtcMs(2027, 1, 15, 41.01, 28.98)!, 3);
    const summer = clock(sunsetUtcMs(2027, 7, 15, 41.01, 28.98)!, 3);
    expect(summer - winter).toBeGreaterThan(120);
  });
  it('doğuya gidildikçe gün batımı UTC\'de erken', () => {
    const west = sunsetUtcMs(2027, 2, 8, 41, 10)!;
    const east = sunsetUtcMs(2027, 2, 8, 41, 40)!;
    expect(west - east).toBeGreaterThan(100 * 60_000);
  });
  it('kutup gecesinde null', () => {
    expect(sunsetUtcMs(2027, 12, 21, 80, 20)).toBeNull();
  });
  it('açılış anı = gün batımı + güvenlik payı; formatClock HH:MM', () => {
    const s = sunsetUtcMs(2027, 2, 8, 41.01, 28.98)!;
    expect(iftarOpenMs('2027-02-08', 41.01, 28.98)).toBe(s + IFTAR_SAFETY_MINUTES * 60_000);
    expect(formatClock(new Date(2027, 1, 8, 7, 5).getTime())).toBe('07:05');
  });
});

describe('şehirler', () => {
  it('kimlikler benzersiz, koordinatlar geçerli, her dilde ad var', () => {
    expect(new Set(CITIES.map((c) => c.id)).size).toBe(CITIES.length);
    for (const c of CITIES) {
      expect(c.lat).toBeGreaterThanOrEqual(-90);
      expect(c.lat).toBeLessThanOrEqual(90);
      expect(c.lon).toBeGreaterThanOrEqual(-180);
      expect(c.lon).toBeLessThanOrEqual(180);
      expect(c.name.tr && c.name.ar && c.name.en).toBeTruthy();
    }
    expect(cityById('istanbul')?.name.ar).toBe('إسطنبول');
    expect(cityById('yok')).toBeUndefined();
  });
  it('varsayılan şehir tahmini', () => {
    expect(guessCityId('Europe/Istanbul', 'en')).toBe('istanbul');
    expect(guessCityId('Asia/Riyadh', 'tr')).toBe('riyadh');
    expect(guessCityId(undefined, 'ar')).toBe('mecca');
    expect(guessCityId('Mars/Olympus', 'tr')).toBe('istanbul');
    for (const id of ['istanbul', 'mecca', 'london']) expect(cityById(id)).toBeDefined();
  });
});

const season: Season = { id: 's1', name: 'Ramazan Ligi', starts_on: '2027-02-08', ends_on: '2027-03-09', qadr_day_no: 26, lang: 'tr' };
const day = (n: number, final = false): LeagueDay => ({ day_no: n, question_ids: ['a', 'b', 'c', 'd', 'e'], opens_at: '2027-02-07T10:00:00Z', is_final: final });
const days = Array.from({ length: 30 }, (_, i) => day(i + 1, i + 1 === 26));
const NOW = Date.UTC(2027, 1, 10, 12, 0);

describe('sezon günü ve durum', () => {
  it('gün numarası ve uzunluk', () => {
    expect(dayNoFor('2027-02-08', '2027-02-08')).toBe(1);
    expect(dayNoFor('2027-02-08', '2027-03-09')).toBe(30);
    expect(dayNoFor('2027-02-08', '2027-02-01')).toBe(-6);
    expect(seasonLength(season)).toBe(30);
  });
  const base = { season, days, now: NOW, iftarAt: NOW + 3_600_000, doneDays: [] as number[] };
  it('sezondan önce / sonra', () => {
    expect(leagueStatus({ ...base, today: '2027-02-01' })).toEqual({ kind: 'not-started', startsOn: '2027-02-08' });
    expect(leagueStatus({ ...base, today: '2027-03-10' })).toEqual({ kind: 'ended' });
  });
  it('iftardan önce kilitli, sonra açık, oynanmışsa done', () => {
    expect(leagueStatus({ ...base, today: '2027-02-10' })).toMatchObject({ kind: 'locked', dayNo: 3, opensAt: NOW + 3_600_000 });
    expect(leagueStatus({ ...base, today: '2027-02-10', now: NOW + 4_000_000 })).toMatchObject({ kind: 'open', dayNo: 3 });
    expect(leagueStatus({ ...base, today: '2027-02-10', doneDays: [3] })).toMatchObject({ kind: 'done', dayNo: 3 });
  });
  it('finale günü işaretlenir; sunucuda set yoksa no-set; iftar hesaplanamazsa kilit yok', () => {
    expect(leagueStatus({ ...base, today: '2027-03-05', now: NOW + 9e9 })).toMatchObject({ kind: 'open', dayNo: 26, isFinal: true });
    expect(leagueStatus({ ...base, days: days.slice(0, 2), today: '2027-02-10' })).toEqual({ kind: 'no-set', dayNo: 3 });
    expect(leagueStatus({ ...base, today: '2027-02-10', iftarAt: null })).toMatchObject({ kind: 'open' });
  });
  it('bildirim planı: geçmişi atlar, sezon dışına çıkmaz, en çok max', () => {
    const open = (k: string) => Date.UTC(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8, 10), 15, 0);
    const plan = reminderPlan({ season, today: '2027-02-08', now: Date.UTC(2027, 1, 8, 16, 0), openMsFor: open, addDays, max: 3 });
    expect(plan.map((p) => p.dayNo)).toEqual([2, 3, 4]); // 1. günün 15:00'ı geçmişte
    const end = reminderPlan({ season, today: '2027-03-08', now: Date.UTC(2027, 2, 8, 0, 0), openMsFor: open, addDays });
    expect(end.map((p) => p.dayNo)).toEqual([29, 30]);
  });
});

describe('sezon planı', () => {
  const ids = Array.from({ length: 200 }, (_, i) => `q-tr-quran-${String(i + 1).padStart(6, '0')}`);
  it('finale günü ve gerekli soru sayısı', () => {
    expect(finalDayFor(27)).toBe(26);
    expect(questionsNeeded(30, 27)).toBe(29 * NORMAL_SET + FINAL_SET);
    expect(DEFAULT_QADR_NIGHT).toBe(27);
  });
  it('30 gün, finale 10 soru, sezon içinde tekrar yok, deterministik', () => {
    const plan = planSeason({ questionIds: ids, startsOn: '2027-02-08', seedKey: 'tr-2027' });
    expect(plan).toHaveLength(30);
    expect(plan.filter((d) => d.is_final).map((d) => d.day_no)).toEqual([26]);
    expect(plan[25].question_ids).toHaveLength(FINAL_SET);
    expect(plan[0].question_ids).toHaveLength(NORMAL_SET);
    const all = plan.flatMap((d) => d.question_ids);
    expect(new Set(all).size).toBe(all.length);
    expect(planSeason({ questionIds: [...ids].reverse(), startsOn: '2027-02-08', seedKey: 'tr-2027' })).toEqual(plan);
  });
  it('yetersiz soruda hata', () => {
    expect(() => planSeason({ questionIds: ids.slice(0, 100), startsOn: '2027-02-08', seedKey: 'x' })).toThrow(/Yetersiz/);
  });
  it('opens_at: yerel gün başlamadan hiçbir saat diliminde görünmez (UTC+14 gece yarısı)', () => {
    expect(opensAtFor('2027-02-08', 1)).toBe('2027-02-07T10:00:00.000Z');
    expect(opensAtFor('2027-02-08', 2)).toBe('2027-02-08T10:00:00.000Z');
  });
});

describe('set puanı ve kayıt', () => {
  const qs = Array.from({ length: 5 }, (_, i) => mkQ(i + 1, i % 4));
  const index = new Map(qs.map((q) => [q.id, q]));
  const resolve = makeResolver(index, 99);
  const qids = qs.map((q) => q.id);
  it('puan düellodakiyle aynı: doğru 100–200, yanlış/zaman aşımı 0', () => {
    const correct = qids.map((id) => resolve(id)!.answerIndex);
    const all = scoreRun(qids.map((_, i) => ({ choice: correct[i], ms: 0 })), qids, resolve);
    expect(all).toEqual({ score: 1000, correct: 5 });
    const mixed = scoreRun([{ choice: correct[0], ms: 5000 }, { choice: -1, ms: 10000 }, { choice: (correct[2] + 1) % 4, ms: 100 }], qids, resolve);
    expect(mixed).toEqual({ score: 150, correct: 1 });
  });
  it('en yüksek puan sunucu sınırının altında (5 soru ≤ 1000, finale 10 soru ≤ 2000 < 5000)', () => {
    expect(NORMAL_SET * 200).toBeLessThanOrEqual(5000);
    expect(FINAL_SET * 200).toBeLessThanOrEqual(5000);
  });
  it('cevaplar güvenle ayrıştırılır; tamamlanma', () => {
    expect(sanitizeAnswers([{ choice: 2, ms: 99999 }, { choice: 9, ms: 1 }, null, { choice: -1, ms: -5 }])).toEqual([
      { choice: 2, ms: 10000 },
      { choice: -1, ms: 0 },
    ]);
    expect(sanitizeAnswers('x')).toEqual([]);
    expect(isRunComplete([1, 2, 3, 4, 5], qids)).toBe(true);
    expect(isRunComplete([1, 2], qids)).toBe(false);
    expect(isRunComplete([], [])).toBe(false);
  });
  it('kayıt: ayrıştırma, tamamlanan günler, bekleyen skorlar', () => {
    expect(sanitizeLig(null)).toEqual(EMPTY_LIG);
    let s = sanitizeLig({ cityId: 'istanbul', reminders: true, seasons: { s1: { '3': { answers: [{ choice: 1, ms: 10 }], score: 420, submitted: false }, abc: {}, '4': { answers: [], submitted: true } } } });
    expect(s.cityId).toBe('istanbul');
    expect(doneDays(s, 's1')).toEqual([3]);
    expect(pendingScores(s)).toEqual([{ seasonId: 's1', dayNo: 3, score: 420 }]);
    s = withDay(s, 's1', 3, { answers: [], score: 420, submitted: true });
    expect(pendingScores(s)).toEqual([]);
    expect(sanitizeLig({ seasons: { s1: { '3': { score: -4, answers: 'x' } } } }).seasons.s1['3']).toEqual({ answers: [], submitted: false });
  });
});
