# Hesap ve servis kurulumu (kullanıcının yapacağı adımlar)

Kod hazır; aşağıdaki kayıtlar yapılmadan ilgili özellik gerçek cihazda çalışmaz. Hiçbir adım ücretli servis gerektirmez
(Apple Developer 99 $/yıl ve Google Play 25 $ hariç). Anahtarları `.env` dosyasına yaz (örnek: `.env.example`); **commit etme**.

## 1. Supabase (ücretsiz proje)
1. supabase.com → New project. `Project Settings > API`: URL ve anon key → `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
2. `SQL Editor`: `supabase/migrations/0001_init.sql`, sonra `0002_daily_sets.sql`, `0003_league.sql` içeriğini sırayla çalıştır (Ramazan Ligi için ayrıca `docs/league-ops.md`).
3. `Authentication > Providers`: **Anonymous sign-ins: açık** (misafir modu buna dayanır).
4. `Authentication > Sign In / Providers` (Settings): **Allow manual linking: açık** (misafir → Google hesabına bağlama).
5. `Authentication > URL Configuration > Redirect URLs`: `sualarena://auth-callback` ekle (geliştirmede Expo'nun gösterdiği `exp://…/--/auth-callback` da).
6. **Google:** Google Cloud Console > OAuth consent screen + Credentials > OAuth client (Web). Authorized redirect URI = Supabase'in gösterdiği `…/auth/v1/callback`.
   Client ID/secret'ı Supabase `Providers > Google`'a gir.
7. **Apple:** `Providers > Apple` aç; "Client IDs" alanına bundle id'ni yaz (`com.sualarena.app`). Yerel (iOS) girişte secret key gerekmez.
   Developer portalında App ID'de "Sign in with Apple" yetkisi açık olmalı (`app.json`'da `usesAppleSignIn: true` hazır).
8. Hesap silme Apple ile girilmiş hesapta Apple'ın token iptalini (REST) de gerektirir → bunu bir Edge Function ile yapmak gerekir (henüz yazılmadı; `docs`/HANDOFF riski).

## 2. AdMob
1. admob.google.com → iOS ve Android uygulamalarını ekle. Uygulama kimliklerini (`ca-app-pub-…~…`) `app.json > plugins > react-native-google-mobile-ads` içindeki test kimliklerinin yerine yaz (androidAppId, iosAppId).
2. Her platform için 3 reklam birimi: Banner, Interstitial, Rewarded → `.env`: `EXPO_PUBLIC_ADMOB_{IOS,ANDROID}_{BANNER,INTERSTITIAL,REWARDED}`.
   (Geliştirmede Google test birimleri otomatik kullanılır; **üretimde kimlik yoksa reklam gösterilmez**.)
3. **Engellenecek kategoriler** (AdMob > Blocking controls > Sensitive categories / General categories; ekran adları değişebilir, karşılığını seç):
   alkol · kumar ve bahis · flört ve tanışma · faizli kredi / hızlı zengin olma · kripto spekülasyonu · cinsel/müstehcen · astroloji, fal · açık giyim ağırlıklı moda · korku.
4. İçerik derecesi: uygulama ayarlarında maksimum **G** (kod da `maxAdContentRating: G` ayarlar).
5. `Privacy & messaging`: AB düzenlemeleri (UMP/GDPR) mesajı oluştur ve **yayınla**; iOS için ATT açıklayıcı mesajı (isteğe bağlı) yayınla.
6. `app-ads.txt`: AdMob'un verdiği satırı landing sayfasının kökünde yayınla (Faz 9).

## 3. RevenueCat (ücretsiz katman)
1. app.revenuecat.com → proje → iOS ve Android uygulamaları ekle. Public SDK key'leri → `EXPO_PUBLIC_REVENUECAT_IOS_KEY`, `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`.
2. Mağazalarda ürünler: App Store Connect (abonelik grubu "Premium") ve Play Console'da:
   `sual_premium_monthly`, `sual_premium_yearly` (abonelik) ve `sual_premium_lifetime` (tek seferlik).
3. RevenueCat: Entitlement kimliği **`premium`** (kodda `ENTITLEMENT_ID`). Offering **`default`**, paketler: `$rc_monthly`, `$rc_annual`, `$rc_lifetime`.
4. Apple "Paid Apps" sözleşmesi + vergi/banka formları ve Play ödeme profili tamamlanmadan gerçek test yapılamaz. Sandbox test hesabı / Play lisans test kullanıcısı ekle.

## 4. Geliştirme derlemesi (Expo Go yetmez)
Reklam, satın alma ve Apple girişi yerel modüldür: `npx eas-cli login` → `eas build --profile development --platform android` (veya ios) → cihaza kur → `npm start`.
Web/Expo Go'da reklamlar kapalı, premium akışı yalnızca `__DEV__` sahte modunda çalışır (üretimde sahte premium YOK).
