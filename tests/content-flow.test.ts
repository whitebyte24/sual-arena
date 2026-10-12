import { describe, expect, it } from 'vitest';
import { mergeSeen } from '../src/features/duello/seenLogic';
import { NOTE_MAX, QUEUE_CAP, buildReport, enqueue, sanitizeQueue, type Report } from '../src/features/report/logic';
import { applyDecisions, approvedCounts } from '../src/content/review';
import type { Question } from '../src/content/schema';
import { pickQuestions } from '../src/features/duello/match';
import { mkQ } from './helpers/fixtures';

const item = (n: number, status: Question['review_status'] = 'draft') => ({ ...mkQ(n), review_status: status });

describe('applyDecisions (insan editör onayı)', () => {
  const items = [item(1), item(2), item(3, 'approved')];
  it('yalnızca review_status değişir', () => {
    const r = applyDecisions(items, { 'q-tr-quran-000001': 'approved', 'q-tr-quran-000002': 'rejected' });
    expect(r.changed).toEqual(['q-tr-quran-000001', 'q-tr-quran-000002']);
    expect(r.items[0]).toEqual({ ...items[0], review_status: 'approved' });
    expect(r.items[1].review_status).toBe('rejected');
    expect(r.items[2]).toBe(items[2]);
  });
  it('aynı durum "değişti" sayılmaz; girdi değişmez', () => {
    const r = applyDecisions(items, { 'q-tr-quran-000003': 'approved' });
    expect(r.changed).toEqual([]);
    expect(items[0].review_status).toBe('draft');
  });
  it('bilinmeyen kimlik ve geçersiz durum sessizce yutulmaz', () => {
    const r = applyDecisions(items, { 'q-xx-000001': 'approved', 'q-tr-quran-000001': 'onayli' as never });
    expect(r.unknown).toEqual(['q-xx-000001']);
    expect(r.invalid).toEqual(['q-tr-quran-000001']);
    expect(r.changed).toEqual([]);
    expect(r.items[0].review_status).toBe('draft');
  });
  it('onaylı sayımı dil/kategori bazında', () => {
    expect(approvedCounts([...items, item(4, 'approved')])).toEqual({ 'tr/quran': 2 });
  });
});

describe('hatalı soru bildirimi', () => {
  const base = { questionId: 'q-tr-quran-000001', lang: 'tr' as const, reason: 'typo' };
  it('geçerli girdiyi temizler, notu kırpar ve sınırlar', () => {
    expect(buildReport({ ...base, note: '  yazım  ' })).toEqual({ question_id: 'q-tr-quran-000001', lang: 'tr', reason: 'typo', note: 'yazım' });
    expect(buildReport({ ...base, note: 'x'.repeat(900) })!.note).toHaveLength(NOTE_MAX);
    expect(buildReport({ ...base, note: '   ' })).toEqual({ question_id: 'q-tr-quran-000001', lang: 'tr', reason: 'typo' });
  });
  it('geçersiz kimlik veya neden → null', () => {
    expect(buildReport({ ...base, reason: 'spam' })).toBeNull();
    expect(buildReport({ ...base, questionId: "q-1'; drop table" })).toBeNull();
    expect(buildReport({ ...base, questionId: 'q-tr-quran-12' })).toBeNull();
  });
  it('kuyruk: aynı soru için son kayıt kalır, sınır aşılınca eskiler atılır', () => {
    const r = (n: number, reason: Report['reason'] = 'typo'): Report => ({ question_id: `q-tr-quran-${String(n).padStart(6, '0')}`, lang: 'tr', reason });
    expect(enqueue([r(1), r(2)], r(1, 'wrong_answer')).map((x) => [x.question_id.slice(-1), x.reason])).toEqual([
      ['2', 'typo'],
      ['1', 'wrong_answer'],
    ]);
    let q: Report[] = [];
    for (let i = 1; i <= QUEUE_CAP + 10; i++) q = enqueue(q, r(i));
    expect(q).toHaveLength(QUEUE_CAP);
    expect(q[q.length - 1].question_id).toBe(`q-tr-quran-${String(QUEUE_CAP + 10).padStart(6, '0')}`);
  });
  it('bozuk kuyruk kaydı güvenle okunur', () => {
    expect(sanitizeQueue('x')).toEqual([]);
    expect(sanitizeQueue([null, 5, { question_id: 'bad' }, { question_id: 'q-tr-quran-000001', lang: 'tr', reason: 'typo' }])).toHaveLength(1);
  });
});

describe('görülen sorular', () => {
  it('birleştirir, tekrarı tek kayda indirir, en yeni sonda', () => {
    expect(mergeSeen(['a', 'b', 'c'], ['b', 'd'])).toEqual(['a', 'c', 'b', 'd']);
  });
  it('sınırı aşınca en eskileri atar', () => {
    expect(mergeSeen(['a', 'b', 'c'], ['d', 'e'], 4)).toEqual(['b', 'c', 'd', 'e']);
  });
  it('görülmemişler pickQuestions ile öne alınır', () => {
    const pool = Array.from({ length: 10 }, (_, i) => mkQ(i + 1));
    const seen = pool.slice(0, 7).map((q) => q.id);
    const picked = pickQuestions(pool, 3, 5, seen);
    expect(picked.every((id) => !seen.includes(id))).toBe(true);
  });
});
