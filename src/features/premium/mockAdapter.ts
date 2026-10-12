import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BuyResult, Plan, PurchasesAdapter } from './types';

const KEY = 'premium.mock.v1';

/**
 * YALNIZCA geliştirme (`__DEV__`): mağaza/RevenueCat olmadan paywall akışını denemek için.
 * Üretim derlemesinde `configure()` false döner, plan listesi boştur ve satın alma yapılamaz → bedava premium mümkün değil.
 */
export function createMockAdapter(): PurchasesAdapter {
  const listeners = new Set<(p: boolean) => void>();
  const get = async () => {
    try {
      return (await AsyncStorage.getItem(KEY)) === '1';
    } catch {
      return false;
    }
  };
  const set = async (v: boolean) => {
    try {
      await AsyncStorage.setItem(KEY, v ? '1' : '0');
    } catch {
      // yoksay
    }
    listeners.forEach((l) => l(v));
  };
  const plans: Plan[] = [
    { id: 'mock_yearly', type: 'yearly', priceString: '₺0,00 (test)' },
    { id: 'mock_monthly', type: 'monthly', priceString: '₺0,00 (test)' },
    { id: 'mock_lifetime', type: 'lifetime', priceString: '₺0,00 (test)' },
  ];
  return {
    async configure() {
      return __DEV__;
    },
    async getPlans() {
      return __DEV__ ? plans : [];
    },
    async buy(): Promise<BuyResult> {
      if (!__DEV__) throw new Error('unavailable');
      await set(true);
      return 'purchased';
    },
    async restore() {
      return __DEV__ ? get() : false;
    },
    async isPremium() {
      return __DEV__ ? get() : false;
    },
    onPremiumChange(cb) {
      listeners.add(cb);
      return () => void listeners.delete(cb);
    },
  };
}

/** Dev'de test için: premium'u sıfırla. */
export const resetMockPremium = () => AsyncStorage.removeItem(KEY).catch(() => {});
