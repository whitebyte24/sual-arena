import type { Category, ContentLang, Question } from './schema';
import questionsJson from './generated/questions.json';

/** `npm run content:build` çıktısı. Üretimde yalnızca approved içerik vardır. */
export const ALL_QUESTIONS = questionsJson as Question[];

export const QUESTION_INDEX: ReadonlyMap<string, Question> = new Map(ALL_QUESTIONS.map((q) => [q.id, q]));

export type CategoryChoice = Category | 'all';

export function questionPool(lang: ContentLang, category: CategoryChoice): Question[] {
  return ALL_QUESTIONS.filter((q) => q.lang === lang && (category === 'all' || q.category === category));
}

export function questionLangs(): ContentLang[] {
  return (['tr', 'ar', 'en'] as const).filter((l) => ALL_QUESTIONS.some((q) => q.lang === l));
}
