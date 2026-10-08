# Sual — Plan (taslak, onay bekliyor)

**Bugün:** 8 Ekim 2026 · **Ramazan 2027 başlangıcı:** ~8 Şubat · **Mağazada yayında olma hedefi:** en geç ~11 Ocak 2027 (≈13 hafta)
**Mağazaya son gönderim:** ~28 Aralık (Apple incelemesi + olası ret payı)

## Bölüm 1 — Skill / plugin taraması (sonuç)
| İhtiyaç | Karar | Gerekçe |
|---|---|---|
| Expo / RN | `expo` (resmi Expo ekibi) | EAS, Router, dev-client, upgrade rehberleri; ücretsiz |
| Mağaza uyumluluğu | `review-ready:scan` (kurulu) | Apple/Google ret riski taraması; Faz 10'da çalışır |
| ASO / mağaza metni | `ASO Specialist` (tek skill, hesap gerektirmez) | Karakter limitleri + TR/AR/EN listing |
| i18n + RTL | Bulunamadı → `scripts/check-i18n.ts` | Eksik anahtar + sabit metin + RTL kontrol listesi |
| UI / görsel | Bulunamadı → `docs/design-tokens.md` | Renk/tipografi/maskot kuralları tek dosyada |
Atlananlar: ücretli/hesap isteyen ASO servisleri (Sonar, ASO Atlas, asodev API), Godot skill'leri (ilgisiz).

## Bölüm 2 — İsim kontrolü (sonuç: **ÇAKIŞMA VAR**)
- "SUAL – İslami Bilgi Yarışması" (App Store id1499267764, Play `com.Puppeteer.Islamiccontest`, 2020, İslam ve İhsan/Erkam tanıtımı, umre ödüllü) — **aynı ad, aynı kategori, aynı mağaza başlığı**. Mağaza URL'leri şu an 404 veriyor (kaldırılmış olabilir, **doğrulanamadı**).
- "Sual ve İlm – Yarışma & Bilgi" (App Store, Tarik Zengin, Education) — çok yakın ad.
- 2025'ten "Sual" adlı bir uygulama daha (mwm.ai/6749086816) — türü belirsiz.
- Öneri: tek başına "Sual" markasına girme. Alternatifler: **Sual Arena / Sual Ailem / Sualle** (+ "Sual" kelimesini tutmak istersen mevcut uygulamanın durumu elle App Store/Play'de doğrulanmalı).

## Teknik özet
Expo (SDK güncel) + TS + Expo Router · Supabase (Auth/Postgres/Realtime, RLS) · RevenueCat · AdMob+UMP+ATT · EAS · PostHog.
Klasörler: `app/` `src/{features,ui,lib,i18n}` `locales/{tr,ar,en}` `content/{raw,approved}` `supabase/` `scripts/` `store/` `marketing/`.
Söyleme! ve Günlük Soru'nun çekirdeği saf TS (ağ yok) → test edilebilir, çevrimdışı.

## Fazlar (hedef tarih)
| # | Faz | Bitiş | Çıktı |
|---|---|---|---|
| 1 | Kurulum | 16 Eki | CLAUDE.md, HANDOFF.md, iskelet, Supabase şeması, validate-content, **geliştirici hesapları başvurusu (sen)** |
| 2 | Söyleme! | 30 Eki | Çevrimdışı oyun, 2 takım, zamanlayıcı, 3 seviye, Expo Go'da test |
| 3 | Düello + bot + Oda | 20 Kas | Realtime eşleşme, 8 sn bot, 6 haneli oda, paylaşım kartı |
| 4 | Günlük Soru + seri | 30 Kas | Tarihe dayalı deterministik set, emoji kartı |
| 5 | Abonelik + reklam + hesap | 15 Ara | RC, AdMob test ID, UMP/ATT, Apple/Google/misafir giriş, hesap silme |
| 6 | i18n/RTL/karanlık | 20 Ara | TR/AR/EN, tam RTL |
| 7 | İçerik entegrasyonu | paralel, 20 Ara | 3.000 soru + 600 kart onaylı (darboğaz: insan editör) |
| 8 | Ramazan Ligi | 24 Ara | Uzaktan aç/kapat, iftar sonrası set |
| 9 | Mağaza/pazarlama dosyaları | paralel | `store/`, `marketing/` |
| 10 | Uyumluluk + build | 28 Ara gönderim | EAS, TestFlight, Play kapalı test (Play: yeni hesapta 12 test kullanıcısı × 14 gün şartı olabilir → erken başla) |

## Açık riskler / kararlar (senden)
1. **İsim** (yukarıda) — Faz 1'den önce karar şart; paket adı/bundle ID buna bağlı.
2. **Apple Developer + Google Play hesapları şimdi açılmalı** (doğrulama günler/haftalar sürebilir; Play'de yeni kişisel hesapta kapalı test şartı lansmanı geciktirebilir).
3. **"Birine hediye et":** Apple/Google abonelik hediyesini yerel desteklemiyor. Öneri: lansmanda ömür boyu paket için "hediye kodu" (RevenueCat promosyon yetkisi + Supabase kodu) — mağaza kuralları açısından riskli, Faz 5'te ayrıca değerlendirilecek; yoksa v1.1'e ertele.
4. **Söyleme! "Çocuk (7–12)" seviyesi** + reklam: Aileler politikasına girmemek için mağaza metninde "çocuklar için" denmez, yaş derecesi/reklam ayarları (G, kişiselleştirme) dikkatle seçilir.
5. **Supabase ücretsiz katman:** 1 hafta hareketsizlikte proje duraklar, Realtime eşzamanlı bağlantı sınırı (200) var → lansman/Ramazan trafiği için izleme; sınır aşılırsa tek maliyet kalemi olur (Pro 25 $/ay) — onayına bağlı.
6. **İftar saati:** konum izni yerine şehir seçimi + çevrimdışı vakit hesaplama kütüphanesi (izin ve gizlilik yükü azalır).
7. İçerik üretimi/onayı kritik yol: Faz 7'yi beklemeden Antigravity'ye Faz 1 sonunda ilk parti görevleri verilecek.
