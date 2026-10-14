/**
 * app.json üzerine dinamik katman (Expo "app.config.js": `config` = app.json içeriği).
 *
 * 1) Mağazaya giden (preview/production) EAS derlemelerinde, uygulamanın kullanmadığı ve Play/Data Safety incelemesinde soru
 *    çıkaran Android izinleri engellenir (geliştirme derlemesi etkilenmez): SYSTEM_ALERT_WINDOW (dev-client'tan gelir),
 *    READ/WRITE_EXTERNAL_STORAGE ve READ_MEDIA_* (uygulama medya kütüphanesine erişmez).
 * 2) AdMob UYGULAMA kimlikleri üretimde ortam değişkenlerinden gelir (ADMOB_ANDROID_APP_ID / ADMOB_IOS_APP_ID).
 * 3) PRODUCTION derlemesinde zorunlu anahtarlar eksikse (Supabase, RevenueCat, AdMob birimleri/uygulama kimlikleri)
 *    derleme HATA verir: yanlışlıkla test kimliğiyle ya da bağlantısız (çevrimdışı) uygulama yayınlanmasın.
 *    Bilerek atlamak için: ALLOW_INCOMPLETE_ENV=1 (yalnızca iç test/deneme için).
 *
 * Not: kök app.json'daki "react-native-google-mobile-ads" anahtarı Gradle betiği içindir (docs/android-emulator.md).
 */
const REQUIRED_PRODUCTION_ENV = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_REVENUECAT_IOS_KEY',
  'EXPO_PUBLIC_REVENUECAT_ANDROID_KEY',
  'EXPO_PUBLIC_ADMOB_IOS_BANNER',
  'EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL',
  'EXPO_PUBLIC_ADMOB_IOS_REWARDED',
  'EXPO_PUBLIC_ADMOB_ANDROID_BANNER',
  'EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL',
  'EXPO_PUBLIC_ADMOB_ANDROID_REWARDED',
  'ADMOB_ANDROID_APP_ID',
  'ADMOB_IOS_APP_ID',
];

module.exports = ({ config }) => {
  const profile = process.env.EAS_BUILD_PROFILE;
  const store = profile === 'production' || profile === 'preview';

  if (profile === 'production' && process.env.ALLOW_INCOMPLETE_ENV !== '1') {
    const missing = REQUIRED_PRODUCTION_ENV.filter((k) => !process.env[k]);
    if (missing.length) {
      throw new Error(
        `Production derlemesi için eksik ortam değişkenleri: ${missing.join(', ')}\n` +
          'EAS → Environment variables (veya `eas env:create`) ile ekleyin; bkz. docs/setup-accounts.md.',
      );
    }
  }

  const plugins = (config.plugins ?? []).map((p) => {
    if (Array.isArray(p) && p[0] === 'react-native-google-mobile-ads') {
      const opts = { ...p[1] };
      if (process.env.ADMOB_ANDROID_APP_ID) opts.androidAppId = process.env.ADMOB_ANDROID_APP_ID;
      if (process.env.ADMOB_IOS_APP_ID) opts.iosAppId = process.env.ADMOB_IOS_APP_ID;
      return [p[0], opts];
    }
    return p;
  });

  return {
    ...config,
    plugins,
    android: {
      ...config.android,
      ...(store
        ? {
            blockedPermissions: [
              'android.permission.SYSTEM_ALERT_WINDOW',
              'android.permission.READ_EXTERNAL_STORAGE',
              'android.permission.WRITE_EXTERNAL_STORAGE',
              'android.permission.READ_MEDIA_IMAGES',
              'android.permission.READ_MEDIA_VIDEO',
              'android.permission.READ_MEDIA_VISUAL_USER_SELECTED',
            ],
          }
        : {}),
    },
  };
};
