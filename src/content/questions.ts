import type { Category, ContentLang, Question } from './schema';
import questionsJson from './generated/questions.json';
import metaJson from './generated/meta.json';

/** Gömülü (derleme anındaki) içerik. Üretimde yalnızca approved. Uzaktan paket varsa dil bazında yerini alır (`applyQuestionPack`). */
const BUNDLED = questionsJson as Question[];

/** Derleme anındaki içerik sürümü (`content/version.json`; `npm run content:publish` artırır). Uzaktan paket bundan yeniyse kullanılır. */
export const BUNDLED_CONTENT_VERSION = Number((metaJson as { version?: number }).version ?? 0);

/** Yerinde güncellenen listeler (referanslar sabit kalır; tüketiciler her kullanımda güncel halini okur). */
export const ALL_QUESTIONS: Question[] = [...BUNDLED];
const index = new Map<string, Question>(ALL_QUESTIONS.map((q) => [q.id, q]));
export const QUESTION_INDEX: ReadonlyMap<string, Question> = index;

export const bundledQuestionCount = (lang: ContentLang): number => BUNDLED.filter((q) => q.lang === lang).length;

/** Bir dilin tüm sorularını uzaktan paketle değiştirir (paket önceden `acceptQuestions` ile doğrulanmış olmalı). */
export function applyQuestionPack(lang: ContentLang, items: readonly Question[]): void {
  const keep = ALL_QUESTIONS.filter((q) => q.lang !== lang);
  const next = [...keep, ...items].sort((a, b) => a.id.localeCompare(b.id));
  ALL_QUESTIONS.length = 0;
  ALL_QUESTIONS.push(...next);
  index.clear();
  for (const q of ALL_QUESTIONS) index.set(q.id, q);
}

export type CategoryChoice = Category | 'all';

/** `allowed`: ücretsiz planda erişilebilen kategoriler (undefined = hepsi). */
export function questionPool(lang: ContentLang, category: CategoryChoice, allowed?: readonly Category[]): Question[] {
  return ALL_QUESTIONS.filter(
    (q) => q.lang === lang && (category === 'all' || q.category === category) && (!allowed || allowed.includes(q.category)),
  );
}

export function questionLangs(): ContentLang[] {
  return (['tr', 'ar', 'en'] as const).filter((l) => ALL_QUESTIONS.some((q) => q.lang === l));
}
