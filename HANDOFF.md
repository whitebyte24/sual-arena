# HANDOFF — Antigravity (Gemini) görev listesi

Bu dosya Claude Code ↔ Antigravity arasındaki tek iletişim kanalıdır. Önce `CLAUDE.md` (özellikle "İçerik kuralları") ve `docs/design-tokens.md` oku.

## Çalışma protokolü
1. Aynı dosya üzerinde iki ajan aynı anda çalışmaz. Başlamadan önce aşağıdaki **Kilit tablosu**na satır ekle, bitince sil.
2. Sen yalnızca `content/raw/`, `marketing/`, `store/screenshots/` altına yazarsın. `src/`, `supabase/`, `locales/` Claude Code'undur (Arapça/İngilizce çeviri önerilerini `marketing/locale-suggestions/` altına koy).
3. Her teslimden sonra `npm run content:validate` çalıştır. Hata varsa kendin düzelt; geçemeyenleri "Geri bildirim" bölümüne yaz.
4. Tüm içerik `review_status: "draft"` teslim edilir. `approved` yapma — onay yalnızca insan editördedir.
5. Uydurma kaynak yazma. Emin olmadığın soruyu üretme; atla.

### Kilit tablosu
| Dosya/klasör | Kim | Başlangıç |
|---|---|---|
| (boş) | | |

## Görev 1 — Soru bankası (TR + AR)
- **Hedef:** 3.000 soru = TR 1.500 + AR 1.500. Dil başına 6 kategori × 250 (`quran, siyer, kissalar, tarih, ilmihal, arapca`). Zorluk dağılımı: %40 kolay (1), %40 orta (2), %20 zor (3).
- **Dosyalar:** `content/raw/questions.<lang>.<category>.<NNN>.json`, her dosyada en fazla 200 soru. Kök bir JSON dizisidir.
- **Şema:** `src/content/schema.ts` ve örnek `content/raw/_questions.example.json`.
  `id` = `q-<lang>-<category>-<6 hane>`, dil+kategori içinde 000001'den sıralı.
- **Kurallar:** 4 şık, tek doğru; `answer_index` 0–3 ve doğru şık dosya içinde rastgele dağılsın (çoğu 0 olmasın). Soru ≤160, şık ≤60, açıklama ≤300, kaynak ≤120 karakter.
  `source` zorunlu ve doğrulanabilir (ör. "Bakara 2/255", "Buhârî, Îmân 1", "İbn Hişâm, es-Sîre"). Hadis numarası emin değilsen kitap+bab ver.
  Yanlış şıklar saygılı ve makul olsun; esprili/komik şık yok. Mezhepler arası ihtilaflı fıkıh, siyaset, mezhepçilik, tekfir yok.
- **Arapça:** Türkçeden çeviri değil, Arapçası doğal ve soru sorma kalıbına uygun yazılsın (Fusha, sade). Arapça soru setinin konuları TR'den bağımsız olabilir. Kur'an ayetleri harekeli, kaynaktan birebir.
- **Kabul:** `npm run content:validate` 0 hata, tekrar yok, dağılım tablosu `marketing/content-stats.md` içinde.
- **Sıra:** önce her dilde 50 soruluk pilot (`quran` + `siyer`) → Claude Code doğrular → insan editör örnekler → kalan partiler.

## Görev 2 — Söyleme! kartları
- **Hedef:** 600 kart = TR 300 + AR 300; her dilde seviye başına 100 (`child` 7–12, `teen`, `adult`).
- **Dosya:** `content/raw/cards.<lang>.<NNN>.json` (≤200 kart). Örnek: `content/raw/_cards.example.json`. `id` = `c-<lang>-<6 hane>`.
- **Kurallar:** 1 hedef + tam 4 yasaklı. Yasaklı kelime hedefin kendisi veya parçası olamaz (ör. hedef "Hac" → yasaklı "Hacı" olmaz). Aynı hedef tekrar edilmez.
  `child` seviyesi: bilinen, somut kavramlar (Kâbe, oruç, iftar, seccade, tesbih…). `adult`: daha soyut/tarihî.
  Peygamber/sahabe ismi hedef olabilir ama yasaklı kelimeler saygılı kalsın; görsel tasvir ima eden ifade yok. "Tabu" kelimesini hiçbir yerde kullanma.
- **Kabul:** validator 0 hata + `marketing/content-stats.md` güncel.
- `content/raw/cards.*.dev-seed.json` Claude Code'un test verisidir (24 kart); dokunma, kimlikleri (`c-xx-9xxxxx`) kullanma. Kendi kimliklerin 000001'den başlar.

## Görev 3 — Arapça yerelleştirme ve doğallık kontrolü
- `locales/ar.json` ve mağaza metinleri (`store/`) için: Claude Code'un yazdığı Arapça metinleri doğallık açısından incele; öneri dosyası `marketing/locale-suggestions/ar.md` (anahtar → önerilen metin → gerekçe).
- RTL'de bozulan ifade (sayı, noktalama, karışık TR/EN kelime) varsa işaretle.
- **Kabul:** Her anahtar için "uygun / değişsin" kararı. Değişenler için öneri.

## Görev 4 — Mağaza ekran görüntüsü ve tanıtım görselleri
- Plan `store/screenshot-plan.md` (Faz 9'da Claude Code yazar): 1) Düello anı 2) Söyleme! aile modu 3) Günlük Soru serisi 4) Ramazan Ligi 5) Arkadaş odası 6) Arapça arayüz.
- Çıktı: `store/screenshots/<ios|android>/<tr|ar|en>/0N.png`. iOS 6.9" (1290×2796) ve Android telefon (1080×1920+).
- Renkler/maskot: `docs/design-tokens.md`. Ekran görüntüsündeki her şey uygulamada gerçekten bulunmalı. "Reklamsız" ifadesi yalnızca Premium bağlamında.
- **Başlangıç koşulu:** Faz 5+ ekranları çalışır halde (Claude Code bildirir).

## Görev 5 — Pazarlama içerikleri
`marketing/` altına: `launch-plan.md`, `short-video-scripts.md` (40 adet, 15–30 sn), `creator-outreach.md` (TR/AR), `kurs-outreach.md`, `referral.md`, `landing/index.html` (TR/AR/EN, bekleme listesi).
- Ton: sıcak, saygılı, esprili ama dinle alay yok. "Tabu" yok, "çocuklar için" yok ("aile").
- `landing/` içinde `app-ads.txt` yer tutucusu bırak (yayıncı kimliği AdMob'dan gelecek).
- **Kabul:** Her dosya brief'e uygun; tarihler 8 Ekim 2026 → Ramazan sonu (~9 Mart 2027) aralığında.

## Görev 6 — Uçtan uca test ve hata raporu
- Başlangıç koşulu: Claude Code `HANDOFF.md`'ye "TEST HAZIR" notu + çalıştırma talimatı ekler (EAS preview build veya Expo Go).
- Senaryolar: her mod, misafir→giriş geçişi, hesap silme, abonelik ekranı (sandbox), reklam akışı kuralları, AR/RTL, karanlık mod, çevrimdışı Söyleme!.
- Çıktı: `marketing/qa-report.md` — tablo: senaryo | adım | beklenen | gerçekleşen | ekran görüntüsü yolu | şiddet.

## Geri bildirim (Claude Code yazar)
_(henüz yok)_

## Durum
| Görev | Durum |
|---|---|
| 1 Soru bankası | bekliyor — pilot parti başlatılabilir |
| 2 Kartlar | bekliyor — pilot parti başlatılabilir |
| 3 AR kontrol | **HAZIR** — `locales/ar.json` (250 anahtar) ve `locales/native/ar.json` incelenebilir; RTL ekran görüntüsü için web önizlemesi: `npm start` → Hesap → Dil |
| 4 Görseller | Faz 5+ sonrası |
| 5 Pazarlama | başlatılabilir (öncelik düşük) |
| 6 E2E test | Faz 10 öncesi |
