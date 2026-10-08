import type { DisplayQuestion, PlayerInfo } from './match';
import { QUESTION_SECONDS } from './match';

/** Bot, arayüzde "BOT" etiketiyle gösterilir (dürüstlük kuralı). */
export const BOT_PLAYER: PlayerInfo = { id: 'bot', name: 'BOT', isBot: true };

const ACCURACY: Record<DisplayQuestion['difficulty'], number> = { 1: 0.8, 2: 0.62, 3: 0.45 };

export interface BotPlan {
  delayMs: number;
  choice: number;
}

/** Bot'un bu soruya ne zaman, hangi şıkla cevap vereceği. `rng` ∈ [0,1). */
export function planBotAnswer(q: DisplayQuestion, rng: () => number): BotPlan {
  const maxDelay = QUESTION_SECONDS * 1000 - 800;
  const delayMs = Math.min(maxDelay, Math.round(1500 + rng() * 5500));
  if (rng() < ACCURACY[q.difficulty]) return { delayMs, choice: q.answerIndex };
  const wrong = [0, 1, 2, 3].filter((i) => i !== q.answerIndex);
  return { delayMs, choice: wrong[Math.floor(rng() * wrong.length)] };
}
