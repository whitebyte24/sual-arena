/**
 * Çok oyunculu maç durumu (Düello = 2 oyuncu, Arkadaş Odası = 2–8). Saf TS: ağ, saat ve React yok.
 * Her istemci aynı mesajları aynı sırayla işler → aynı durum. Doğru cevap ve şık sırası,
 * maç tohumundan (seed) herkesin cihazında aynı şekilde türetilir; ağda cevap anahtarı taşınmaz.
 */
import type { Question } from '../../content/schema';
import { hashString, shuffle } from '../../lib/rng';

export const QUESTION_SECONDS = 10;
export const BASE_POINTS = 100;
export const SPEED_BONUS = 100;

export interface PlayerInfo {
  id: string;
  name: string;
  isBot?: boolean;
}

export interface AnswerRec {
  /** Gösterilen (karıştırılmış) şık sırası; -1 = süre doldu / cevapsız */
  choice: number;
  ms: number;
}

export interface MatchState {
  matchId: string;
  hostId: string;
  players: PlayerInfo[];
  qids: string[];
  seed: number;
  /** Mevcut soru; qids.length = maç bitti */
  index: number;
  answers: Record<string, (AnswerRec | null)[]>;
  left: string[];
  /** Rakip/rakipler ayrıldığı için erken bitti */
  forfeit: boolean;
}

export interface DisplayQuestion {
  id: string;
  text: string;
  options: string[];
  answerIndex: number;
  category: Question['category'];
  difficulty: Question['difficulty'];
  source: string;
  explanation: string;
}

export type Resolver = (qid: string) => DisplayQuestion | undefined;

// ─── sorular ─────────────────────────────────────────────────────────────────
export function displayQuestion(q: Question, matchSeed: number): DisplayQuestion {
  const [order] = shuffle([0, 1, 2, 3], (matchSeed ^ hashString(q.id)) | 0);
  return {
    id: q.id,
    text: q.question,
    options: order.map((i) => q.options[i]),
    answerIndex: order.indexOf(q.answer_index),
    category: q.category,
    difficulty: q.difficulty,
    source: q.source,
    explanation: q.explanation,
  };
}

export function makeResolver(index: ReadonlyMap<string, Question>, seed: number): Resolver {
  return (qid) => {
    const q = index.get(qid);
    return q ? displayQuestion(q, seed) : undefined;
  };
}

/** Görülmemişleri öne alarak `count` soru seçer. */
export function pickQuestions(pool: readonly Question[], count: number, seed: number, seenIds: readonly string[] = []): string[] {
  const seen = new Set(seenIds);
  const [fresh, s1] = shuffle(pool.filter((q) => !seen.has(q.id)), seed);
  const [old] = shuffle(pool.filter((q) => seen.has(q.id)), s1);
  return [...fresh, ...old].slice(0, count).map((q) => q.id);
}

// ─── puan ────────────────────────────────────────────────────────────────────
export function points(correct: boolean, ms: number, seconds = QUESTION_SECONDS): number {
  if (!correct) return 0;
  const frac = Math.max(0, 1 - Math.max(0, ms) / (seconds * 1000));
  return BASE_POINTS + Math.round(SPEED_BONUS * frac);
}

// ─── durum ───────────────────────────────────────────────────────────────────
export function createMatch(init: {
  matchId: string;
  hostId: string;
  players: PlayerInfo[];
  qids: string[];
  seed: number;
}): MatchState {
  const answers: MatchState['answers'] = {};
  for (const p of init.players) answers[p.id] = init.qids.map(() => null);
  return { ...init, index: 0, answers, left: [], forfeit: false };
}

export const isFinished = (s: MatchState) => s.index >= s.qids.length;
const timeout = (seconds = QUESTION_SECONDS): AnswerRec => ({ choice: -1, ms: seconds * 1000 });
const activePlayers = (s: MatchState) => s.players.filter((p) => !s.left.includes(p.id));

export function recordAnswer(s: MatchState, playerId: string, index: number, rec: AnswerRec): MatchState {
  if (isFinished(s) || index !== s.index) return s;
  const row = s.answers[playerId];
  if (!row || row[index] !== null) return s;
  const ms = Math.min(Math.max(0, rec.ms), QUESTION_SECONDS * 1000);
  const choice = Number.isInteger(rec.choice) && rec.choice >= 0 && rec.choice <= 3 ? rec.choice : -1;
  const next = row.slice();
  next[index] = { choice, ms };
  return { ...s, answers: { ...s.answers, [playerId]: next } };
}

export function hasAnswered(s: MatchState, playerId: string, index = s.index): boolean {
  return s.answers[playerId]?.[index] != null;
}

export function allAnswered(s: MatchState): boolean {
  if (isFinished(s)) return true;
  return activePlayers(s).every((p) => hasAnswered(s, p.id));
}

/** `index`'e ilerler; atlanan sorularda cevaplamayanlar süre dolmuş sayılır. */
export function advanceTo(s: MatchState, index: number): MatchState {
  const target = Math.min(index, s.qids.length);
  if (target <= s.index) return s;
  const answers: MatchState['answers'] = {};
  for (const p of s.players) {
    const row = (s.answers[p.id] ?? []).slice();
    for (let i = s.index; i < target; i++) if (row[i] == null) row[i] = timeout();
    answers[p.id] = row;
  }
  return { ...s, answers, index: target };
}

/** Oyuncu ayrıldı: kalan cevapları boş sayılır; host ayrıldıysa sıradaki aktif oyuncu host olur. */
export function markLeft(s: MatchState, playerId: string): MatchState {
  if (!s.players.some((p) => p.id === playerId) || s.left.includes(playerId)) return s;
  const row = (s.answers[playerId] ?? []).map((a) => a ?? timeout());
  let next: MatchState = { ...s, left: [...s.left, playerId], answers: { ...s.answers, [playerId]: row } };
  const active = activePlayers(next);
  if (next.hostId === playerId && active[0]) next = { ...next, hostId: active[0].id };
  if (!isFinished(next) && active.length <= 1 && next.players.length > 1) {
    next = { ...advanceTo(next, next.qids.length), forfeit: true };
  }
  return next;
}

// ─── sonuç ───────────────────────────────────────────────────────────────────
export interface Standing {
  player: PlayerInfo;
  score: number;
  correct: number;
  rank: number;
  left: boolean;
}

export function playerScore(s: MatchState, playerId: string, resolve: Resolver): { score: number; correct: number } {
  let score = 0;
  let correct = 0;
  (s.answers[playerId] ?? []).forEach((a, i) => {
    const q = a ? resolve(s.qids[i]) : undefined;
    if (!a || !q) return;
    const ok = a.choice === q.answerIndex;
    if (ok) correct++;
    score += points(ok, a.ms);
  });
  return { score, correct };
}

export function standings(s: MatchState, resolve: Resolver): Standing[] {
  const rows = s.players.map((player) => ({ player, ...playerScore(s, player.id, resolve), left: s.left.includes(player.id) }));
  rows.sort((a, b) => b.score - a.score || b.correct - a.correct);
  let rank = 0;
  return rows.map((r, i) => {
    const tie = i > 0 && r.score === rows[i - 1].score && r.correct === rows[i - 1].correct;
    if (!tie) rank = i + 1;
    return { ...r, rank };
  });
}
