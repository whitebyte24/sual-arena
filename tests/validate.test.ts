import { describe, expect, it } from 'vitest';
import { findDuplicates, normalize, validateCard, validateQuestion } from '../src/content/validate';

const q = {
  id: 'q-tr-quran-000001',
  lang: 'tr',
  category: 'quran',
  difficulty: 1,
  question: 'Soru?',
  options: ['A', 'B', 'C', 'D'],
  answer_index: 0,
  source: 'Kaynak',
  explanation: 'Açıklama',
  review_status: 'draft',
};
const c = {
  id: 'c-tr-000001',
  lang: 'tr',
  level: 'child',
  target: 'Kâbe',
  forbidden: ['Mekke', 'hac', 'tavaf', 'kıble'],
  review_status: 'draft',
};

describe('validateQuestion', () => {
  it('geçerli soruyu kabul eder', () => expect(validateQuestion(q)).toEqual([]));
  it('3 şıkkı reddeder', () => expect(validateQuestion({ ...q, options: ['A', 'B', 'C'] })).not.toEqual([]));
  it('aynı iki şıkkı reddeder', () => expect(validateQuestion({ ...q, options: ['A', 'a', 'C', 'D'] })).not.toEqual([]));
  it('boş kaynağı reddeder', () => expect(validateQuestion({ ...q, source: ' ' })).not.toEqual([]));
  it('answer_index 4 reddeder', () => expect(validateQuestion({ ...q, answer_index: 4 })).not.toEqual([]));
  it('id/dil uyuşmazlığını yakalar', () => expect(validateQuestion({ ...q, lang: 'en' })).not.toEqual([]));
  it('uzun soruyu reddeder', () => expect(validateQuestion({ ...q, question: 'x'.repeat(161) })).not.toEqual([]));
});

describe('validateCard', () => {
  it('geçerli kartı kabul eder', () => expect(validateCard(c)).toEqual([]));
  it('hedefin parçası olan yasaklıyı reddeder', () =>
    expect(validateCard({ ...c, target: 'Hac', forbidden: ['Hacı', 'umre', 'tavaf', 'kıble'] })).not.toEqual([]));
  it('tekrar eden yasaklıyı reddeder', () =>
    expect(validateCard({ ...c, forbidden: ['Mekke', 'mekke', 'tavaf', 'kıble'] })).not.toEqual([]));
  it('4 yasaklı şartı', () => expect(validateCard({ ...c, forbidden: ['a', 'b', 'c'] })).not.toEqual([]));
});

describe('yardımcılar', () => {
  it('Arapça harekeleri siler', () => expect(normalize('سُؤَال')).toBe(normalize('سؤال')));
  it('TR büyük İ/I doğru küçülür', () => expect(normalize('IŞIK İNCİ')).toBe('ışık inci'));
  it('tekrarları bulur', () =>
    expect(
      findDuplicates([
        { id: 'a', lang: 'tr', text: 'Soru?' },
        { id: 'b', lang: 'tr', text: 'soru?' },
      ]),
    ).toHaveLength(1));
});
