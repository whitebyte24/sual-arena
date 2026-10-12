# Mağaza uyumluluk kontrol listesi

Durum: `[ ]` yapılmadı · `[~]` kısmen/kod hazır, doğrulanmadı · `[x]` tamam ve doğrulandı. Faz 10'da `review-ready:scan` ile çapraz kontrol edilir.

| # | Madde | Faz | Durum |
|---|---|---|---|
| 1 | Uygulama içinden hesap silme (`delete_my_account()` RPC + Hesap ekranı; canlı Supabase ile denenmedi; Apple token iptali eksik, bkz. #24) | 5 | [~] |
| 2 | Apple ile Giriş (başka sosyal giriş varsa zorunlu) — kod hazır (iOS yerel), cihazda denenmedi | 5 | [~] |
| 3 | Misafir modunda oynanabilirlik (giriş zorunlu değil; Supabase anonymous) — tüm modlar girişsiz açık | 5 | [x] |
| 4 | Gizlilik politikası + kullanım koşulları (TR/AR/EN), açılış sayfasında yayında | 9 | [ ] |
| 5 | iOS `PrivacyInfo.xcprivacy` + tüm izin açıklama metinleri | 10 | [ ] |
| 6 | Google Play Veri Güvenliği formu taslağı | 10 | [ ] |
| 7 | Şifreleme ihracat beyanı (`ITSAppUsesNonExemptEncryption=false` app.json'da) | 1 | [x] |
| 8 | Abonelik ekranında fiyat, süre, otomatik yenileme, iptal bilgisi + "Satın alımları geri yükle" (Paywall hazır; TR/EN/AR) | 5 | [~] |
| 9 | Yaş derecelendirmesi 4+ / Herkes; kullanıcılar arası sohbet YOK (yalnız hazır emoji; kod: EMOJIS beyaz listesi, session.ts) | 3 | [~] |
| 10 | Google Play hedef SDK güncel (Expo SDK 57 varsayılanı; Faz 10'da doğrula) | 10 | [ ] |
| 11 | Google UMP formu (kod: `gatherConsent`; AdMob panelinde mesaj yayınlanmalı), KVKK aydınlatma metni (landing, Faz 9) | 5 | [~] |
| 12 | iOS ATT istemi + açıklama metni (TR/EN/AR yerel dizeler `locales/native`, taban EN); reddedilirse kişiselleştirilmemiş reklam (kodda) | 5-6 | [~] |
| 13 | App Store gizlilik etiketlerinde reklam/izleme verileri beyan | 10 | [ ] |
| 14 | Play'de "Reklam içerir" işaretli; Veri Güvenliği'nde reklam kimliği; Android `AD_ID` izni | 10 | [ ] |
| 15 | `app-ads.txt` açılış sayfası kök dizininde yayında | 9 | [ ] |
| 16 | Mağaza metinlerinde "reklamsız" yalnızca Premium için | 9 | [ ] |
| 17 | Çocuk kitlesini doğrudan hedefleyen ifade yok ("aile" evet, "çocuklar için" hayır) | 9 | [ ] |
| 18 | Test hesabı + inceleme notu (reviewer notes) hazır | 10 | [ ] |
| 19 | Ekran görüntülerindeki her şey uygulamada gerçekten var | 9 | [ ] |
| 20 | AdMob: max içerik derecesi G (kodda) + engelli kategoriler (`docs/setup-accounts.md` §2; panelde kullanıcı yapacak) | 5 | [~] |
| 21 | "Tabu" adı uygulamada/mağaza metninde/reklamda hiçbir yerde yok (`grep -ri tabu` temiz) | 10 | [ ] |
| 22 | "Hatalı soru bildir" çalışıyor (`question_reports` RLS ekleme-only) | 7 | [~] |
| 23 | Premium hediye/referral mekaniği mağaza kurallarına uygun (Apple 3.1.1 / Play Faturalandırma) — hediye v1.1 e ertelendi (öneri), referral RevenueCat promosyonu Faz 9 | 5 | [ ] |
| 24 | Apple ile girişli hesap silinirken Apple token iptali (Edge Function + Apple anahtarı) | 5 | [ ] |
| 25 | Üretim derlemesinde reklam birimi kimlikleri gerçek; test kimliği ve sahte premium YOK (`__DEV__` korumalı) | 10 | [ ] |

## Gönderim öncesi hızlı kontrol
- `npm run check` yeşil · `npx expo-doctor` temiz · `grep -rIi "tabu" src locales store marketing` boş
- Bundle ID/package son hâli hesaplarla eşleşiyor (`app.json`)
