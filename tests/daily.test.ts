import { describe, expect, it } from 'vitest';
import {
  DAILY_COUNT,
  EMPTY_STREAK,
  completeDay,
  currentStreak,
  dailyNumber,
  dailyQuestionIds,
  dailySeed,
  emojiGrid,
  repairStreak,
  shareText,
  streakStatus,
} from '../src/features/gunluk/daily';
import { sanitizeDaily } from '../src/features/gunluk/state';
import { addDays, dateKey, dayNumber, msUntilMidnight } from '../src/lib/date';
import { mkQ } from './helpers/fixtures';

const pool = (n: number) => Array.from({ length: n }, (_, i) => mkQ(i + 1, i % 4));

describe('tarih yardımcıları', () => {
  it('dateKey yerel gün', () => expect(dateKey(new Date(2026, 9, 8, 23, 59))).toBe('2026-10-08'));
  it('addDays ay/yıl/artık yıl sınırları', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2027-03-01', -1)).toBe('2027-02-28');
  });
  it('dayNumber ardışık ve yaz saatinden bağımsız', () => {
    expect(dayNumber('2026-03-29') - dayNumber('2026-03-28')).toBe(1);
    expect(dayNumber('2026-10-25') - dayNumber('2026-10-24')).toBe(1);
  });
  it('gece yarısına kalan süre pozitif ve ≤ 24 sa', () => {
    const ms = msUntilMidnight(new Date(2026, 9, 8, 18, 30));
    expect(ms).toBe(5.5 * 3600_000);
  });
});

describe('dailyQuestionIds', () => {
  const p = pool(40);
  it('aynı gün aynı sorular, havuz sırasından bağımsız', () => {
    const a = dailyQuestionIds(p, '2026-10-08');
    const b = dailyQuestionIds([...p].reverse(), '2026-10-08');
    expect(a).toEqual(b);
    expect(a).toHaveLength(DAILY_COUNT);
    expect(new Set(a).size).toBe(DAILY_COUNT);
  });
  it('farklı günler farklı sorular; bir tur içinde tekrar yok', () => {
    const days = Array.from({ length: 8 }, (_, i) => addDays('2026-10-01', i)); // #1..#8 = tam bir tur
    const all = days.flatMap((d) => dailyQuestionIds(p, d));
    expect(new Set(all).size).toBe(all.length); // 8*5 = 40 = havuz
  });
  it('tur sınırını aşınca da gün içinde tekrar yok', () => {
    for (let i = 0; i < 60; i++) {
      const ids = dailyQuestionIds(pool(7), addDays('2026-10-01', i));
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids).toHaveLength(5);
    }
  });
  it('küçük havuz: elindekini verir, boş havuz: boş', () => {
    expect(dailyQuestionIds(pool(3), '2026-10-08')).toHaveLength(3);
    expect(dailyQuestionIds([], '2026-10-08')).toEqual([]);
  });
  it('gün numarası #1 başlangıcı ve şık tohumu kararlı', () => {
    expect(dailyNumber('2026-10-01')).toBe(1);
    expect(dailyNumber('2026-10-08')).toBe(8);
    expect(dailySeed('2026-10-08', 'tr')).toBe(dailySeed('2026-10-08', 'tr'));
    expect(dailySeed('2026-10-08', 'tr')).not.toBe(dailySeed('2026-10-09', 'tr'));
  });
});

describe('seri', () => {
  const T = '2026-10-10';
  it('ilk tamamlama 1', () => {
    expect(streakStatus(EMPTY_STREAK, T)).toBe('new');
    expect(completeDay(EMPTY_STREAK, T)).toEqual({ streak: 1, best: 1, lastDay: T });
  });
  it('ardışık günler artar, aynı gün iki kez sayılmaz', () => {
    let s = completeDay(EMPTY_STREAK, '2026-10-08');
    s = completeDay(s, '2026-10-09');
    s = completeDay(s, '2026-10-10');
    expect(s.streak).toBe(3);
    expect(completeDay(s, '2026-10-10')).toBe(s);
    expect(streakStatus(s, '2026-10-10')).toBe('done');
    expect(streakStatus(s, '2026-10-11')).toBe('active');
  });
  it('1 gün kaçırınca repairable, 2+ gün kaçırınca broken ve 1\'den başlar', () => {
    const s = { streak: 5, best: 5, lastDay: '2026-10-08' };
    expect(streakStatus(s, '2026-10-10')).toBe('repairable');
    expect(currentStreak(s, '2026-10-10')).toBe(5);
    expect(streakStatus(s, '2026-10-11')).toBe('broken');
    expect(currentStreak(s, '2026-10-11')).toBe(0);
    expect(completeDay(s, '2026-10-11')).toEqual({ streak: 1, best: 5, lastDay: '2026-10-11' });
  });
  it('repairStreak yalnızca repairable iken çalışır ve seriyi korur', () => {
    const s = { streak: 5, best: 5, lastDay: '2026-10-08' };
    const fixed = repairStreak(s, '2026-10-10');
    expect(fixed.lastDay).toBe('2026-10-09');
    expect(completeDay(fixed, '2026-10-10').streak).toBe(6);
    expect(repairStreak(s, '2026-10-12')).toBe(s);
  });
});

describe('paylaşım ve kayıt', () => {
  it('emoji ızgarası ve metin', () => {
    expect(emojiGrid([true, true, false, true, true])).toBe('🟩🟩🟥🟩🟩');
    const txt = shareText({ header: 'Sual Arena #8 4/5', correct: [true, false], streak: 7, url: 'https://x' });
    expect(txt).toBe('Sual Arena #8 4/5 🔥7\n🟩🟥\nhttps://x');
    expect(shareText({ header: 'H', correct: [true], streak: 0, url: 'u' })).toBe('H\n🟩\nu');
  });
  it('sanitizeDaily bozuk veriyi düzeltir', () => {
    expect(sanitizeDaily(null).streak).toEqual(EMPTY_STREAK);
    const s = sanitizeDaily({ streak: { streak: -4, best: 'x', lastDay: 'dün' }, results: { bad: {}, '2026-10-08': { choices: [1], correct: [true] } }, progress: { day: 'x' } });
    expect(s.streak).toEqual({ streak: 0, best: 0, lastDay: null });
    expect(Object.keys(s.results)).toEqual(['2026-10-08']);
    expect(s.progress).toBeNull();
  });
});
