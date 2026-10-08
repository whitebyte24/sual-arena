import type { SupabaseClient } from '@supabase/supabase-js';
import type { ContentLang } from '@/content/schema';
import type { CategoryChoice } from '@/content/questions';
import { ChannelTransport } from '@/lib/realtime';
import type { PlayerInfo } from './match';
import { SEARCH_TIMEOUT_MS, duelChannel, pairingFor, queueChannel, type QueueEntry } from './pairing';

export type SearchResult =
  | { kind: 'human'; transport: ChannelTransport; opponent: PlayerInfo; host: boolean }
  | { kind: 'bot'; reason: 'timeout' | 'offline' };

const HANDSHAKE_MS = 4000;
const OFFLINE_FAKE_SEARCH_MS = 1500;

const toEntries = (t: ChannelTransport): QueueEntry[] =>
  t.presence().map((p) => ({ id: p.id, name: p.name, joinedAt: p.joinedAt }));

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const h = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => (clearTimeout(h), resolve()), { once: true });
  });
}

/** Presence değişince ya da süre dolunca çözülür. */
function untilPresenceOrTimeout(t: ChannelTransport, ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(h);
      off();
      resolve();
    };
    const h = setTimeout(done, ms);
    const off = t.onPresence(done);
    signal.addEventListener('abort', done, { once: true });
  });
}

/**
 * Rakip arar: kategori kuyruğuna girer, sıralı çiftleme ile eşleşir, özel kanalda el sıkışır.
 * `SEARCH_TIMEOUT_MS` içinde eşleşme olmazsa botla oynanır. İptal edilirse `null` döner.
 */
export async function searchOpponent(p: {
  client: SupabaseClient | null;
  self: { id: string; name: string };
  lang: ContentLang;
  category: CategoryChoice;
  signal: AbortSignal;
  timeoutMs?: number;
}): Promise<SearchResult | null> {
  const { client, self, signal } = p;
  if (!client) {
    await sleep(OFFLINE_FAKE_SEARCH_MS, signal);
    return signal.aborted ? null : { kind: 'bot', reason: 'offline' };
  }

  const deadline = Date.now() + (p.timeoutMs ?? SEARCH_TIMEOUT_MS);
  const joinedAt = Date.now();
  let queueOpen = false;
  const queue = new ChannelTransport(client, queueChannel(p.lang, p.category), { id: self.id, name: self.name, joinedAt });
  queueOpen = true;
  try {
    await Promise.race([queue.ready, sleep(Math.max(0, deadline - Date.now()), signal)]);

    while (!signal.aborted && Date.now() < deadline) {
      const pair = pairingFor(toEntries(queue), self.id);
      if (!pair) {
        await untilPresenceOrTimeout(queue, deadline - Date.now(), signal);
        continue;
      }
      const duel = new ChannelTransport(client, duelChannel(self.id, pair.partner.id), {
        id: self.id,
        name: self.name,
        joinedAt,
      });
      try {
        await duel.ready;
        const found = await waitForPeer(duel, pair.partner.id, HANDSHAKE_MS, signal);
        if (found) {
          queue.close();
          queueOpen = false;
          return {
            kind: 'human',
            transport: duel,
            opponent: { id: pair.partner.id, name: pair.partner.name },
            host: pair.host,
          };
        }
      } catch {
        // kanal kurulamadı: tekrar dene
      }
      duel.close();
      await sleep(500, signal);
    }
    return signal.aborted ? null : { kind: 'bot', reason: 'timeout' };
  } catch {
    return signal.aborted ? null : { kind: 'bot', reason: 'offline' };
  } finally {
    if (queueOpen) queue.close();
  }
}

function waitForPeer(t: ChannelTransport, peerId: string, ms: number, signal: AbortSignal): Promise<boolean> {
  const has = () => t.presence().some((x) => x.id === peerId);
  if (has()) return Promise.resolve(true);
  return new Promise((resolve) => {
    const finish = (v: boolean) => {
      clearTimeout(h);
      off();
      resolve(v);
    };
    const h = setTimeout(() => finish(false), ms);
    const off = t.onPresence(() => has() && finish(true));
    signal.addEventListener('abort', () => finish(false), { once: true });
  });
}
