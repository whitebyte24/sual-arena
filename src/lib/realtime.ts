import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import type { Msg, Transport, TransportHandlers } from '@/features/duello/session';

export interface PresenceMeta {
  id: string;
  name: string;
  joinedAt: number;
  host?: boolean;
  started?: boolean;
}

const isMsg = (p: unknown): p is Msg =>
  typeof p === 'object' && p !== null && typeof (p as { t?: unknown }).t === 'string';

/**
 * Supabase Realtime kanalı = hem maç taşıması (broadcast) hem de varlık listesi (presence).
 * Presence anahtarı oyuncu kimliğidir; kanal kapanınca/koparsa `onPeerLeft` tetiklenir.
 */
export class ChannelTransport implements Transport {
  readonly ready: Promise<void>;
  private channel: RealtimeChannel;
  private handlers = new Set<TransportHandlers>();
  private presenceListeners = new Set<() => void>();
  private closed = false;

  constructor(
    private client: SupabaseClient,
    name: string,
    private meta: PresenceMeta,
  ) {
    this.channel = client.channel(name, {
      config: { broadcast: { self: false, ack: false }, presence: { key: meta.id } },
    });
    this.channel
      .on('broadcast', { event: 'm' }, ({ payload }) => {
        if (isMsg(payload)) this.handlers.forEach((h) => h.onMessage(payload));
      })
      .on('presence', { event: 'sync' }, () => this.presenceListeners.forEach((l) => l()))
      .on('presence', { event: 'leave' }, ({ key }) => {
        if (key !== meta.id) this.handlers.forEach((h) => h.onPeerLeft?.(key));
      });

    this.ready = new Promise<void>((resolve, reject) => {
      this.channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          try {
            await this.channel.track(this.meta);
            resolve();
          } catch (e) {
            reject(e);
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          reject(new Error(status));
        }
      });
    });
    this.ready.catch(() => {}); // işlenmemiş reddi önle; çağıran taraf await eder
  }

  presence(): PresenceMeta[] {
    const state = this.channel.presenceState<PresenceMeta>();
    return Object.values(state).flatMap((arr) => (arr[0] ? [arr[0]] : []));
  }

  onPresence(cb: () => void): () => void {
    this.presenceListeners.add(cb);
    return () => {
      this.presenceListeners.delete(cb);
    };
  }

  async updateMeta(patch: Partial<PresenceMeta>) {
    this.meta = { ...this.meta, ...patch };
    await this.channel.track(this.meta);
  }

  send(msg: Msg) {
    if (this.closed) return;
    this.channel.send({ type: 'broadcast', event: 'm', payload: msg });
  }

  subscribe(h: TransportHandlers) {
    this.handlers.add(h);
    return () => {
      this.handlers.delete(h);
    };
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    this.handlers.clear();
    this.presenceListeners.clear();
    this.client.removeChannel(this.channel);
  }
}
