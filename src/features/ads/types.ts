export type RewardResult = 'earned' | 'dismissed' | 'unavailable';

/** Platforma özel reklam uygulaması (native: AdMob; web/Expo Go: boş). */
export interface AdsAdapter {
  /** UMP onayı → ATT → SDK başlatma. Reklam istenebiliyorsa true. */
  init(): Promise<{ ready: boolean; personalized: boolean }>;
  showInterstitial(): Promise<boolean>;
  /** 'unavailable': yüklenemedi/destek yok → çağıran ödülü yine verir (spec). */
  showRewarded(): Promise<RewardResult>;
}
