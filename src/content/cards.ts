import type { Card, ContentLang } from './schema';
import cardsJson from './generated/cards.json';

/** `npm run content:build` çıktısı. Üretimde yalnızca approved içerik vardır. */
export const ALL_CARDS = cardsJson as Card[];

export function cardLangs(): ContentLang[] {
  return (['tr', 'ar', 'en'] as const).filter((l) => ALL_CARDS.some((c) => c.lang === l));
}
