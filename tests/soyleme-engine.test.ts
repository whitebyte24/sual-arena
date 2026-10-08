import { describe, expect, it } from 'vitest';
import type { Card } from '../src/content/schema';
import {
  answer,
  canPass,
  createGame,
  currentCard,
  eligibleCards,
  nextTurn,
  passesUsed,
  remainingMs,
  sanitizeSettings,
  scores,
  seenIdsOf,
  setResult,
  shuffle,
  startTurn,
  tick,
  winner,
  type GameState,
  type Settings,
} from '../src/features/soyleme/engine';

const card = (n: number, level: Card['level'] = 'child', lang: Card['lang'] = 'tr'): Card => ({
  id: `c-${lang}-${String(n).padStart(6, '0')}`,
  lang,
  level,
  target: `hedef${n}`,
  forbidden: ['a', 'b', 'c', 'd'],
  review_status: 'approved',
});
const CARDS = Array.from({ length: 12 }, (_, i) => card(i + 1));
const S: Settings = {
  teamNames: ['A', 'B'],
  roundSeconds: 60,
  turnsPerTeam: 2,
  passLimit: 2,
  level: 'mixed',
  lang: 'tr',
};
const start = (settings = S, seen: string[] = [], seed = 1): GameState => createGame(CARDS, settings, seen, seed);
const T0 = 1_000_000;

describe('deste', () => {
  it('shuffle deterministik ve eleman kaybetmez', () => {
    const [a] = shuffle([1, 2, 3, 4, 5, 6], 42);
    const [b] = shuffle([1, 2, 3, 4, 5, 6], 42);
    expect(a).toEqual(b);
    expect([...a].sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });
  it('dil ve seviyeye göre süzer', () => {
    const mixed = [card(1, 'child'), card(2, 'teen'), card(3, 'child', 'ar')];
    expect(eligibleCards(mixed, { lang: 'tr', level: 'child' })).toHaveLength(1);
    expect(eligibleCards(mixed, { lang: 'tr', level: 'mixed' })).toHaveLength(2);
  });
  it('görülmüş kartlar destenin sonuna gider', () => {
    const seen = CARDS.slice(0, 6).map((c) => c.id);
    const s = start(S, seen);
    const firstSix = s.deck.slice(0, 6).map((c) => c.id);
    expect(firstSix.some((id) => seen.includes(id))).toBe(false);
    expect(s.deck).toHaveLength(12);
  });
});

describe('tur akışı', () => {
  it('doğru +1, yasaklı −1, pas 0', () => {
    let s = startTurn(start(), T0);
    s = answer(s, 'correct', T0 + 1000);
    s = answer(s, 'correct', T0 + 2000);
    s = answer(s, 'taboo', T0 + 3000);
    s = answer(s, 'pass', T0 + 4000);
    expect(scores(s)).toEqual([1, 0]);
  });
  it('tur puanı eksiye düşmez', () => {
    let s = startTurn(start(), T0);
    s = answer(s, 'taboo', T0 + 1);
    s = answer(s, 'taboo', T0 + 2);
    expect(scores(s)).toEqual([0, 0]);
  });
  it('pas sınırı uygulanır, 0 sınırsızdır', () => {
    let s = startTurn(start(), T0);
    s = answer(s, 'pass', T0 + 1);
    s = answer(s, 'pass', T0 + 2);
    expect(canPass(s)).toBe(false);
    const before = s.cursor;
    s = answer(s, 'pass', T0 + 3);
    expect(s.cursor).toBe(before);
    expect(passesUsed(s)).toBe(2);
    let u = startTurn(start({ ...S, passLimit: 0 }), T0);
    for (let i = 0; i < 8; i++) u = answer(u, 'pass', T0 + i);
    expect(canPass(u)).toBe(true);
  });
  it('süre dolunca tur biter, ekrandaki kart sonraki tura kalır', () => {
    let s = startTurn(start(), T0);
    s = answer(s, 'correct', T0 + 1000);
    const shown = currentCard(s)!.id;
    expect(remainingMs(s, T0 + 59_000)).toBe(1000);
    s = tick(s, T0 + 60_000);
    expect(s.phase).toBe('summary');
    expect(seenIdsOf(s)).not.toContain(shown);
    s = nextTurn(s);
    s = startTurn(s, T0 + 70_000);
    expect(currentCard(s)!.id).toBe(shown);
  });
  it('süre bittikten sonraki basış puanlanmaz', () => {
    let s = startTurn(start(), T0);
    s = answer(s, 'correct', T0 + 60_001);
    expect(s.phase).toBe('summary');
    expect(scores(s)).toEqual([0, 0]);
  });
  it('takımlar sırayla oynar ve oyun biter', () => {
    let s = start();
    const teams: number[] = [];
    for (let i = 0; i < 4; i++) {
      s = startTurn(s, T0 + i * 100_000);
      teams.push(s.turns[s.turnIndex].team);
      s = answer(s, i % 2 === 0 ? 'correct' : 'pass', T0 + i * 100_000 + 10);
      s = tick(s, T0 + i * 100_000 + 60_000);
      s = nextTurn(s);
    }
    expect(teams).toEqual([0, 1, 0, 1]);
    expect(s.phase).toBe('finished');
    expect(scores(s)).toEqual([2, 0]);
    expect(winner(s)).toBe(0);
  });
  it('beraberlik', () => {
    expect(winner(start())).toBe('draw');
  });
  it('hakem düzeltmesi skoru günceller', () => {
    let s = startTurn(start(), T0);
    s = answer(s, 'correct', T0 + 1);
    s = tick(s, T0 + 60_000);
    expect(scores(s)).toEqual([1, 0]);
    s = setResult(s, 0, 0, 'taboo');
    expect(scores(s)).toEqual([0, 0]);
  });
  it('geçersiz fazlarda durum değişmez', () => {
    const s = start();
    expect(answer(s, 'correct', T0)).toBe(s);
    expect(nextTurn(s)).toBe(s);
    expect(tick(s, T0)).toBe(s);
  });
  it('deste bitince karıştırılıp devam eder', () => {
    let s = startTurn(start({ ...S, passLimit: 0 }), T0);
    for (let i = 0; i < 30; i++) s = answer(s, 'pass', T0 + i);
    expect(s.phase).toBe('playing');
    expect(currentCard(s)).not.toBeNull();
  });
});

describe('sanitizeSettings', () => {
  it('sınırları zorlar ve bozuk girdiyi düzeltir', () => {
    const out = sanitizeSettings(
      { roundSeconds: 9999, turnsPerTeam: 0, passLimit: -3, teamNames: ['  ', 'x'.repeat(40)], level: 'zzz' as never },
      S,
    );
    expect(out.roundSeconds).toBe(120);
    expect(out.turnsPerTeam).toBe(1);
    expect(out.passLimit).toBe(0);
    expect(out.teamNames[0]).toBe('A');
    expect(out.teamNames[1]).toHaveLength(16);
    expect(out.level).toBe('mixed');
  });
});
