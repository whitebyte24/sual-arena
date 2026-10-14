# Mağaza formları — hazır cevaplar (Apple App Privacy · Play Data safety · yaş derecelendirme · inceleme notları)

Bunlar **uygulamanın gerçek veri akışına** göre hazırlanmış taslaklardır (`marketing/landing/privacy.html` ile tutarlı). Formları siz doldurup gönderirsiniz; bir şeyi değiştirirseniz hem gizlilik metnini hem `app.json > ios.privacyManifests` içindeki beyanı güncelleyin.
Mevcut durum: analitik/çökme SDK'sı **yok** (Firebase/Sentry/PostHog kullanılmıyor); reklam: Google AdMob; satın alma: RevenueCat; sunucu: Supabase.

## 1) Apple — App Privacy ("beslenme etiketleri")
**Takip (Tracking):** Evet — yalnızca reklam kimliği (IDFA), AdMob üzerinden, ATT izni verilirse. (ATT reddedilirse kişiselleştirilmemiş reklam.)

| Veri türü | Toplanıyor mu | Kullanıcıya bağlı | Takip | Amaç |
|-----------|---------------|-------------------|-------|------|
| Cihaz kimliği (reklam kimliği) | Evet | Hayır | **Evet** | Üçüncü taraf reklamcılık |
| Kullanıcı kimliği (anonim/hesap kimliği) | Evet | Evet | Hayır | Uygulama işlevselliği |
| E-posta adresi (Apple/Google ile girilirse) | Evet | Evet | Hayır | Uygulama işlevselliği |
| Satın alma geçmişi (abonelik durumu, RevenueCat) | Evet | Evet | Hayır | Uygulama işlevselliği |
| Oyun içeriği (Lig puanları) | Evet | Evet | Hayır | Uygulama işlevselliği |
| Diğer kullanıcı içeriği ("Hatalı soru bildir" notu) | Evet | Evet (hesap silinince bağ kalkar) | Hayır | Uygulama işlevselliği |
| Konum, kişiler, fotoğraf, mikrofon, kamera, sağlık, finansal bilgi, gezinme/arama geçmişi | **Hayır** | — | — | — |
| Reklam SDK'sının topladığı (Google) kullanım/tanılama verileri | Google'ın SDK beyanı geçerlidir (SDK'nın kendi gizlilik manifesti) | | | |

Gizlilik Politikası URL: `https://<alan>/privacy` · Kullanıcı gizlilik seçenekleri URL: `https://<alan>/delete-account`.

## 2) Google Play — Data safety
**Veri toplanıyor mu?** Evet. **Paylaşılıyor mu?** Reklam ve satın alma hizmet sağlayıcılarıyla (hizmet sağlayıcı istisnası + reklam). **Aktarımda şifreleme:** Evet. **Silme talebi:** Evet — uygulama içi ve web: `https://<alan>/delete-account`.

| Veri türü | Toplanır | Paylaşılır | Amaç | İsteğe bağlı mı |
|-----------|----------|------------|------|------------------|
| Cihaz veya diğer kimlikler (reklam kimliği) | Evet | Evet (Google AdMob) | Reklamcılık veya pazarlama | Hayır (ücretsiz sürümde) |
| Kullanıcı kimlikleri (hesap kimliği) | Evet | Hayır | Uygulama işlevleri, hesap yönetimi | Hayır |
| E-posta adresi | Evet (giriş yapılırsa) | Hayır | Hesap yönetimi | Evet (misafir oynanabilir) |
| Satın alma geçmişi | Evet | Evet (RevenueCat — hizmet sağlayıcı) | Uygulama işlevleri | Hayır |
| Oyun içi etkinlik / puanlar | Evet | Hayır | Uygulama işlevleri (sıralama) | Evet (Lig'e katılırsanız) |
| Diğer kullanıcı tarafından oluşturulan içerik (hata bildirim notu) | Evet | Hayır | Uygulama işlevleri / içerik kalitesi | Evet |
| Konum, kişiler, fotoğraf/video, ses, dosyalar, takvim, sağlık, finans, web/uygulama geçmişi, mesajlar | **Hayır** | — | — | — |

Ek beyanlar: **Reklam içerir: Evet** · `com.google.android.gms.permission.AD_ID`: **Evet** (reklam kimliği kullanılıyor) · Veri şifrelenir: Evet · Kullanıcılar silme isteyebilir: Evet.

## 3) Yaş derecelendirme ve hedef kitle
- **Apple yaş derecelendirmesi:** Soru formunda şiddet/cinsellik/kumar/alkol/korku/tıbbi hepsi "Yok"; kullanıcı üretimi içerik **yok** (sohbet yok); sınırsız web erişimi **yok**; kumar benzeri mekanik **yok**. Beklenen sonuç: **4+** (soru metinleri dini bilgidir; dini içerik ayrı bir soru değildir).
- **Google Play içerik derecelendirmesi (IARC):** Şiddet/cinsellik/uyuşturucu yok; kullanıcılar arası iletişim yok; konum paylaşımı yok; satın alma var (abonelik/ömür boyu); reklam var. Beklenen: **Herkes (3+)**.
- **Hedef kitle ve içerik (Play):** Önerilen seçim **13 yaş ve üzeri** (çocuk hedef kitlesi için tasarlanmamıştır; aile içeriği vardır). Söyleme! seviye etiketi "7–12 yaş" **seviye adıdır**, pazarlama hedefi değildir; mağaza metninde çocuk kitlesini hedefleyen ifade **yoktur** (`npm run store:check` denetler).
  *Risk notu:* Google, uygulamanın çocuklara da hitap ettiğine karar verirse Aileler Politikası'nı (onaylı reklam ağı, çocuk yönelimli işleme) uygulatabilir. Bu durumda: `maxAdContentRating = G` zaten ayarlı, reklamlar yalnızca ana menü/sonuç ekranlarında; ek olarak çocuk yönelimli işleme etiketi (`tagForChildDirectedTreatment`) ve onaylı reklam ağı kuralı uygulanır (kodda küçük bir değişiklik). Karar gerekirse **13+** yerine "13 yaş altı dahil, karma kitle" seçip gerekli beyanı yapın.
- **AdMob:** Maksimum içerik derecesi **G**; engelli kategoriler (alkol, kumar/bahis, flört, faizli kredi, kripto, cinsel, astroloji/fal, açık giyim, korku) panelde işaretlenir (`docs/setup-accounts.md` §2).

## 4) İnceleme notları (App Store Connect → App Review Information; Play → App access)
> **Türkçe/English kısa not (kopyala-yapıştır):**
>
> Sual Arena is an Islamic knowledge quiz (Turkish/Arabic/English UI). **No account is required**: the app opens directly and all modes work as a guest (anonymous sign-in). Sign in with Apple/Google is optional and only keeps the account across devices.
> • Duel: if no human opponent is found within 8 seconds, the player faces an opponent clearly labelled **BOT**. • Friends Room: private room with a 6-digit code; there is **no chat**, only four preset emoji. • Don't Say It!: single-device offline party game. • Daily Question: 5 questions per day with a streak.
> • **Ramadan League** is closed (shows "season not open") until the season is enabled remotely before Ramadan 2027; it contains no purchases.
> • Premium (monthly/yearly auto-renewable subscription and a one-time lifetime option) removes ads and unlocks all categories/decks; use the sandbox tester to test purchases; "Restore purchases" is on the paywall and the Account screen.
> • Account deletion: Account → Delete account (in-app); web page: https://<alan>/delete-account.
> • Ads (Google AdMob) appear only in the free version, only on the home and result screens plus an occasional interstitial after a finished match; never during questions, duels or rounds. ATT (iOS) and the UMP consent form (EEA/UK) are shown before ads.
> • Content: every question has a cited source and was reviewed by a human editor; we avoid topics disputed between schools of thought. A "Report a problem" button is on every answer screen.
> Demo credentials: none needed (guest mode).

**Play "App access":** Tüm işlevler giriş gerektirmeden kullanılabilir → "Tüm işlevler özel erişim olmadan kullanılabilir".
**Apple "Sign-in required" kutusu:** işaretlemeyin (giriş zorunlu değil).

## 5) Gönderimden hemen önce kısa kontrol
- [ ] `npm run check` yeşil · `npm run content:verify-store` yeşil (yalnız onaylı içerik, dil başına yeterli hacim)
- [ ] EAS ortam değişkenleri tam (`app.config.js` koruması üretimde eksikse hata verir)
- [ ] `https://<alan>/privacy`, `/terms`, `/delete-account`, `/app-ads.txt` canlı ve açılıyor
- [ ] RevenueCat ürünleri + mağaza abonelik bilgileri (ad, süre, fiyat) girildi; abonelik grubu yerelleştirmeleri (TR/AR/EN) tamam
- [ ] Apple belirteç iptali fonksiyonları dağıtıldı ve TestFlight'ta denendi (`docs/setup-accounts.md` §6)
- [ ] Ekran görüntüleri 6'lı set (`store/screenshots.md`); özellik grafiği (Play)
- [ ] Veri güvenliği + App Privacy formları yukarıdaki tablolarla doldurulup gizlilik metniyle karşılaştırıldı
