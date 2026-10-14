import type { Card, ContentLang } from './schema';
import cardsJson from './generated/cards.json';

const BUNDLED = cardsJson as Card[];

/** Yerinde güncellenen liste (referans sabit). Uzaktan paket varsa dil bazında yerini alır (`applyCardPack`). */
export const ALL_CARDS: Card[] = [...BUNDLED];

export const bundledCardCount = (lang: ContentLang): number => BUNDLED.filter((c) => c.lang === lang).length;

/** Bir dilin tüm kartlarını uzaktan paketle değiştirir (paket önceden `acceptCards` ile doğrulanmış olmalı). */
export function applyCardPack(lang: ContentLang, items: readonly Card[]): void {
  const next = [...ALL_CARDS.filter((c) => c.lang !== lang), ...items].sort((a, b) => a.id.localeCompare(b.id));
  ALL_CARDS.length = 0;
  ALL_CARDS.push(...next);
}

export function cardLangs(): ContentLang[] {
  return (['tr', 'ar', 'en'] as const).filter((l) => ALL_CARDS.some((c) => c.lang === l));
}
