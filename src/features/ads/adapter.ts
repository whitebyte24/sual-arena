import type { AdsAdapter } from './types';

/** Web (ve native olmayan ortamlar): reklam yok. Native uygulama `adapter.native.ts` kullanır. */
export const adapter: AdsAdapter = {
  async init() {
    return { ready: false, personalized: false };
  },
  async showInterstitial() {
    return false;
  },
  async showRewarded() {
    return 'unavailable';
  },
};
