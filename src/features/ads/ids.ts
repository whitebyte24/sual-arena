import { Platform } from 'react-native';

/**
 * AdMob kimlikleri. Geliştirmede Google'ın herkese açık TEST kimlikleri kullanılır (gerçek reklam gösterilmez, hesap riski yok).
 * Üretimde `.env` içindeki gerçek birim kimlikleri kullanılır; eksikse test kimliğine DÜŞMEZ → reklam gösterilmez
 * (yanlışlıkla üretimde test reklamı yayınlamamak / geçersiz tıklama riski almamak için).
 * Uygulama kimlikleri (app id) app.json içindeki eklenti ayarındadır.
 */
const TEST = {
  banner: Platform.select({ ios: 'ca-app-pub-3940256099942544/2934735716', default: 'ca-app-pub-3940256099942544/6300978111' }),
  interstitial: Platform.select({ ios: 'ca-app-pub-3940256099942544/4411468910', default: 'ca-app-pub-3940256099942544/1033173712' }),
  rewarded: Platform.select({ ios: 'ca-app-pub-3940256099942544/1712485313', default: 'ca-app-pub-3940256099942544/5224354917' }),
};

const env = (name: string) => (process.env[name] ?? '').trim() || undefined;
const prod = (ios: string, android: string) => (Platform.OS === 'ios' ? env(ios) : env(android));

export const AD_UNITS = {
  banner: __DEV__ ? TEST.banner : prod('EXPO_PUBLIC_ADMOB_IOS_BANNER', 'EXPO_PUBLIC_ADMOB_ANDROID_BANNER'),
  interstitial: __DEV__ ? TEST.interstitial : prod('EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL', 'EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL'),
  rewarded: __DEV__ ? TEST.rewarded : prod('EXPO_PUBLIC_ADMOB_IOS_REWARDED', 'EXPO_PUBLIC_ADMOB_ANDROID_REWARDED'),
} as const;
