import { describe, expect, it } from 'vitest';
import { lintCards, lintQuestions, lintSource } from '../src/content/lint';
import { SURAHS, nameMatches } from '../src/content/quranData';
import type { Card, Question } from '../src/content/schema';

const q = (over: Partial<Question> = {}): Question => ({
  id: 'q-tr-quran-000001',
  lang: 'tr',
  category: 'quran',
  difficulty: 1,
  question: 'Kur’an’ın ilk suresi hangisidir?',
  options: ['Fâtiha', 'Bakara', 'Nâs', 'Kevser'],
  answer_index: 0,
  source: 'Fâtiha 1/1',
  explanation: 'Mushafın ilk suresi Fâtiha’dır.',
  review_status: 'draft',
  ...over,
});

describe('Kur’an verisi', () => {
  it('114 sure, 6236 ayet', () => {
    expect(SURAHS).toHaveLength(114);
    expect(SURAHS.reduce((a, s) => a + s.verses, 0)).toBe(6236);
  });
  it('ad–numara eşlemesi', () => {
    expect(nameMatches('Bakara', 2)).toBe(true);
    expect(nameMatches('Al-Baqarah', 2)).toBe(true);
    expect(nameMatches('البقرة', 2)).toBe(true);
    expect(nameMatches('Bakara', 3)).toBe(false);
  });
});

describe('kaynak denetimi', () => {
  it('doğru referans hata vermez', () => {
    expect(lintSource('x', 'Bakara 2/255')).toEqual([]);
    expect(lintSource('x', 'Kur’an-ı Kerim, Kevser 108/1-3; Âl-i İmrân 3/42-45')).toEqual([]);
  });
  it('ayet sayısını aşan referans hata', () => {
    expect(lintSource('x', 'Kevser 108/4').some((i) => i.severity === 'error')).toBe(true);
    expect(lintSource('x', 'Bakara 2/300').some((i) => i.severity === 'error')).toBe(true);
  });
  it('ad–numara uyuşmazlığı hata', () => {
    expect(lintSource('x', 'Bakara 3/10').some((i) => i.severity === 'error')).toBe(true);
  });
  it('Kur’an dışı kaynaklara dokunmaz', () => {
    expect(lintSource('x', 'İbn Hişâm, es-Sîre')).toEqual([]);
    expect(lintSource('x', 'Buhârî, Îmân')).toEqual([]);
  });
});

describe('soru denetimi', () => {
  it('"hepsi/hiçbiri" şıkkı hata', () => {
    expect(lintQuestions([q({ options: ['Fâtiha', 'Bakara', 'Hepsi', 'Kevser'] })]).some((i) => i.severity === 'error')).toBe(true);
  });
  it('İngilizce metinde Türkçe harf hata', () => {
    expect(lintQuestions([q({ lang: 'en', id: 'q-en-quran-000001' })]).some((i) => i.severity === 'error')).toBe(true);
  });
  it('Arapça soru Arapça yazı içermeli', () => {
    expect(lintQuestions([q({ lang: 'ar', id: 'q-ar-quran-000001' })]).some((i) => i.severity === 'error')).toBe(true);
  });
  it('temiz soru hata üretmez', () => {
    expect(lintQuestions([q()]).filter((i) => i.severity === 'error')).toEqual([]);
  });
});

describe('kart denetimi', () => {
  const c = (id: string, target: string): Card => ({ id, lang: 'tr', level: 'child', target, forbidden: ['a', 'b', 'c', 'd'], review_status: 'draft' });
  it('aynı hedef iki kez → hata', () => {
    expect(lintCards([c('c-tr-000001', 'Kâbe'), c('c-tr-000002', 'kâbe')]).some((i) => i.severity === 'error')).toBe(true);
  });
});
