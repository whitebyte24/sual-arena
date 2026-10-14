/**
 * Uzaktan içerik paketleri (soru/kart) — SAF TS, ağ/RN bağımsız.
 * Mağaza incelemesi beklemeden soru/kart güncellemek için: `npm run content:publish` paketleri landing sitesiyle birlikte
 * yayınlar (`<CONTENT_URL>/manifest.json`); uygulama açılışta kontrol edip önbelleğe alır, sonraki açılışta kullanır.
 * Yalnızca VERİ indirilir (kod değil) → Apple 3.3.2 / Google politikalarıyla uyumlu.
 * Güvenlik ağı: her öğe şema doğrulamasından geçer, yalnızca `approved` kabul edilir, paket gömülü içeriğin yarısından
 * küçükse (yanlışlıkla boş/eksik yayın) reddedilir; reddedilirse gömülü içerik kullanılmaya devam eder.
 */
import type { Card, ContentLang, Question } from './schema';
import { LANGS } from './schema';
import { validateCard, validateQuestion } from './validate';

export const PACK_SCHEMA = 1;
export const MAX_PACK_ITEMS = 5000;

export interface PackEntry {
  file: string;
  sha256: string;
  count: number;
}
export interface LangPacks {
  questions?: PackEntry;
  cards?: PackEntry;
}
export interface Manifest {
  schema: number;
  version: number;
  packs: Partial<Record<ContentLang, LangPacks>>;
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function parseEntry(e: unknown): PackEntry | undefined {
  if (!isObj(e)) return undefined;
  const { file, sha256, count } = e;
  // dosya adı yalnızca düz ad: yol gezinmesi (../, /) yok
  if (typeof file !== 'string' || !/^[A-Za-z0-9._-]{1,80}$/.test(file) || file.includes('..')) return undefined;
  if (typeof sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(sha256)) return undefined;
  if (typeof count !== 'number' || !Number.isInteger(count) || count < 0 || count > MAX_PACK_ITEMS) return undefined;
  return { file, sha256, count };
}

/** Geçersiz ya da daha yeni şema sürümü → null (uygulama gömülü içerikle devam eder). */
export function parseManifest(raw: unknown): Manifest | null {
  if (!isObj(raw) || raw.schema !== PACK_SCHEMA) return null;
  if (typeof raw.version !== 'number' || !Number.isInteger(raw.version) || raw.version < 0) return null;
  if (!isObj(raw.packs)) return null;
  const packs: Manifest['packs'] = {};
  for (const lang of LANGS) {
    const p = raw.packs[lang];
    if (!isObj(p)) continue;
    packs[lang] = { questions: parseEntry(p.questions), cards: parseEntry(p.cards) };
  }
  return { schema: PACK_SCHEMA, version: raw.version, packs };
}

/** Paket, gömülü içeriğin en az yarısı kadar öğe taşımalı (gömülü boşsa en az 1). */
const minItems = (bundledCount: number) => Math.max(1, Math.ceil(bundledCount / 2));

function acceptItems<T extends { id: string; lang: string; review_status: string }>(
  lang: ContentLang,
  raw: unknown,
  bundledCount: number,
  validate: (x: unknown) => unknown[],
): T[] | null {
  if (!Array.isArray(raw) || raw.length > MAX_PACK_ITEMS || raw.length < minItems(bundledCount)) return null;
  const seen = new Set<string>();
  for (const it of raw as T[]) {
    if (!isObj(it) || it.lang !== lang || it.review_status !== 'approved' || validate(it).length > 0) return null;
    if (seen.has(it.id)) return null;
    seen.add(it.id);
  }
  return raw as T[];
}

export const acceptQuestions = (lang: ContentLang, raw: unknown, bundledCount: number): Question[] | null =>
  acceptItems<Question>(lang, raw, bundledCount, validateQuestion);

export const acceptCards = (lang: ContentLang, raw: unknown, bundledCount: number): Card[] | null =>
  acceptItems<Card>(lang, raw, bundledCount, validateCard);
