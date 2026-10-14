# Lansman planı — 14 Ekim 2026 → 9 Mart 2027

Kurucu tek kişi, bütçe **sıfır** (ücretli reklam yok; gelir paylaşımı, ücretsiz lisans, topluluk). Hedef: **11 Ocak 2027'ye kadar iOS + Android'de yayında**; Ramazan 2027 ≈ **8 Şubat** (ay görünürlüğüne göre ±1 gün), bayram ≈ 9 Mart.
Tarihler Pazartesi başlangıçlı haftalardır. "Kim" sütunu: **K** = kurucu (insan), **C** = Claude Code, **T** = topluluk/gönüllü.

> **Kritik yol:** (1) içerik onayı → (2) Supabase/AdMob/RevenueCat/mağaza hesapları → (3) cihazda test → (4) **Play kapalı test (14 gün süren zorunluluk olabilir)** → (5) mağaza incelemesi → (6) yayın. Play kapalı test süresi hesap türüne göre değişir (yeni kişisel hesaplarda ≥12 test kullanıcısı, 14 gün kesintisiz istenebilir; Play Console'da "Üretime erişim" kartını kontrol et). Bunu **1 Aralık'tan geç başlatma**.

## Haftalık takvim

| # | Hafta | Faz | Hedef metrik | Görevler | Kim |
|---|-------|-----|--------------|----------|-----|
| 1 | 12–18 Eki | Hazırlık | Landing yayında; bekleme listesi açık | Alan adı kararı + landing barındırma (`docs/setup-accounts.md` §5); `config.js` doldur; Supabase proje + 4 migration; içerik onayına başla (TR önce) | K, C |
| 2 | 19–25 Eki | Hazırlık | 50 bekleme listesi kaydı | AdMob + RevenueCat + App Store Connect + Play Console ürünleri; `app-ads.txt` yayını; içerik onayı %30 | K |
| 3 | 26 Eki–1 Kas | Hazırlık | İçerik onayı ≥ 50% | Arapça içeriği anadili Arapça biri okusun; ilk 5 video çek (Söyleme! ve Düello) | K, T |
| 4 | 2–8 Kas | Test | İç test derlemesi (EAS) hazır | Cihazda uçtan uca test (`docs/android-emulator.md` + gerçek cihaz): düello, oda, Söyleme!, günlük, lig kilitli/açık, hesap silme, satın alma sandbox | K, C |
| 5 | 9–15 Kas | Test | Kritik hata sayısı 0 | Hata düzeltme; ekran görüntüleri çekimi (`store/screenshots.md`); creator listesi (≥ 30 aday) hazırla | K, C |
| 6 | 16–22 Kas | Ön-tanıtım | 150 bekleme listesi | İlk 10 creator mesajı (`creator-outreach.md`); 3 kurs/dernek ile görüşme (`kurs-outreach.md`); video 6-15 | K |
| 7 | 23–29 Kas | Ön-tanıtım | 250 kayıt | TestFlight iç + Play iç test; 15 test kullanıcısı topla (aile/arkadaş/kurs) | K, T |
| 8 | 30 Kas–6 Ara | **Kapalı test** | ≥ 12 aktif test kullanıcısı | **Play kapalı test başlasın**; TestFlight dış test; geri bildirim formu; içerik onayı %100 hedefi | K |
| 9 | 7–13 Ara | Kapalı test | Çökme oranı < %1 | Kapalı test sürüyor; mağaza metinleri son okuma (TR/AR/EN); gizlilik formları (App Privacy, Data safety) | K, C |
| 10 | 14–20 Ara | Kapalı test | 400 kayıt | Kapalı test bitişi (≥14 gün); `npm run content:verify-store` yeşil; mağaza build'i (prod içerik, prod reklam kimlikleri) | K, C |
| 11 | 21–27 Ara | **Gönderim** | İncelemeye gönderildi | iOS incelemeye gönder (inceleme notu + test hesabı); Play üretim başvurusu; 28 Aralık = **son gönderim günü** | K |
| 12 | 28 Ara–3 Oca | İnceleme | Onay | Reddedilirse düzelt-yeniden gönder (tampon: 1 hafta); lansman videoları hazır (hafta 6-11 çekimleri) | K |
| 13 | 4–10 Oca | İnceleme/Yayın | Yayına hazır | Mağaza sayfaları son kontrol; landing'de mağaza bağlantıları; bekleme listesine "yakında" e-postası | K |
| 14 | **11–17 Oca** | **YAYIN** | İlk hafta 1.500–4.000 indirme (gerçekçi aralık) | Yayın duyurusu (bekleme listesi, WhatsApp grupları, creator'lar); ilk 20 yorum/puan toplama; hata izleme | K, T |
| 15 | 18–24 Oca | Isınma | D1 tutunma ≥ %30; ortalama puan ≥ 4,3 | Hızlı sürüm 1.0.1 (hatalar); günlük soru paylaşım serisi; kurs turnuvası kaydı açılır | K, C |
| 16 | 25–31 Oca | Isınma | 5.000 toplam indirme | Lig sezonu hazırlığı: onaylı ≥155 soru/dil, `npm run league:sql`, `remote_config` ayarı; ilk creator videoları yayınlanır | K, C |
| 17 | 1–7 Şub | Isınma | 7.000 toplam indirme | "Ramazan geliyor" serisi; kurs turnuva kuralları paylaşılır; uygulama güncellemesi (Ramazan öncesi son sürüm) | K |
| 18 | **8–14 Şub** | **RAMAZAN 1. hafta** | Günlük aktif kullanıcı artışı | Lig sezonunu **aç** (remote config); her gün iftar sonrası paylaşım; iftar sonrası push (yalnızca kullanıcı izin verdiyse yerel bildirim) | K |
| 19 | 15–21 Şub | Ramazan 2 | D7 tutunma ≥ %15 | Haftalık "Lig şampiyonları" paylaşımı; kurslar arası turnuva 1. tur | K, T |
| 20 | 22–28 Şub | Ramazan 3 | 15.000 toplam indirme (iyi senaryo) | Kadir Gecesi finali duyurusu (≈ 27. gece öncesi); geri bildirim derleme | K |
| 21 | 1–9 Mar | Ramazan 4 + Bayram | Finale katılım | Kadir Gecesi finali (10 soru), turnuva finali, Bayram mesajı; sezonu kapat | K |
| — | 10 Mar+ | Tutundurma | — | Sezon sonrası: içerik güncellemesi (yeni onaylı partiler), hediye/referral v1.1 değerlendirmesi, Kurban Bayramı (≈ 16-20 Mayıs 2027) için plan | K, C |

Sayılar tahmindir: organik + topluluk ağırlıklı; ücretli edinim yok. Gerçekleşen değerlere göre haftalık güncelle.

## Ramazan günlük eylem listesi (30 gün)
Her gün **tek satır**, 5 dakikada yapılacak iş. Ramazan'ın ilk günü ≈ 8 Şubat (gün 1); kesin tarihi ay görünürlüğüne göre kaydır.

| Gün | Eylem |
|-----|-------|
| 1 | "Ramazan Ligi açıldı" duyurusu: ekran görüntüsü + 15 sn video; bekleme listesine ve gruplara gönder |
| 2 | Lig'de ilk iftar sonrası seti paylaş: "Bugünün seti açıldı" kartı (soru metni YOK, yalnızca duyuru) |
| 3 | Günlük Soru emoji ızgarası paylaşım çağrısı: "Serini paylaş" |
| 4 | Kurslara "turnuva kaydı" hatırlatması (`kurs-outreach.md`) |
| 5 | Söyleme! aile kısa videosu (aile iftar masası) |
| 6 | Creator'lardan biri içerik paylaşır (kod: `SUAL-…`) |
| 7 | Hafta özeti: ilk hafta liderleri (adsız/rumuzlu, izinli) |
| 8 | "Bunu biliyor muydun" kartı (kaynaklı, Kur'an kategorisi) |
| 9 | Düello meydan okuması: "Arkadaşını odaya çağır" |
| 10 | İlk 10 gün teşekkür mesajı + hata/öneri toplama formu |
| 11 | Arapça arayüz videosu (AR hesap) |
| 12 | Söyleme! "kelime anlat" mini yarışması (kendi sosyal hesabında) |
| 13 | Kurs turnuvası 1. tur sonuçları |
| 14 | Hafta özeti 2 + "Premium ile reklamsız oyna" yalnızca bilgilendirme (zorlama yok) |
| 15 | Ramazan ortası: sabır/şükür temalı günlük soru görseli |
| 16 | Siyer "bunu biliyor muydun" kartı |
| 17 | Bedir günü (17 Ramazan) için kısa bilgi kartı (kaynaklı) |
| 18 | Creator ikinci dalga |
| 19 | Aile Söyleme! turnuvası fikri (evde) |
| 20 | Hafta özeti 3 |
| 21 | Kadir Gecesi finali hazırlık duyurusu (teaser) |
| 22 | "Son 10 gece" temalı sakin içerik (ibadet vurgusu, oyun baskısı yok) |
| 23 | Kurs turnuvası yarı final |
| 24 | Kadir Gecesi finali (27. gecenin öncesindeki iftar) duyurusu |
| 25 | Hatırlatma + canlı soru-cevap (kendi hesabında) |
| 26 | **Kadir Gecesi finali açılır** (Ramazan'ın 26. gününün iftarından sonra 10 soruluk set); duyuru + kurslara hatırlatma |
| 27 | Kadir Gecesi: sakin mesaj, finale katılım hatırlatması (rekabet vurgusu yok) |
| 28 | Final sonuçları + teşekkür |
| 29 | Bayram hazırlığı: bayram mesajı görseli |
| 30 | Ramazan sonu: sezonu kapat, sonuç ve teşekkür; anket (neyi sevdin?) |

> Sakin ton: Son 10 gecede rekabet vurgusu yapma; ibadete saygı. Dini ibadet saatinde (teravih/sahur) bildirim gönderme.

## Kanallar (bütçesiz)
- **Landing + bekleme listesi** (TR/AR/EN) — tüm paylaşımlarda tek bağlantı.
- **WhatsApp grupları/yayın listeleri** (aile, mahalle, kurs, dernek): "kısa mesaj + ekran görüntüsü" şablonu `referral.md` paylaşım metinleri.
- **Kısa video** (Instagram Reels, TikTok, YouTube Shorts): 40 senaryo `short-video-scripts.md` (haftada 4–5 video).
- **Creator gelir paylaşımı** ve **kurs lisansı**: `creator-outreach.md`, `kurs-outreach.md`.
- **Mağaza optimizasyonu**: `store/` metinleri, anahtar kelimeler (ilk sürümden 2 hafta sonra 2–3 kelime değiştir).
- Reklam/satın alma kampanyası, anket-çekilişi, ödüllü para vaadi **yok**.

## İzlenecek metrikler (haftalık)
Bekleme listesi kaydı · mağaza sayfası görüntüleme→indirme · D1/D7 tutunma · günlük aktif kullanıcı · düello başına tamamlama · Premium dönüşüm (%) · puan/yorum · "Hatalı soru bildir" sayısı (içerik kalitesi) · çökme oranı.
Araçlar: App Store Connect / Play Console panelleri (ücretsiz); uygulama içi analitik v1.0'da yok (gizlilik gereği).

## Riskler ve karşı önlemler
| Risk | Önlem |
|------|-------|
| Play kapalı test süresi kayarsa yayın gecikir | 1 Aralık'tan önce başlat; 12+ test kullanıcısını Kasım'da hazırla |
| Apple incelemesinde ret | Uyumluluk kontrol listesi (`store/compliance-checklist.md`); gönderimi 28 Aralık'a bırakma, tampon 1 hafta |
| İçerik onayı yetişmezse (kategori boş) | `content:verify-store` kapısı; dil başına ≥300 onaylı soru olmadan göndermeme |
| Düello rakibi bulunamaz (az kullanıcı) | BOT etiketli rakip zaten var; "arkadaş odası" ve Söyleme! internetsiz çalışır |
| Arapça metin/RTL kalitesi | Anadili Arapça biri okusun; mağaza AR metni yayından önce ikinci göz |
| Hukuki metinler | Hukukçu/KVKK uzmanı okuması önerilir (şablon, hukuki danışmanlık değildir) |
