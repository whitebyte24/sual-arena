import { describe, expect, it } from 'vitest';
import { planBotAnswer } from '../src/features/duello/bot';
import {
  advanceTo,
  allAnswered,
  createMatch,
  displayQuestion,
  hasAnswered,
  isFinished,
  makeResolver,
  markLeft,
  pickQuestions,
  points,
  recordAnswer,
  standings,
} from '../src/features/duello/match';
import { isRoomCode, makeRoomCode, pairingFor } from '../src/features/duello/pairing';
import { seededRng } from '../src/lib/rng';
import { mkQ } from './helpers/fixtures';

const QS = Array.from({ length: 12 }, (_, i) => mkQ(i + 1, (i % 4) as number));
const INDEX = new Map(QS.map((q) => [q.id, q]));
const A = { id: 'a', name: 'Ali' };
const B = { id: 'b', name: 'Büşra' };
const init = (qids = QS.slice(0, 3).map((q) => q.id)) => ({ matchId: 'm1', hostId: 'a', players: [A, B], qids, seed: 7 });

describe('puan', () => {
  it('yanlış 0, doğru 100–200 arası hızla artar', () => {
    expect(points(false, 0)).toBe(0);
    expect(points(true, 0)).toBe(200);
    expect(points(true, 5000)).toBe(150);
    expect(points(true, 10_000)).toBe(100);
    expect(points(true, 99_999)).toBe(100);
  });
});

describe('displayQuestion', () => {
  it('her tohumda doğru şıkkı korur', () => {
    for (let seed = 0; seed < 50; seed++) {
      for (const q of QS) {
        const d = displayQuestion(q, seed);
        expect(d.options[d.answerIndex]).toBe(q.options[q.answer_index]);
        expect([...d.options].sort()).toEqual([...q.options].sort());
      }
    }
  });
  it('aynı tohumda aynı sıra (iki cihaz aynı görür)', () => {
    expect(displayQuestion(QS[0], 99)).toEqual(displayQuestion(QS[0], 99));
  });
  it('cevap anahtarı şık sırasını dağıtır (hep aynı yerde değil)', () => {
    const positions = new Set(Array.from({ length: 40 }, (_, s) => displayQuestion(QS[0], s).answerIndex));
    expect(positions.size).toBeGreaterThan(1);
  });
});

describe('pickQuestions', () => {
  it('istenen sayıyı seçer, görülmemişleri öne alır', () => {
    const seen = QS.slice(0, 6).map((q) => q.id);
    const picked = pickQuestions(QS, 5, 3, seen);
    expect(picked).toHaveLength(5);
    expect(picked.some((id) => seen.includes(id))).toBe(false);
    expect(new Set(picked).size).toBe(5);
  });
  it('havuz küçükse olanı verir', () => expect(pickQuestions(QS.slice(0, 2), 5, 1)).toHaveLength(2));
});

describe('MatchState', () => {
  it('çift cevap ve yanlış indeks yok sayılır; geçersiz şık -1 olur', () => {
    let s = createMatch(init());
    s = recordAnswer(s, 'a', 0, { choice: 2, ms: 1000 });
    const again = recordAnswer(s, 'a', 0, { choice: 3, ms: 10 });
    expect(again).toBe(s);
    expect(recordAnswer(s, 'b', 1, { choice: 0, ms: 1 })).toBe(s);
    expect(recordAnswer(s, 'zz', 0, { choice: 0, ms: 1 })).toBe(s);
    const bad = recordAnswer(s, 'b', 0, { choice: 9, ms: -5 });
    expect(bad.answers.b[0]).toEqual({ choice: -1, ms: 0 });
  });
  it('allAnswered ve advanceTo (cevapsızlar süre dolmuş sayılır)', () => {
    let s = createMatch(init());
    expect(allAnswered(s)).toBe(false);
    s = recordAnswer(s, 'a', 0, { choice: 0, ms: 100 });
    s = advanceTo(s, 2);
    expect(s.index).toBe(2);
    expect(s.answers.b[0]).toEqual({ choice: -1, ms: 10_000 });
    expect(s.answers.a[1]).toEqual({ choice: -1, ms: 10_000 });
    expect(advanceTo(s, 1)).toBe(s); // geriye gitmez
    expect(isFinished(advanceTo(s, 99))).toBe(true);
  });
  it('standings: puan, eşitlikte aynı sıra', () => {
    const resolve = makeResolver(INDEX, 7);
    let s = createMatch(init());
    const correct = (qi: number) => resolve(s.qids[qi])!.answerIndex;
    s = recordAnswer(s, 'a', 0, { choice: correct(0), ms: 0 });
    s = recordAnswer(s, 'b', 0, { choice: correct(0), ms: 0 });
    let st = standings(s, resolve);
    expect(st.map((x) => x.rank)).toEqual([1, 1]);
    s = advanceTo(s, 1);
    s = recordAnswer(s, 'a', 1, { choice: correct(1), ms: 2000 });
    st = standings(s, resolve);
    expect(st[0].player.id).toBe('a');
    expect(st.map((x) => x.rank)).toEqual([1, 2]);
    expect(st[0].correct).toBe(2);
  });
  it('markLeft: 1v1 ayrılınca maç biter (forfeit), host devri', () => {
    const s = markLeft(createMatch(init()), 'b');
    expect(isFinished(s)).toBe(true);
    expect(s.forfeit).toBe(true);
    const three = createMatch({ ...init(), players: [A, B, { id: 'c', name: 'C' }] });
    const h = markLeft(three, 'a');
    expect(h.hostId).toBe('b');
    expect(isFinished(h)).toBe(false);
    expect(hasAnswered(h, 'a')).toBe(true);
  });
});

describe('bot', () => {
  it('cevap gecikmesi süre içinde, şık geçerli', () => {
    const rng = seededRng(5);
    const d = displayQuestion(QS[0], 1);
    for (let i = 0; i < 200; i++) {
      const p = planBotAnswer(d, rng);
      expect(p.delayMs).toBeGreaterThanOrEqual(1500);
      expect(p.delayMs).toBeLessThan(10_000);
      expect([0, 1, 2, 3]).toContain(p.choice);
    }
  });
  it('kolay soruda doğruluk ~%80', () => {
    const rng = seededRng(11);
    const d = displayQuestion(QS[0], 1);
    let ok = 0;
    for (let i = 0; i < 2000; i++) if (planBotAnswer(d, rng).choice === d.answerIndex) ok++;
    expect(ok / 2000).toBeGreaterThan(0.74);
    expect(ok / 2000).toBeLessThan(0.86);
  });
});

describe('eşleştirme ve oda kodu', () => {
  const e = (id: string, joinedAt: number) => ({ id, name: id, joinedAt });
  it('ardışık çiftler, düşük sıra host', () => {
    const q = [e('c', 30), e('a', 10), e('b', 20), e('d', 40), e('x', 50)];
    expect(pairingFor(q, 'a')).toMatchObject({ partner: { id: 'b' }, host: true });
    expect(pairingFor(q, 'b')).toMatchObject({ partner: { id: 'a' }, host: false });
    expect(pairingFor(q, 'c')).toMatchObject({ partner: { id: 'd' }, host: true });
    expect(pairingFor(q, 'x')).toBeNull(); // tek kalan
    expect(pairingFor(q, 'yok')).toBeNull();
  });
  it('aynı zamanda katılanlar id ile sıralanır', () => {
    const q = [e('b', 5), e('a', 5)];
    expect(pairingFor(q, 'a')?.host).toBe(true);
  });
  it('oda kodu 6 hane, 0 ile başlamaz', () => {
    const rng = seededRng(3);
    for (let i = 0; i < 200; i++) expect(isRoomCode(makeRoomCode(rng))).toBe(true);
    expect(isRoomCode('012345')).toBe(false);
    expect(isRoomCode('12345')).toBe(false);
    expect(isRoomCode('12345a')).toBe(false);
  });
});
