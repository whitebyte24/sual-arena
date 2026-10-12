/**
 * "Söyleme!" oyun motoru — saf TypeScript: ağ, React Native, saat ve rastgelelik YOK.
 * Zaman `now` (ms) olarak, rastgelelik `seed` olarak dışarıdan verilir; bu yüzden birebir test edilebilir.
 *
 * Akış: ready → playing → summary → (ready …) → finished
 * Kurallar:
 *  - Doğru +1, Yasaklı −1, Pas 0. Bir turun puanı eksiye düşmez (çocuklar için).
 *  - Süre dolduğunda ekrandaki kart puanlanmaz ve sonraki turun ilk kartı olur.
 *  - passLimit > 0 ise tur başına o kadar pas; 0 = sınırsız.
 *  - Daha önce görülen kartlar destenin sonuna atılır; deste biterse karıştırılıp yeniden başlar.
 */
import type { Card, CardLevel, ContentLang } from '../../content/schema';
import { shuffle } from '../../lib/rng';

export type Result = 'correct' | 'pass' | 'taboo';
export type LevelChoice = CardLevel | 'mixed';
export type Phase = 'ready' | 'playing' | 'summary' | 'finished';
export type TeamIndex = 0 | 1;

export interface Settings {
  teamNames: [string, string];
  roundSeconds: number;
  turnsPerTeam: number;
  passLimit: number;
  level: LevelChoice;
  lang: ContentLang;
}

export const LIMITS = {
  roundSeconds: { min: 30, max: 120, step: 15 },
  turnsPerTeam: { min: 1, max: 5 },
  passLimit: { min: 0, max: 5 },
  teamName: 16,
  minCards: 8,
} as const;

export interface Entry {
  card: Card;
  result: Result;
}
export interface Turn {
  team: TeamIndex;
  entries: Entry[];
}

export interface GameState {
  phase: Phase;
  settings: Settings;
  pool: Card[];
  deck: Card[];
  cursor: number;
  seed: number;
  turns: Turn[];
  turnIndex: number;
  endsAt: number;
}

export { shuffle };

// ─── deste ───────────────────────────────────────────────────────────────────
/** `allowedLevels`: ücretsiz planda erişilebilen seviyeler (undefined = hepsi). */
export function eligibleCards(
  cards: readonly Card[],
  settings: Pick<Settings, 'lang' | 'level'>,
  allowedLevels?: readonly CardLevel[],
): Card[] {
  return cards.filter(
    (c) =>
      c.lang === settings.lang &&
      (settings.level === 'mixed' || c.level === settings.level) &&
      (!allowedLevels || allowedLevels.includes(c.level)),
  );
}

function buildDeck(pool: Card[], seen: ReadonlySet<string>, seed: number): [Card[], number] {
  const [fresh, s1] = shuffle(
    pool.filter((c) => !seen.has(c.id)),
    seed,
  );
  const [old, s2] = shuffle(
    pool.filter((c) => seen.has(c.id)),
    s1,
  );
  return [[...fresh, ...old], s2];
}

export function createGame(
  cards: readonly Card[],
  settings: Settings,
  seenIds: readonly string[],
  seed: number,
  allowedLevels?: readonly CardLevel[],
): GameState {
  const pool = eligibleCards(cards, settings, allowedLevels);
  const [deck, s] = buildDeck(pool, new Set(seenIds), seed);
  return { phase: 'ready', settings, pool, deck, cursor: 0, seed: s, turns: [], turnIndex: 0, endsAt: 0 };
}

// ─── seçiciler ───────────────────────────────────────────────────────────────
export const totalTurns = (s: Pick<GameState, 'settings'>) => s.settings.turnsPerTeam * 2;
export const teamOf = (turnIndex: number): TeamIndex => (turnIndex % 2) as TeamIndex;
export const currentCard = (s: GameState): Card | null =>
  s.phase === 'playing' ? (s.deck[s.cursor] ?? null) : null;
export const currentTurn = (s: GameState): Turn | undefined => s.turns[s.turnIndex];

export function turnScore(turn: Turn): number {
  let n = 0;
  for (const e of turn.entries) n += e.result === 'correct' ? 1 : e.result === 'taboo' ? -1 : 0;
  return Math.max(0, n);
}

export function scores(s: Pick<GameState, 'turns'>): [number, number] {
  const out: [number, number] = [0, 0];
  for (const t of s.turns) out[t.team] += turnScore(t);
  return out;
}

export function passesUsed(s: GameState): number {
  return currentTurn(s)?.entries.filter((e) => e.result === 'pass').length ?? 0;
}

export function canPass(s: GameState): boolean {
  return s.settings.passLimit === 0 || passesUsed(s) < s.settings.passLimit;
}

export function remainingMs(s: GameState, now: number): number {
  return s.phase === 'playing' ? Math.max(0, s.endsAt - now) : 0;
}

export function winner(s: GameState): TeamIndex | 'draw' {
  const [a, b] = scores(s);
  return a === b ? 'draw' : a > b ? 0 : 1;
}

export function seenIdsOf(s: GameState): string[] {
  return s.turns.flatMap((t) => t.entries.map((e) => e.card.id));
}

// ─── geçişler ────────────────────────────────────────────────────────────────
export function startTurn(s: GameState, now: number): GameState {
  if (s.phase !== 'ready') return s;
  const turns = s.turns.slice(0, s.turnIndex);
  turns.push({ team: teamOf(s.turnIndex), entries: [] });
  return { ...s, phase: 'playing', turns, endsAt: now + s.settings.roundSeconds * 1000 };
}

function advanceCursor(s: GameState): GameState {
  const cursor = s.cursor + 1;
  if (cursor < s.deck.length) return { ...s, cursor };
  const seen = new Set(seenIdsOf(s));
  const [deck, seed] = buildDeck(s.pool, seen, s.seed);
  return { ...s, deck, cursor: 0, seed };
}

function endTurn(s: GameState): GameState {
  return { ...s, phase: 'summary' };
}

export function tick(s: GameState, now: number): GameState {
  return s.phase === 'playing' && now >= s.endsAt ? endTurn(s) : s;
}

export function answer(s: GameState, result: Result, now: number): GameState {
  if (s.phase !== 'playing') return s;
  if (now >= s.endsAt) return endTurn(s);
  const card = s.deck[s.cursor];
  if (!card) return s;
  if (result === 'pass' && !canPass(s)) return s;
  const turns = s.turns.slice();
  const turn = turns[s.turnIndex];
  turns[s.turnIndex] = { ...turn, entries: [...turn.entries, { card, result }] };
  return advanceCursor({ ...s, turns });
}

/** Hakem düzeltmesi: özet ekranında bir kartın sonucunu değiştirir. */
export function setResult(s: GameState, turnIdx: number, entryIdx: number, result: Result): GameState {
  if (s.phase !== 'summary' && s.phase !== 'finished') return s;
  const turn = s.turns[turnIdx];
  if (!turn?.entries[entryIdx]) return s;
  const entries = turn.entries.map((e, i) => (i === entryIdx ? { ...e, result } : e));
  const turns = s.turns.slice();
  turns[turnIdx] = { ...turn, entries };
  return { ...s, turns };
}

export function nextTurn(s: GameState): GameState {
  if (s.phase !== 'summary') return s;
  const turnIndex = s.turnIndex + 1;
  return turnIndex >= totalTurns(s) ? { ...s, phase: 'finished' } : { ...s, phase: 'ready', turnIndex };
}

// ─── ayar yardımcıları ───────────────────────────────────────────────────────
export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export function sanitizeSettings(raw: Partial<Settings> | undefined, defaults: Settings): Settings {
  const r = raw ?? {};
  const name = (v: unknown, d: string) =>
    typeof v === 'string' && v.trim() ? v.trim().slice(0, LIMITS.teamName) : d;
  const L = LIMITS;
  return {
    teamNames: [name(r.teamNames?.[0], defaults.teamNames[0]), name(r.teamNames?.[1], defaults.teamNames[1])],
    roundSeconds: clamp(Math.round(Number(r.roundSeconds ?? defaults.roundSeconds)), L.roundSeconds.min, L.roundSeconds.max),
    turnsPerTeam: clamp(Math.round(Number(r.turnsPerTeam ?? defaults.turnsPerTeam)), L.turnsPerTeam.min, L.turnsPerTeam.max),
    passLimit: clamp(Math.round(Number(r.passLimit ?? defaults.passLimit)), L.passLimit.min, L.passLimit.max),
    level: ['child', 'teen', 'adult', 'mixed'].includes(r.level as string) ? (r.level as LevelChoice) : defaults.level,
    lang: ['tr', 'ar', 'en'].includes(r.lang as string) ? (r.lang as ContentLang) : defaults.lang,
  };
}
