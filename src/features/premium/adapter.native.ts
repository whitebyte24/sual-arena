import { Platform } from 'react-native';
import Purchases, { PACKAGE_TYPE, type CustomerInfo, type PurchasesPackage } from 'react-native-purchases';
import { createMockAdapter } from './mockAdapter';
import { ENTITLEMENT_ID, type PlanType } from './tiers';
import type { BuyResult, Plan, PurchasesAdapter } from './types';

const KEY = Platform.OS === 'ios' ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;

const typeOf = (p: PurchasesPackage): PlanType | null =>
  p.packageType === PACKAGE_TYPE.MONTHLY ? 'monthly' : p.packageType === PACKAGE_TYPE.ANNUAL ? 'yearly' : p.packageType === PACKAGE_TYPE.LIFETIME ? 'lifetime' : null;

const active = (info: CustomerInfo) => info.entitlements.active[ENTITLEMENT_ID] !== undefined;

const mock = createMockAdapter();
let live = false;
let packages = new Map<string, PurchasesPackage>();

/** RevenueCat anahtarı varsa gerçek, yoksa (yalnızca __DEV__) sahte akış. Üretimde anahtarsız = satın alma kapalı. */
export const adapter: PurchasesAdapter = {
  async configure(appUserId) {
    if (!KEY) return mock.configure(appUserId);
    try {
      Purchases.configure({ apiKey: KEY, appUserID: appUserId });
      live = true;
      return true;
    } catch {
      return false;
    }
  },

  async getPlans() {
    if (!live) return mock.getPlans();
    try {
      const offerings = await Purchases.getOfferings();
      const out: Plan[] = [];
      packages = new Map();
      for (const p of offerings.current?.availablePackages ?? []) {
        const type = typeOf(p);
        if (!type) continue;
        packages.set(p.identifier, p);
        out.push({ id: p.identifier, type, priceString: p.product.priceString });
      }
      return out;
    } catch {
      return [];
    }
  },

  async buy(planId): Promise<BuyResult> {
    if (!live) return mock.buy(planId);
    const pkg = packages.get(planId);
    if (!pkg) throw new Error('unknown plan');
    try {
      await Purchases.purchasePackage(pkg);
      return 'purchased';
    } catch (e) {
      if ((e as { userCancelled?: boolean }).userCancelled) return 'cancelled';
      throw e;
    }
  },

  async restore() {
    if (!live) return mock.restore();
    return active(await Purchases.restorePurchases());
  },

  async isPremium() {
    if (!live) return mock.isPremium();
    try {
      return active(await Purchases.getCustomerInfo());
    } catch {
      return false;
    }
  },

  onPremiumChange(cb) {
    if (!live) return mock.onPremiumChange(cb);
    const listener = (info: CustomerInfo) => cb(active(info));
    Purchases.addCustomerInfoUpdateListener(listener);
    return () => void Purchases.removeCustomerInfoUpdateListener(listener);
  },
};
