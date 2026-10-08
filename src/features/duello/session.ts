/**
 * MatchSession: bir maçın istemci tarafı denetleyicisi (Düello, Arkadaş Odası ve botlu maç aynı kodu kullanır).
 * - Taşıma katmanı (Transport) soyuttur: Supabase Realtime, bellek içi hub (test) ya da boş (botlu maç).
 * - Host (maçı başlatan) soruları ilerletir: herkes cevapladığında ya da bekleme süresi dolduğunda `next` yayar.
 * - Host ayrılırsa sıradaki aktif oyuncu host olur. Ayrılan oyuncu sayısı yetmezse maç erken biter (forfeit).
 * - Sohbet yok: yalnızca beyaz listedeki emoji tepkileri taşınır.
 */
import { seededRng } from '../../lib/rng';
import { planBotAnswer, BOT_PLAYER } from './bot';
import {
  QUESTION_SECONDS,
  advanceTo,
  allAnswered,
  createMatch,
  hasAnswered,
  isFinished,
  markLeft,
  recordAnswer,
  type MatchState,
  type PlayerInfo,
  type Resolver,
} from './match';

export const EMOJIS = ['👍', '😮', '🎉', '😅'] as const;
export type Emoji = (typeof EMOJIS)[number];

export type Msg =
  | { t: 'start'; matchId: string; hostId: string; players: PlayerInfo[]; qids: string[]; seed: number }
  | { t: 'answer'; matchId: string; from: string; index: number; choice: number; ms: number }
  | { t: 'next'; matchId: string; index: number }
  | { t: 'emoji'; matchId: string; from: string; e: string }
  /** Konuk oturumu kurdu; host maç başladıysa `start`'ı yeniden yayar (yarış durumu koruması). */
  | { t: 'hello'; from: string };

export interface TransportHandlers {
  onMessage(msg: Msg): void;
  onPeerLeft?(id: string): void;
}
export interface Transport {
  send(msg: Msg): void;
  subscribe(handlers: TransportHandlers): () => void;
  close(): void;
}

/** Ağsız (botlu) maç için boş taşıma. */
export const nullTransport: Transport = {
  send() {},
  subscribe: () => () => {},
  close() {},
};

export interface SessionView {
  state: MatchState | null;
  /** Mevcut sorunun bu cihazda gösterilmeye başladığı an (ms, Date.now) */
  startedAt: number;
  emojis: Record<string, { e: Emoji; at: number }>;
  version: number;
}

export interface SessionOptions {
  transport: Transport;
  selfId: string;
  resolverFor: (seed: number) => Resolver;
  /** Host botla oynar (botlu düello). */
  withBot?: boolean;
  rng?: () => number;
  secondsPerQuestion?: number;
  revealMs?: number;
}

export class MatchSession {
  private view: SessionView = { state: null, startedAt: 0, emojis: {}, version: 0 };
  private listeners = new Set<() => void>();
  private timers = new Set<ReturnType<typeof setTimeout>>();
  private unsub: () => void;
  private resolve: Resolver | null = null;
  private nextScheduledFor = -1;
  private destroyed = false;
  private readonly secs: number;
  private readonly revealMs: number;
  private readonly rng: () => number;

  constructor(private readonly opts: SessionOptions) {
    this.secs = opts.secondsPerQuestion ?? QUESTION_SECONDS;
    this.revealMs = opts.revealMs ?? 1500;
    this.rng = opts.rng ?? seededRng((Date.now() ^ 0x5bd1e995) | 0);
    this.unsub = opts.transport.subscribe({
      onMessage: (m) => this.handle(m),
      onPeerLeft: (id) => this.peerLeft(id),
    });
  }

  // ─── dış API ───────────────────────────────────────────────────────────────
  subscribe = (cb: () => void) => {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  };
  getView = () => this.view;
  get state() {
    return this.view.state;
  }
  get isHost() {
    return this.view.state?.hostId === this.opts.selfId;
  }

  /** Host çağırır. Botlu maçta bot oyuncu listeye eklenmiş olmalıdır. */
  start(init: { matchId: string; players: PlayerInfo[]; qids: string[]; seed: number }) {
    this.dispatch({ t: 'start', hostId: this.opts.selfId, ...init });
  }

  answer(choice: number) {
    const s = this.view.state;
    if (!s || isFinished(s) || hasAnswered(s, this.opts.selfId)) return;
    const ms = Math.min(Date.now() - this.view.startedAt, this.secs * 1000);
    this.dispatch({ t: 'answer', matchId: s.matchId, from: this.opts.selfId, index: s.index, choice, ms });
  }

  /** Konuk: oturumu kurunca çağırır; host maç başladıysa başlangıç mesajını tekrar gönderir. */
  hello() {
    this.opts.transport.send({ t: 'hello', from: this.opts.selfId });
  }

  sendEmoji(e: Emoji) {
    const s = this.view.state;
    if (s) this.dispatch({ t: 'emoji', matchId: s.matchId, from: this.opts.selfId, e });
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.clearTimers();
    this.unsub();
    this.opts.transport.close();
    this.listeners.clear();
  }

  // ─── mesaj işleme ──────────────────────────────────────────────────────────
  private dispatch(msg: Msg) {
    this.handle(msg);
    this.opts.transport.send(msg);
  }

  private handle(msg: Msg) {
    if (this.destroyed) return;
    const s = this.view.state;
    if (msg.t === 'start') {
      if (s) return;
      this.resolve = this.opts.resolverFor(msg.seed);
      this.update({ state: createMatch({ matchId: msg.matchId, hostId: msg.hostId, players: msg.players, qids: msg.qids, seed: msg.seed }) });
      this.beginQuestion();
      return;
    }
    if (msg.t === 'hello') {
      if (s && this.isHost) {
        this.opts.transport.send({ t: 'start', matchId: s.matchId, hostId: s.hostId, players: s.players, qids: s.qids, seed: s.seed });
      }
      return;
    }
    if (!s || msg.matchId !== s.matchId) return;

    if (msg.t === 'answer') {
      const next = recordAnswer(s, msg.from, msg.index, { choice: msg.choice, ms: msg.ms });
      if (next === s) return;
      this.update({ state: next });
      this.hostCheck();
    } else if (msg.t === 'next') {
      const next = advanceTo(s, msg.index);
      if (next === s) return;
      this.update({ state: next });
      this.afterAdvance();
    } else if (msg.t === 'emoji') {
      if (!(EMOJIS as readonly string[]).includes(msg.e)) return;
      if (!s.players.some((p) => p.id === msg.from)) return;
      this.update({ emojis: { ...this.view.emojis, [msg.from]: { e: msg.e as Emoji, at: Date.now() } } });
    }
  }

  private peerLeft(id: string) {
    const s = this.view.state;
    if (!s || isFinished(s)) return;
    const wasHost = this.isHost;
    const next = markLeft(s, id);
    if (next === s) return;
    this.update({ state: next });
    if (isFinished(next)) return this.afterAdvance();
    if (!wasHost && this.isHost) this.armHost();
    else this.hostCheck();
  }

  // ─── soru akışı ────────────────────────────────────────────────────────────
  private afterAdvance() {
    this.clearTimers();
    if (isFinished(this.view.state!)) return;
    this.beginQuestion();
  }

  private beginQuestion() {
    const s = this.view.state!;
    this.clearTimers();
    this.nextScheduledFor = -1;
    this.update({ startedAt: Date.now() });
    const index = s.index;

    // kendi süremiz dolarsa boş cevap
    this.later(this.secs * 1000, () => {
      const cur = this.view.state;
      if (cur && cur.index === index && !hasAnswered(cur, this.opts.selfId) && !cur.left.includes(this.opts.selfId)) {
        this.answer(-1);
      }
    });

    if (this.isHost) {
      this.armHost();
      if (this.opts.withBot) this.scheduleBot(index);
    }
  }

  private scheduleBot(index: number) {
    const s = this.view.state;
    const q = s && this.resolve?.(s.qids[index]);
    if (!s || !q) return;
    const plan = planBotAnswer(q, this.rng);
    this.later(plan.delayMs, () => {
      const cur = this.view.state;
      if (cur && cur.index === index) {
        this.dispatch({ t: 'answer', matchId: cur.matchId, from: BOT_PLAYER.id, index, choice: plan.choice, ms: plan.delayMs });
      }
    });
  }

  /** Host: bekleme süresi + herkes cevapladı kontrolü */
  private armHost() {
    const s = this.view.state!;
    const index = s.index;
    this.later(this.secs * 1000 + 2000, () => this.forceNext(index));
    this.hostCheck();
  }

  private hostCheck() {
    const s = this.view.state;
    if (!s || !this.isHost || isFinished(s) || this.nextScheduledFor === s.index) return;
    if (!allAnswered(s)) return;
    const index = s.index;
    this.nextScheduledFor = index;
    this.later(this.revealMs, () => this.forceNext(index));
  }

  private forceNext(index: number) {
    const s = this.view.state;
    if (!s || s.index !== index || !this.isHost) return;
    this.dispatch({ t: 'next', matchId: s.matchId, index: index + 1 });
  }

  // ─── yardımcılar ───────────────────────────────────────────────────────────
  private later(ms: number, fn: () => void) {
    const h = setTimeout(() => {
      this.timers.delete(h);
      if (!this.destroyed) fn();
    }, ms);
    this.timers.add(h);
  }
  private clearTimers() {
    this.timers.forEach(clearTimeout);
    this.timers.clear();
  }
  private update(patch: Partial<Omit<SessionView, 'version'>>) {
    this.view = { ...this.view, ...patch, version: this.view.version + 1 };
    this.listeners.forEach((l) => l());
  }
}
