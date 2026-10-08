import type { SupabaseClient } from '@supabase/supabase-js';
import { MAX_ROOM_PLAYERS } from '@/lib/config';
import { ChannelTransport, type PresenceMeta } from '@/lib/realtime';
import { makeRoomCode, roomChannel } from './pairing';

export type RoomError = 'notFound' | 'full' | 'started' | 'connect';
export class RoomFailure extends Error {
  constructor(public reason: RoomError) {
    super(reason);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function waitUntil(cond: () => boolean, t: ChannelTransport, ms: number): Promise<boolean> {
  if (cond()) return true;
  return new Promise((resolve) => {
    const done = (v: boolean) => {
      clearTimeout(h);
      off();
      resolve(v);
    };
    const h = setTimeout(() => done(cond()), ms);
    const off = t.onPresence(() => cond() && done(true));
  });
}

/** Oda kur: boş bir 6 haneli kod bulana kadar dener (aynı kodda başka kurucu varsa yeni kod). */
export async function createRoom(
  client: SupabaseClient,
  self: { id: string; name: string },
): Promise<{ code: string; transport: ChannelTransport }> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = makeRoomCode(Math.random);
    const meta: PresenceMeta = { id: self.id, name: self.name, joinedAt: Date.now(), host: true };
    const transport = new ChannelTransport(client, roomChannel(code), meta);
    try {
      await transport.ready;
      await sleep(400); // diğer presence kayıtları gelsin
      const other = transport.presence().find((p) => p.id !== self.id);
      if (!other) return { code, transport };
    } catch {
      // yeniden dene
    }
    transport.close();
  }
  throw new RoomFailure('connect');
}

/** Odaya katıl: kurucu görünmezse "bulunamadı". */
export async function joinRoom(
  client: SupabaseClient,
  code: string,
  self: { id: string; name: string },
): Promise<ChannelTransport> {
  const transport = new ChannelTransport(client, roomChannel(code), { id: self.id, name: self.name, joinedAt: Date.now() });
  try {
    await transport.ready;
  } catch {
    transport.close();
    throw new RoomFailure('connect');
  }
  const hostSeen = await waitUntil(() => transport.presence().some((p) => p.host), transport, 3000);
  const players = transport.presence();
  const host = players.find((p) => p.host);
  if (!hostSeen || !host) {
    transport.close();
    throw new RoomFailure('notFound');
  }
  if (host.started) {
    transport.close();
    throw new RoomFailure('started');
  }
  if (players.length > MAX_ROOM_PLAYERS) {
    transport.close();
    throw new RoomFailure('full');
  }
  return transport;
}

export const lobbyPlayers = (t: ChannelTransport): PresenceMeta[] =>
  [...t.presence()].sort((a, b) => a.joinedAt - b.joinedAt || a.id.localeCompare(b.id));
