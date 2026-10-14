import { describe, expect, it } from 'vitest';
import { acceptCards, acceptQuestions, parseManifest } from '../src/content/packs';

const hash = 'a'.repeat(64);
const manifest = (over: Record<string, unknown> = {}) => ({
  schema: 1,
  version: 3,
  packs: { tr: { questions: { file: 'q.tr.abc12345.json', sha256: hash, count: 10 }, cards: { file: 'c.tr.abc12345.json', sha256: hash, count: 5 } } },
  ...over,
});

const q = (n: number, over: Record<string, unknown> = {}) => ({
  id: `q-tr-quran-${String(n).padStart(6, '0')}`,
  lang: 'tr',
  category: 'quran',
  difficulty: 1,
  question: 'Soru?',
  options: ['A', 'B', 'C', 'D'],
  answer_index: 0,
  source: 'Fâtiha 1/1',
  explanation: 'Açıklama',
  review_status: 'approved',
  ...over,
});
const card = (n: number, over: Record<string, unknown> = {}) => ({
  id: `c-tr-${String(n).padStart(6, '0')}`,
  lang: 'tr',
  level: 'child',
  target: 'Kâbe',
  forbidden: ['Mekke', 'tavaf', 'hac', 'kıble'],
  review_status: 'approved',
  ...over,
});

describe('parseManifest', () => {
  it('geçerli manifest', () => {
    const m = parseManifest(manifest());
    expect(m?.version).toBe(3);
    expect(m?.packs.tr?.questions?.count).toBe(10);
  });
  it('daha yeni şema veya bozuk yapı → null', () => {
    expect(parseManifest(manifest({ schema: 2 }))).toBeNull();
    expect(parseManifest(manifest({ version: -1 }))).toBeNull();
    expect(parseManifest(null)).toBeNull();
    expect(parseManifest({ schema: 1, version: 1 })).toBeNull();
  });
  it('yol gezinmesi yapan dosya adı ve bozuk hash atılır', () => {
    const bad = parseManifest(manifest({ packs: { tr: { questions: { file: '../x.json', sha256: hash, count: 1 }, cards: { file: 'c.json', sha256: 'zz', count: 1 } } } }));
    expect(bad?.packs.tr?.questions).toBeUndefined();
    expect(bad?.packs.tr?.cards).toBeUndefined();
  });
});

describe('acceptQuestions', () => {
  it('geçerli paket kabul edilir', () => {
    expect(acceptQuestions('tr', [q(1), q(2)], 2)).toHaveLength(2);
  });
  it('taslak, yanlış dil, bozuk veya tekrar eden öğe varsa tümü reddedilir', () => {
    expect(acceptQuestions('tr', [q(1), q(2, { review_status: 'draft' })], 0)).toBeNull();
    expect(acceptQuestions('tr', [q(1, { lang: 'en', id: 'q-en-quran-000001' })], 0)).toBeNull();
    expect(acceptQuestions('tr', [q(1), q(2, { options: ['A', 'A', 'C', 'D'] })], 0)).toBeNull();
    expect(acceptQuestions('tr', [q(1), q(1)], 0)).toBeNull();
  });
  it('gömülü içeriğin yarısından küçük paket reddedilir (yanlışlıkla eksik yayın)', () => {
    expect(acceptQuestions('tr', [q(1), q(2)], 10)).toBeNull();
    expect(acceptQuestions('tr', [q(1), q(2), q(3), q(4), q(5)], 10)).toHaveLength(5);
  });
  it('dizi olmayan / boş paket reddedilir', () => {
    expect(acceptQuestions('tr', { a: 1 }, 0)).toBeNull();
    expect(acceptQuestions('tr', [], 0)).toBeNull();
  });
});

describe('acceptCards', () => {
  it('geçerli ve geçersiz kartlar', () => {
    expect(acceptCards('tr', [card(1)], 0)).toHaveLength(1);
    expect(acceptCards('tr', [card(1, { forbidden: ['Kâbe', 'b', 'c', 'd'] })], 0)).toBeNull();
    expect(acceptCards('tr', [card(1, { review_status: 'draft' })], 0)).toBeNull();
  });
});
