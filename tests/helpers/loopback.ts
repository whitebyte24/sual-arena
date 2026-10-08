import type { Msg, Transport, TransportHandlers } from '../../src/features/duello/session';

/** Bellek içi hub: bir istemcinin gönderdiği mesaj diğerlerine ulaşır (kendine dönmez), Supabase davranışı gibi. */
export class LoopbackHub {
  private peers = new Map<string, TransportHandlers>();
  /** Teslimatı test için durdurmak/tutmak istersen true yap */
  dropped = new Set<string>();

  transport(id: string): Transport {
    return {
      send: (msg: Msg) => {
        for (const [pid, h] of this.peers) if (pid !== id && !this.dropped.has(pid)) h.onMessage(msg);
      },
      subscribe: (h) => {
        this.peers.set(id, h);
        return () => {
          this.peers.delete(id);
        };
      },
      close: () => {
        this.peers.delete(id);
      },
    };
  }

  /** `id` bağlantıyı kaybetti: diğerlerine onPeerLeft bildirilir. */
  disconnect(id: string) {
    this.peers.delete(id);
    for (const h of this.peers.values()) h.onPeerLeft?.(id);
  }
}
