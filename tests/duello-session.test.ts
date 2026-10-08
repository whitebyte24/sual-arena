import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BOT_PLAYER } from '../src/features/duello/bot';
import { isFinished, makeResolver, standings } from '../src/features/duello/match';
import { MatchSession, nullTransport } from '../src/features/duello/session';
import { seededRng } from '../src/lib/rng';
import { LoopbackHub } from './helpers/loopback';
import { mkQ } from './helpers/fixtures';

const QS = Array.from({ length: 5 }, (_, i) => mkQ(i + 1, i % 4));
const INDEX = new Map(QS.map((q) => [q.id, q]));
const QIDS = QS.map((q) => q.id);
const SEED = 21;
const resolve = makeResolver(INDEX, SEED);
const P = (id: string) => ({ id, name: id.toUpperCase() });

const make = (hub: LoopbackHub, id: string, extra = {}) =>
  new MatchSession({ transport: hub.transport(id), selfId: id, resolverFor: (s) => makeResolver(INDEX, s), rng: seededRng(9), ...extra });

const correct = (s: MatchSession) => resolve(s.state!.qids[s.state!.index])!.answerIndex;
const wrong = (s: MatchSession) => (correct(s) + 1) % 4;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(1_000_000);
});
afterEach(() => vi.useRealTimers());

describe('iki oyunculu maç (host + konuk)', () => {
  it('her iki taraf aynı durumda biter, puanlar tutarlı', () => {
    const hub = new LoopbackHub();
    const a = make(hub, 'a');
    const b = make(hub, 'b');
    a.start({ matchId: 'm', players: [P('a'), P('b')], qids: QIDS, seed: SEED });
    expect(b.state?.index).toBe(0);
    expect(b.isHost).toBe(false);

    for (let i = 0; i < QIDS.length; i++) {
      expect(a.state!.index).toBe(i);
      expect(b.state!.index).toBe(i);
      vi.advanceTimersByTime(2000);
      a.answer(correct(a)); // a doğru
      vi.advanceTimersByTime(1000);
      b.answer(i % 2 ? correct(b) : wrong(b)); // b dönüşümlü
      vi.advanceTimersByTime(1500); // reveal → next
    }
    expect(isFinished(a.state!)).toBe(true);
    expect(isFinished(b.state!)).toBe(true);
    const sa = standings(a.state!, resolve);
    const sb = standings(b.state!, resolve);
    expect(sa).toEqual(sb);
    expect(sa[0].player.id).toBe('a');
    expect(sa[0].correct).toBe(5);
    expect(sa[1].correct).toBe(2);
    // a: 2 sn'de cevap → 100 + round(100*0.8)
    expect(sa[0].score).toBe(5 * 180);
  });

  it('kimse cevaplamazsa süreler dolar ve maç yine ilerler', () => {
    const hub = new LoopbackHub();
    const a = make(hub, 'a');
    const b = make(hub, 'b');
    a.start({ matchId: 'm', players: [P('a'), P('b')], qids: QIDS, seed: SEED });
    vi.advanceTimersByTime(5 * 11_500 + 100);
    expect(isFinished(a.state!)).toBe(true);
    expect(isFinished(b.state!)).toBe(true);
    expect(standings(a.state!, resolve).every((r) => r.score === 0)).toBe(true);
  });

  it('konuk sessizce kaybolursa host bekleme süresinden sonra ilerler', () => {
    const hub = new LoopbackHub();
    const a = make(hub, 'a');
    make(hub, 'b');
    a.start({ matchId: 'm', players: [P('a'), P('b')], qids: QIDS, seed: SEED });
    hub.dropped.add('a'); // a artık b'den mesaj almıyor (b'nin timeout cevabı ulaşmaz)
    a.answer(correct(a));
    vi.advanceTimersByTime(10_000 + 2000 + 50);
    expect(a.state!.index).toBe(1);
    expect(a.state!.answers.b[0]).toEqual({ choice: -1, ms: 10_000 });
  });

  it('rakip ayrılırsa maç hemen biter (forfeit)', () => {
    const hub = new LoopbackHub();
    const a = make(hub, 'a');
    make(hub, 'b');
    a.start({ matchId: 'm', players: [P('a'), P('b')], qids: QIDS, seed: SEED });
    hub.disconnect('b');
    expect(isFinished(a.state!)).toBe(true);
    expect(a.state!.forfeit).toBe(true);
  });

  it('geç gelen/yanlış maça ait mesajlar yok sayılır', () => {
    const hub = new LoopbackHub();
    const a = make(hub, 'a');
    a.start({ matchId: 'm', players: [P('a'), P('b')], qids: QIDS, seed: SEED });
    hub.transport('zz').send({ t: 'answer', matchId: 'BASKA', from: 'b', index: 0, choice: 1, ms: 5 });
    hub.transport('zz').send({ t: 'next', matchId: 'BASKA', index: 4 });
    expect(a.state!.index).toBe(0);
    expect(a.state!.answers.b[0]).toBeNull();
  });
});

describe('3 oyunculu oda: host ayrılır', () => {
  it('sıradaki oyuncu host olur ve maç devam eder', () => {
    const hub = new LoopbackHub();
    const a = make(hub, 'a');
    const b = make(hub, 'b');
    const c = make(hub, 'c');
    a.start({ matchId: 'm', players: [P('a'), P('b'), P('c')], qids: QIDS, seed: SEED });
    hub.disconnect('a');
    expect(b.isHost).toBe(true);
    expect(c.isHost).toBe(false);
    b.answer(correct(b));
    c.answer(correct(c));
    vi.advanceTimersByTime(1500 + 10);
    expect(b.state!.index).toBe(1);
    expect(c.state!.index).toBe(1);
  });
});

describe('botlu düello', () => {
  it('bot cevap verir, maç tek başına tamamlanır, bot etiketli', () => {
    const a = new MatchSession({
      transport: nullTransport,
      selfId: 'a',
      withBot: true,
      resolverFor: (s) => makeResolver(INDEX, s),
      rng: seededRng(4),
    });
    a.start({ matchId: 'm', players: [P('a'), BOT_PLAYER], qids: QIDS, seed: SEED });
    for (let i = 0; i < QIDS.length; i++) {
      vi.advanceTimersByTime(1000);
      a.answer(correct(a));
      vi.advanceTimersByTime(10_000); // bot en geç ~9.2 sn'de cevaplar
    }
    vi.advanceTimersByTime(2000);
    expect(isFinished(a.state!)).toBe(true);
    const st = standings(a.state!, resolve);
    expect(st.find((r) => r.player.isBot)).toBeDefined();
    expect(a.state!.answers.bot.every((x) => x !== null)).toBe(true);
    expect(st.find((r) => r.player.id === 'a')!.correct).toBe(5);
  });
});

describe('emoji', () => {
  it('beyaz listedeki emoji iletilir, serbest metin reddedilir', () => {
    const hub = new LoopbackHub();
    const a = make(hub, 'a');
    const b = make(hub, 'b');
    a.start({ matchId: 'm', players: [P('a'), P('b')], qids: QIDS, seed: SEED });
    b.sendEmoji('🎉');
    expect(a.getView().emojis.b?.e).toBe('🎉');
    hub.transport('b').send({ t: 'emoji', matchId: 'm', from: 'b', e: 'merhaba!' });
    hub.transport('b').send({ t: 'emoji', matchId: 'm', from: 'b', e: '😅😅' });
    expect(a.getView().emojis.b?.e).toBe('🎉');
  });
});

describe('yaşam döngüsü', () => {
  it('destroy sonrası zamanlayıcılar çalışmaz', () => {
    const hub = new LoopbackHub();
    const a = make(hub, 'a');
    a.start({ matchId: 'm', players: [P('a'), P('b')], qids: QIDS, seed: SEED });
    const v = a.getView().version;
    a.destroy();
    vi.advanceTimersByTime(60_000);
    expect(a.getView().version).toBe(v);
  });
});
