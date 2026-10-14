# Mağaza uyumluluk kontrol listesi

Durum: `[ ]` yapılmadı · `[~]` kısmen/kod hazır, doğrulanmadı · `[x]` tamam ve doğrulandı. Faz 10'da `review-ready:scan` ile çapraz kontrol edilir.

| # | Madde | Faz | Durum |
|---|---|---|---|
| 1 | Uygulama içinden hesap silme (`delete_my_account()` RPC + Hesap ekranı; canlı Supabase ile denenmedi; Apple token iptali eksik, bkz. #24) | 5 | [~] |
| 2 | Apple ile Giriş (başka sosyal giriş varsa zorunlu) — kod hazır (iOS yerel), cihazda denenmedi | 5 | [~] |
| 3 | Misafir modunda oynanabilirlik (giriş zorunlu değil; Supabase anonymous) — tüm modlar girişsiz açık | 5 | [x] |
| 4 | Gizlilik politikası + kullanım koşulları + hesap silme sayfası (TR/AR/EN) — `marketing/landing/{privacy,terms,delete-account}.html` YAZILDI; **yayında değil**; `config.js` içinde yayıncı adı + e-posta TODO; barındırma + alan adı (`docs/setup-accounts.md` §5) gerekir; Arapça yerel okuyucu + (önerilir) hukukçu incelemesi | 9 | [~] |
| 5 | iOS `PrivacyInfo.xcprivacy` (app.json `ios.privacyManifests`: erişilen API'ler + toplanan veri + izleme) + izin metinleri (yalnız ATT; kamera/konum/foto kullanılmıyor) | 10 | [x] |
| 6 | Google Play Veri Güvenliği formu taslağı — `store/forms.md` §2 hazır; formu siz doldurup gönderirsiniz | 10 | [~] |
| 7 | Şifreleme ihracat beyanı (`ITSAppUsesNonExemptEncryption=false` app.json'da) | 1 | [x] |
| 8 | Abonelik ekranında fiyat, süre, otomatik yenileme, iptal bilgisi + "Satın alımları geri yükle" (Paywall hazır; TR/EN/AR) | 5 | [~] |
| 9 | Yaş derecelendirmesi 4+ / Herkes; kullanıcılar arası sohbet YOK (yalnız hazır emoji; kod: EMOJIS beyaz listesi, session.ts) | 3 | [~] |
| 10 | Google Play hedef SDK güncel — derleme günlüğü: targetSdk/compileSdk 36 (Expo SDK 57); Play en az 35 ister | 10 | [x] |
| 11 | Google UMP formu (kod: `gatherConsent`; AdMob panelinde mesaj yayınlanmalı), KVKK aydınlatma metni (landing, Faz 9) | 5 | [~] |
| 12 | iOS ATT istemi + açıklama metni (TR/EN/AR yerel dizeler `locales/native`, taban EN); reddedilirse kişiselleştirilmemiş reklam (kodda) | 5-6 | [~] |
| 13 | App Store gizlilik etiketlerinde reklam/izleme verileri beyan — `store/forms.md` §1 + `app.json > ios.privacyManifests` hazır; formu siz doldurursunuz | 10 | [~] |
| 14 | Play'de "Reklam içerir" işaretli; Veri Güvenliği'nde reklam kimliği; Android `AD_ID` izni | 10 | [ ] |
| 15 | `app-ads.txt` açılış sayfası kök dizininde yayında — şablon hazır, AdMob yayıncı kimliği ve barındırma bekliyor | 9 | [~] |
| 16 | Mağaza metinlerinde "reklamsız" yalnızca Premium için (`npm run store:check` denetler; marketing/ dahil) | 9 | [x] |
| 17 | Çocuk kitlesini doğrudan hedefleyen ifade yok ("aile" evet, "çocuklar için" hayır) (`store:check` denetler) | 9 | [x] |
| 18 | Test hesabı + inceleme notu — giriş zorunlu değil (misafir); not metni `store/forms.md` §4 hazır | 10 | [x] |
| 19 | Ekran görüntülerindeki her şey uygulamada gerçekten var — plan `store/screenshots.md`, mağaza metni iddiaları kodla tek tek eşlendi; görseller henüz üretilmedi | 9 | [~] |
| 20 | AdMob: max içerik derecesi G (kodda) + engelli kategoriler (`docs/setup-accounts.md` §2; panelde kullanıcı yapacak) | 5 | [~] |
| 21 | "Tabu" adı uygulamada/mağaza metninde/reklamda hiçbir yerde yok (`npm run store:check` temiz; `tabular-nums` yanlış pozitiftir) | 10 | [x] |
| 22 | "Hatalı soru bildir" çalışıyor (`question_reports` RLS ekleme-only; UI + çevrimdışı kuyruk hazır, canlı Supabase ile denenmedi) | 7 | [~] |
| 23 | Premium hediye/referral mekaniği mağaza kurallarına uygun (Apple 3.1.1 / Play Faturalandırma) — hediye v1.1 e ertelendi (öneri), referral RevenueCat promosyonu Faz 9 | 5 | [ ] |
| 24 | Apple ile girişli hesap silinirken Apple token iptali — Edge Function'lar (`apple-link`, `delete-account`) ve migration 0005 YAZILDI; **dağıtım + Apple anahtarı + TestFlight denemesi bekliyor** (`docs/setup-accounts.md` §6) | 5/10 | [~] |
| 25 | Üretim derlemesinde reklam birimi kimlikleri gerçek; test kimliği ve sahte premium YOK — `__DEV__` korumalı + `app.config.js` üretim koruması (eksik anahtar/AdMob kimliğinde derleme HATA verir); gerçek kimlikler hesap açılınca | 10 | [~] |
| 26 | Bildirim izni: yalnızca kullanıcı Lig'de "İftar hatırlatması"nı açınca istenir; iOS izin metni/Android POST_NOTIFICATIONS; Play Veri Güvenliği'nde bildirim beyanı | 8 | [~] |
| 27 | Lig ekranlarında reklam yok (iftar bildirimiyle açılan ekranlar dahil); Lig'de konum izni YOK, şehir yalnızca cihazda | 8 | [x] |

## Gönderim öncesi hızlı kontrol
- `npm run check` yeşil · `npx expo-doctor` temiz · `npm run store:check` yeşil (Tabu taraması dahil)
- Bundle ID/package son hâli hesaplarla eşleşiyor (`app.json`)
