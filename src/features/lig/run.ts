/** Ligde tek kişilik set: cevaplar + puan — saf TS. Puan düellodakiyle aynı (100 + hız bonusu ≤ 100). */
import { QUESTION_SECONDS, points, type Resolver } from '../duello/match';

export interface RunAnswer {
  /** Gösterilen (karıştırılmış) şık; -1 = süre doldu */
  choice: number;
  ms: number;
}

export const MAX_SCORE_PER_QUESTION = 200;

export function sanitizeAnswers(raw: unknown, max = 20): RunAnswer[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, max).flatMap((a) => {
    const choice = Number((a as RunAnswer)?.choice);
    const ms = Number((a as RunAnswer)?.ms);
    if (!Number.isInteger(choice) || choice < -1 || choice > 3 || !Number.isFinite(ms)) return [];
    return [{ choice, ms: Math.min(Math.max(0, ms), QUESTION_SECONDS * 1000) }];
  });
}

export function scoreRun(answers: readonly RunAnswer[], qids: readonly string[], resolve: Resolver): { score: number; correct: number } {
  let score = 0;
  let correct = 0;
  answers.forEach((a, i) => {
    const q = resolve(qids[i]);
    if (!q) return;
    const ok = a.choice === q.answerIndex;
    if (ok) correct++;
    score += points(ok, a.ms);
  });
  return { score, correct };
}

/** Bu gün için bir şey sunucuya gidebilir mi: tüm sorular cevaplandı. */
export const isRunComplete = (answers: readonly unknown[], qids: readonly string[]): boolean => qids.length > 0 && answers.length >= qids.length;
