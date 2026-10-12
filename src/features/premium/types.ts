import type { PlanType } from './tiers';

export interface Plan {
  id: string;
  type: PlanType;
  /** Mağazanın yerelleştirilmiş fiyatı (ör. "₺89,99") */
  priceString: string;
}

export type BuyResult = 'purchased' | 'cancelled';

/** Platforma özel satın alma uygulaması (native: RevenueCat; web/anahtarsız dev: sahte). */
export interface PurchasesAdapter {
  /** Hazırsa true; anahtar yok/Expo Go ise false (üretimde premium verilmez). */
  configure(appUserId?: string): Promise<boolean>;
  getPlans(): Promise<Plan[]>;
  /** İptal edilirse 'cancelled'; başarısızlıkta hata fırlatır. */
  buy(planId: string): Promise<BuyResult>;
  /** Geri yükler; premium aktifse true. */
  restore(): Promise<boolean>;
  isPremium(): Promise<boolean>;
  onPremiumChange(cb: (premium: boolean) => void): () => void;
}
