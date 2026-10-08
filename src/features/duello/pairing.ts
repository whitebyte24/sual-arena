/**
 * Eşleştirme (saf TS). Herkes aynı sıralı listeyi görür: sıra = (joinedAt, id).
 * 0-1, 2-3, 4-5 … şeklinde çiftlenir; çiftin düşük sıralısı host olur.
 */
import type { ContentLang } from '../../content/schema';
import type { CategoryChoice } from '../../content/questions';

export interface QueueEntry {
  id: string;
  name: string;
  joinedAt: number;
}

export const SEARCH_TIMEOUT_MS = 8000;

export function sortQueue(entries: readonly QueueEntry[]): QueueEntry[] {
  return [...entries].sort((a, b) => a.joinedAt - b.joinedAt || a.id.localeCompare(b.id));
}

export function pairingFor(entries: readonly QueueEntry[], selfId: string): { partner: QueueEntry; host: boolean } | null {
  const sorted = sortQueue(entries);
  const pos = sorted.findIndex((e) => e.id === selfId);
  if (pos < 0) return null;
  const partner = sorted[pos % 2 === 0 ? pos + 1 : pos - 1];
  return partner ? { partner, host: pos % 2 === 0 } : null;
}

export const queueChannel = (lang: ContentLang, category: CategoryChoice) => `queue:${lang}:${category}`;
export const duelChannel = (a: string, b: string) => `duel:${[a, b].sort().join('~')}`;
export const roomChannel = (code: string) => `room:${code}`;

/** 6 haneli oda kodu (ilk hane 0 olmaz, okunaklı). */
export function makeRoomCode(rng: () => number): string {
  let out = String(1 + Math.floor(rng() * 9));
  for (let i = 0; i < 5; i++) out += String(Math.floor(rng() * 10));
  return out;
}
export const isRoomCode = (s: string) => /^[1-9]\d{5}$/.test(s);
