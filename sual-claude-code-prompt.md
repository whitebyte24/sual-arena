# SUAL — Claude Code Başlangıç Prompt'u

> Bu dosyanın tamamını Claude Code'a ilk mesaj olarak yapıştır. Proje klasöründe boş bir dizinde başlat.

---

Sen bu projenin baş geliştiricisi ve ürün sorumlususun. Tek kişilik bir kurucuyla (ben) ve yardımcı bir ajanla (Antigravity / Gemini) çalışıyorsun. Hedef: **Ramazan 2027'den (Şubat başı) en az 4 hafta önce** App Store ve Google Play'de yayında olan, eğlenceli, ailece oynanan bir İslami bilgi yarışması.

## 0. Çalışma kuralları (token ve maliyet)

- Önce **plan modu**: tüm fazları 1 sayfalık plana dök, onayımı al, sonra kodla.
- Her fazın sonunda dur ve bana **en fazla 5 satır** rapor ver: ne bitti, ne kaldı, benden ne lazım.
- Proje kökünde kısa bir `CLAUDE.md` oluştur (en fazla 60 satır): mimari, komutlar, klasör yapısı, kurallar. Bağlamı oradan oku, aynı dosyaları tekrar tekrar okuma.
- Ayrıca `HANDOFF.md` oluştur: Antigravity'ye devredilecek işler burada listelenir (bkz. bölüm 9).
- Alt ajan (subagent) **açma**; sadece ben istersem.
- Toplu içerik üretimini (soru bankası, çeviri, pazarlama metinleri) **sen yazma**; şemayı ve doğrulama script'ini sen kur, üretimi `HANDOFF.md` üzerinden Antigravity'ye bırak.
- Uzun çıktıları sohbete basma, dosyaya yaz.
- Ücretli servis, ücretli paket ya da kredi kartı isteyen hiçbir şey ekleme. Tek kabul edilen maliyet: Apple Developer (99 $/yıl) ve Google Play (25 $ tek seferlik).

## 1. Skill ve plugin taraması (ilk iş)

Kodlamaya başlamadan önce mevcut skill ve plugin'leri tara. Şu ihtiyaçlar için uygun olanı varsa kur ve `CLAUDE.md`'ye not düş:
- React Native / Expo geliştirme
- App Store ve Google Play uyumluluk taraması (gönderim öncesi kontrol)
- Arayüz ve görsel tasarım
- Çoklu dil (i18n) ve RTL
- ASO / mağaza metinleri

Kurallar: Sadece ücretsiz olanlar. Her biri için tek satır gerekçe. Bulamadığın ihtiyacı kendin hafif bir script/checklist ile çöz. Bu adım için en fazla 10 dakikalık iş harca.

## 2. Kimlik

- **İsim:** Sual (Türkçe ve Arapçada "soru" demek: سؤال)
- **Mağaza başlığı:** `Sual: İslami Bilgi Yarışması` (Arapça: `سؤال: مسابقة إسلامية`)
- İlk iş: App Store ve Google Play'de "Sual" adının çakışıp çakışmadığını kontrol et (web araması). Çakışma varsa 3 alternatif öner: "Sual Arena", "Sual Ailem", "Sualle".
- **Ton:** Sıcak, saygılı, esprili ama asla dini konularla dalga geçmeyen. Maskot: insan veya hayvan değil, geometrik/İslami motifli bir karakter (ör. konuşan bir fener).
- **Renkler:** Zümrüt yeşili, gece laciverti, altın vurgu. Karanlık mod zorunlu.

## 3. Teknoloji (tamamı ücretsiz katman)

- **Uygulama:** Expo (React Native + TypeScript), Expo Router
- **Backend:** Supabase (auth, Postgres, Realtime) — ücretsiz katman
- **Abonelik:** RevenueCat — ücretsiz katman
- **Build/Gönderim:** EAS Build + EAS Submit — ücretsiz katman
- **Reklam:** Google AdMob (`react-native-google-mobile-ads`) + Google UMP onay formu — ücretsiz
- **Analitik:** PostHog veya Firebase Analytics — ücretsiz katman
- **Açılış sayfası:** Tek dosya HTML, GitHub Pages veya Vercel ücretsiz
- Kimlik doğrulama: Apple ile Giriş + Google ile Giriş + misafir modu (Apple şartı: başka sosyal giriş varsa Apple ile Giriş zorunlu)

## 4. Oyun modları

### 4.1 Düello (ana mod)
- 1'e 1 canlı, 5 soru, soru başına 10 sn, hızlı cevap bonusu
- Rakip 8 sn içinde bulunamazsa bot devreye girer (bot olduğu küçük bir etiketle belli olur — dürüstlük)
- Kategori seçimi: Kur'an, Siyer, Peygamber Kıssaları, İslam Tarihi, İlmihal (temel), Arapça Kelimeler

### 4.2 Arkadaş Odası
- 6 haneli kodla özel oda, 2–8 kişi
- Maç sonunda WhatsApp paylaşım kartı (skor + davet linki)

### 4.3 Aile Modu: "Söyleme!" (yasaklı kelime oyunu)
- **Tek cihaz, internetsiz, hesap gerektirmez.** Telefon elden ele geçer.
- 2 takım, tur süresi 60 sn (ayarlanabilir)
- Kartta 1 hedef kelime + 4 yasaklı kelime. Örnek: hedef "Kabe", yasaklı: Mekke, hac, tavaf, kıble.
- Butonlar: Doğru / Pas / Yasaklı söylendi (büyük, çocukların basabileceği boyutta)
- Zorluk seviyeleri: Çocuk (7–12), Genç, Yetişkin
- Lansmanda en az 600 kart (TR + AR)
- Not: "Tabu" adı tescilli bir markadır; uygulamada, mağaza metninde ve reklamlarda **hiçbir yerde** kullanma.

### 4.4 Günlük Soru
- Her gün herkese aynı 5 soru, seri (streak) sayacı, paylaşılabilir sonuç kartı (Wordle tarzı emoji ızgarası)

### 4.5 Ramazan Ligi
- 30 günlük sezon, her gün iftar saatinden sonra açılan özel set, Kadir Gecesi finali
- Uzaktan yapılandırılabilir olsun (Supabase tablosundan aç/kapat), yeniden yayın gerektirmesin

## 5. İçerik sistemi

- Soru şeması (JSON): `id, lang, category, difficulty, question, options[4], answer_index, source, explanation, review_status`
- Kart şeması (Söyleme!): `id, lang, level, target, forbidden[4], review_status`
- `scripts/validate-content.ts`: format, tekrar, 4 şık, tek doğru, kaynak alanı dolu, uzunluk sınırları, yasaklı kelimenin hedefin parçası olmaması
- Uygulamaya **sadece `review_status: approved`** içerik girer.
- Her soruda "Hatalı soru bildir" butonu → Supabase tablosu.

**İçerik kuralları (değişmez):**
- Mezhepler arası tartışmalı fıkıh sorusu yok.
- Peygamberlerin ve sahabenin görsel tasviri yok.
- Siyasi, mezhepçi, tekfirci içerik yok.
- Ayet ve hadis metinleri yalnızca güvenilir kaynaktan, kaynak gösterilerek.
- Yanlış şıklar saygısız veya komik olmayacak.

Lansman hedefi: 3.000 soru (TR 1.500, AR 1.500) + 600 kart. Üretimi Antigravity yapar, sen doğrularsın, son onay insan editördedir.

## 6. Dil

- Lansman: Türkçe, Arapça (tam RTL), İngilizce
- Sonraki sürüm: Endonezce, Malayca
- Tüm metinler `locales/` altında, kodda sabit metin yok
- Arapça metinler çeviri gibi değil, doğal Arapçayla yazılacak (Antigravity'ye not)

## 7. Gelir modeli

- **Ücretsiz (reklamlı):** Günde 10 düello, Günlük Soru, Söyleme! temel deste
- **Premium (aylık / yıllık / ömür boyu):** Sınırsız düello, tüm kategoriler, tüm Söyleme! desteleri, lig ödülleri, **reklamsız**
- **"Birine hediye et":** Premium'u başkasına hediye etme
- **Yasak:** Ganimet kutusu, şans çarkı, ücretli girişli ödüllü turnuva, kumar çağrıştıran her şey.

### 7.1 Reklam kuralları (ücretsiz plan)
- **Ödüllü reklam (ana gelir):** İzle → +3 düello hakkı / ipucu / seriyi kurtar. Her zaman isteğe bağlı.
- **Geçiş reklamı:** Yalnızca maç sonu ekranında, en sık 3 maçta bir, en az 3 dakika arayla. İlk oturumda ve ilk 3 maçta hiç gösterme.
- **Banner:** Sadece ana menü ve sonuç ekranında. Soru ekranında asla.
- **Reklamsız alanlar:** Soru ve düello ekranı, Söyleme! turu sırasında (elden ele geçerken akış bozulmasın; tur aralarında da yok, yalnızca oyun bitiminde 1 geçiş reklamı), ezan/iftar saati bildiriminden açılan ekranlar.
- **Kategori engeli (AdMob panelinde ve kodda belgelenecek):** Alkol, kumar ve bahis, flört ve tanışma, faizli kredi, kripto spekülasyon, cinsel içerik, astroloji ve fal, açık giyim ağırlıklı moda, korku. Maksimum reklam içerik derecesi: **G**.
- Reklam yükleme hatası oyunu asla durdurmaz; ödüllü reklam yüklenemezse ödülü yine ver.
- Uzaktan yapılandırma: reklam sıklığı Supabase tablosundan ayarlanabilir, Ramazan'da ve Kadir Gecesi'nde azaltılabilir.
- Paywall'da "Reklamları kaldır" vurgusu net olsun; geçiş reklamından sonra en fazla günde 1 kez yumuşak premium hatırlatması.

## 8. Mağaza uyumluluğu (gönderim öncesi zorunlu kontrol listesi)

Bölüm 1'de bir uyumluluk skill'i bulduysan onu çalıştır; bulamadıysan bu listeyi `store/compliance-checklist.md` olarak oluştur ve tek tek işaretle:

- [ ] Uygulama içinden hesap silme
- [ ] Apple ile Giriş (sosyal giriş varsa)
- [ ] Misafir modunda oynanabilirlik (giriş zorunlu değil)
- [ ] Gizlilik politikası ve kullanım koşulları (TR/AR/EN), açılış sayfasında yayında
- [ ] iOS PrivacyInfo.xcprivacy ve tüm izin açıklama metinleri
- [ ] Google Play Veri Güvenliği formu taslağı
- [ ] Şifreleme ihracat beyanı
- [ ] Abonelik ekranında fiyat, süre, otomatik yenileme ve iptal bilgisi; "Satın alımları geri yükle" butonu
- [ ] Yaş derecelendirmesi: 4+ / Herkes; kullanıcılar arası sohbet **yok** (moderasyon yükü olmasın, yalnızca hazır emoji tepkileri)
- [ ] Google Play hedef SDK güncel
- [ ] **Reklam onayı:** Google UMP formu (AB/İngiltere için zorunlu), KVKK aydınlatma metni
- [ ] **iOS ATT izni:** Kişiselleştirilmiş reklam için App Tracking Transparency istemi + açıklama metni; reddedilirse kişiselleştirilmemiş reklam
- [ ] PrivacyInfo.xcprivacy ve App Store gizlilik etiketlerinde reklam/izleme verileri beyan edildi
- [ ] Google Play'de "Reklam içerir" işaretli, Veri Güvenliği formunda reklam kimliği beyan edildi; Android'de `AD_ID` izni eklendi
- [ ] `app-ads.txt` açılış sayfasının kök dizininde yayında
- [ ] Mağaza metinlerinde "reklamsız" ifadesi yalnızca Premium için kullanılıyor
- [ ] Çocuk kitlesini doğrudan hedefleyen ifadeler yok (Aileler politikasına girmemek için "aile" vurgusu, "çocuklar için" değil)
- [ ] Test hesabı ve inceleme notu (reviewer notes) hazır
- [ ] Ekran görüntülerindeki her şey uygulamada gerçekten var

## 9. Antigravity'ye devredilecekler (`HANDOFF.md`)

Bunları sen yapma; görev tanımını, şemayı ve kabul kriterini yazıp `HANDOFF.md`'ye ekle:
1. Soru bankası üretimi (partiler hâlinde, 200'lük dosyalar, `content/raw/`)
2. Söyleme! kartları
3. Arapça yerelleştirme ve doğallık kontrolü
4. Mağaza ekran görüntüsü tasarımları ve tanıtım görselleri
5. Pazarlama içerikleri (bölüm 10)
6. Uygulamanın tarayıcı/emülatör üzerinden uçtan uca testi ve hata raporu

Antigravity çıktısını `content/raw/` veya `marketing/` altına koyar; sen doğrulama script'ini çalıştırır, hataları `HANDOFF.md`'ye geri yazarsın. Aynı dosya üzerinde iki ajan aynı anda çalışmaz.

## 10. ASO ve pazarlama çıktıları

`store/` klasörü:
- TR / AR / EN için: başlık, alt başlık (iOS), kısa açıklama (Play), uzun açıklama, anahtar kelime alanı (iOS, 100 karakter)
- Anahtar kelime havuzu: dini bilgi yarışması, İslami oyun, Kuran quiz, siyer, ilmihal, aile oyunu, yasaklı kelime, Ramazan oyunu
- 6 ekran görüntüsünün metin ve sıra planı: 1) Düello anı 2) Söyleme! aile modu 3) Günlük Soru serisi 4) Ramazan Ligi 5) Arkadaş odası 6) Arapça arayüz
- "Neler yeni" metin şablonu

`marketing/` klasörü:
- `launch-plan.md`: Bugünden Ramazan sonuna haftalık takvim
- `short-video-scripts.md`: 40 adet 15–30 sn video senaryosu (soru videoları, aile Söyleme! anları, "babam bu soruyu bilemedi" formatı)
- `creator-outreach.md`: İçerik üreticisi mesaj şablonları (TR/AR) ve gelir paylaşımlı kod sistemi
- `kurs-outreach.md`: Kur'an kursları için ücretsiz kurum lisansı teklifi ve "Kurslar Arası Ramazan Turnuvası" kurgusu
- `referral.md`: Arkadaşını getir → ikinize 7 gün premium
- `landing/index.html`: Bekleme listesi açılış sayfası (TR/AR/EN)

## 11. Fazlar

1. **Kurulum:** Skill taraması, isim kontrolü, CLAUDE.md, HANDOFF.md, iskelet proje, Supabase şeması
2. **Söyleme! (aile modu):** İnternetsiz çalıştığı için önce bunu bitir, erken test edilebilir
3. **Düello + bot + Arkadaş Odası**
4. **Günlük Soru + paylaşım kartları + seri**
5. **Abonelik + reklam (AdMob test kimlikleriyle) + hesap + hesap silme**
6. **i18n + RTL + karanlık mod**
7. **İçerik entegrasyonu + doğrulama**
8. **Ramazan Ligi (uzaktan açılır)**
9. **Mağaza ve pazarlama dosyaları**
10. **Uyumluluk taraması + EAS build + TestFlight / Kapalı test**

## 12. Bitti tanımı

- Tüm modlar iOS ve Android'de çalışıyor, Söyleme! internetsiz çalışıyor
- Uyumluluk listesi tamamen işaretli
- Onaylı içerik: 3.000 soru + 600 kart
- `store/` ve `marketing/` eksiksiz
- TestFlight ve Google Play kapalı test yayında
- Bana son raporu ver: açık riskler + mağaza gönderimi için yapmam gereken manuel adımlar (geliştirici hesapları, vergi/banka formları, inceleme notu)

Başla: önce bölüm 1 ve 2, sonra plan.
