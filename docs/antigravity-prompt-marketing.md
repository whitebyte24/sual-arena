# Antigravity prompt'u — Pazarlama + Arapça inceleme (Faz 9)

Kullanım: Antigravity'de `D:\SualApp` klasörünü aç → aşağıdaki bloğu olduğu gibi yapıştır. Bittiğinde bana "Antigravity bitirdi" de; ben `npm run store:check` ve inceleme yapıp geri bildirim yazarım.
Landing sayfası, gizlilik/koşullar, mağaza metinleri ve `app-ads.txt` ZATEN yazıldı (Claude Code); Antigravity bunlara dokunmaz.

---

## PROMPT (yapıştır)

```
Sen "Sual Arena" adlı İslami bilgi yarışması uygulamasının PAZARLAMA YAZARISIN. Kod yazmıyorsun; yalnızca Markdown dosyaları üretiyorsun.
Girişimci tek kişi, bütçe SIFIR (ücretli reklam, ücretli araç, influencer ödemesi YOK; yalnızca gelir paylaşımı / ücretsiz lisans / topluluk).
Hedef: uygulama en geç ~11 Ocak 2027'de iOS+Android'de yayında, Ramazan 2027 ≈ 8 Şubat – 9 Mart.

═══ 0) ÖNCE OKU (yazmaya başlamadan) ═══
1. CLAUDE.md → "İçerik kuralları (değişmez)", "Reklam kuralları", "Kimlik"
2. HANDOFF.md → "Çalışma protokolü", "Görev 3", "Görev 5"
3. store/listing.tr.json, listing.ar.json, listing.en.json (mağaza metinleri: ton ve iddialar buradan; çelişme)
4. store/screenshots.md, store/keywords.md
5. marketing/landing/index.html (sayfadaki özellik cümleleri) ve store/compliance-checklist.md

═══ 1) UYGULAMADA GERÇEKTEN OLANLAR (yalnızca bunlardan söz et) ═══
• Düello: birebir canlı, 5 soru × 10 sn, hız bonusu; rakip yoksa 8 sn sonra "BOT" etiketli rakip. Günde 10 düello (ücretsiz).
• Arkadaş Odası: 6 haneli kod, 2–8 kişi. Sohbet YOK, yalnızca 4 hazır emoji.
• Söyleme!: tek telefon, internetsiz, 2 takım, ayarlanabilir süre; seviyeler çocuk/genç/yetişkin. (Ücretsizde çocuk+genç, Premium'da hepsi.)
• Günlük Soru: herkese aynı 5 soru, seri (streak), emoji ızgarası paylaşımı; seri kurtarma ödüllü reklamla.
• Ramazan Ligi: sezon uzaktan açılır; her gün iftardan sonra açılan 5'lik set, Kadir Gecesi finali (10 soru), sıralama tablosu.
• Kategoriler: Kur'an, Siyer, Kıssalar (ücretsiz); + Tarih, İlmihal, Arapça (Premium). Diller: TR, AR (tam RTL), EN arayüz.
• Premium: reklamsız, tüm kategori/deste, sınırsız düello. Aylık/yıllık abonelik + ömür boyu.
• Misafir olarak oynanır (giriş şart değil). Her soruda "Hatalı soru bildir".
OLMAYAN ŞEYLER (ASLA vaat etme): hediye abonelik, kullanıcılar arası sohbet, canlı yayın, ödüllü para/çekiliş, rozet mağazası, web sürümü, tablet uygulaması iddiası, "yapay zeka" iddiası, dini hüküm/fetva.

═══ 2) NE ÜRETECEKSİN (marketing/ altına) ═══
A) marketing/launch-plan.md — 8 Ekim 2026 → 9 Mart 2027 haftalık takvim (hafta numarası + tarih aralığı). Fazlar: bekleme listesi (Ekim–Aralık), kapalı test/TestFlight (Aralık), yayın (≤11 Ocak), Ramazan öncesi ısınma (Ocak–8 Şubat), Ramazan'ın 30 günü (her gün için tek satırlık eylem: paylaşım, Lig duyurusu, Kadir Gecesi finali), Ramazan sonrası tutundurma. Her hafta için: hedef metrik (bekleme listesi / indirme / D1-D7 tutunma), 2-4 görev, kim yapar (kurucu/Antigravity/topluluk). Gerçekçi sayılar, şişirme yok.
B) marketing/short-video-scripts.md — TAM 40 senaryo, her biri 15–30 sn. Başlık biçimi: `### Video 01 — <başlık>` (01…40). Her senaryoda: Dil (TR/AR/EN; dağılım TR 20, AR 14, EN 6) · Süre · Kanca (ilk 2 sn) · Sahne sahne anlatım · Ekranda yazı · Sesli metin · Kapanış (CTA: "bekleme listesine katıl" / "mağazada ara") · Hashtag (≤5). Konu çeşitliliği: düello anı, Söyleme! aile (gülümseten ama saygılı), günlük soru serisi, Ramazan Ligi iftar sonrası, "bunu biliyor muydun" bilgi kartları (kaynaklı), arkadaş odası, Arapça RTL, kurs/öğrenci turnuvası. Peygamber/sahabe görseli veya canlandırması YOK; ses taklidi YOK; müzik: telifsiz/sessiz (veya "sadece def"). Yarışma temelli ama dinle alay yok.
C) marketing/creator-outreach.md — TR ve AR içerik üreticilerine (Instagram/TikTok/YouTube/Telegram) kısa mesaj şablonları (DM + e-posta, 3'er varyant), takip mesajı, kategori listesi (kimlere yazılır: İslami bilgi/eğitim, aile, öğrenci, Kur'an kursu hocası; kimlere YAZILMAZ: siyasi/mezhepçi/tekfirci, tartışmalı vaizler). Gelir paylaşımı kod sistemi: her üreticiye kişisel kod (örn. `SUAL-AHMET`), mekanizma BÜTÇESİZ ve uygulanabilir olsun (RevenueCat promosyon kodları/teklif kodları + elle tablo takibi; kodlar kodda yok, bunu açıkça "v1'de elle takip" diye yaz). Pay oranı önerisi (örn. ilk 12 ay net gelirin %20-30'u) + şeffaflık + ödeme eşiği. İçerik yönergesi: nelerden söz edilebilir/edilemez (yukarıdaki OLMAYAN ŞEYLER listesi).
D) marketing/kurs-outreach.md — Kur'an kurslarına/dernek/derslere ücretsiz kurumsal lisans teklifi: mesaj şablonu (TR/AR), teklifin kapsamı (YALNIZCA uygulamada gerçekten mümkün olanla: kurs öğrencilerine Premium kodu — bu kodun nasıl dağıtılacağı "RevenueCat promosyon kodu, elle" diye not düşülsün), kurslar arası Ramazan turnuvası kuralları (Lig sıralamasına dayalı, kurs adı ayrı alan DEĞİL; v1'de turnuva elle, ekran görüntüsü ile yürür: bunu dürüstçe yaz), veli/hoca bilgilendirme metni, gizlilik notu (çocuk verisi toplamıyoruz, giriş zorunlu değil).
E) marketing/referral.md — "Arkadaşını getir, ikiniz de 7 gün Premium" mekaniği: akış tasarımı, mağaza kurallarına uyum notu (Apple 3.1.1 / Play: promosyon kodu/teklif kodu ile yapılmalı, uygulama içinde para/ödül karşılığı davet YOK), v1.0'da uygulamada OLMADIĞINI belirt ve "v1.1 uygulama gereksinimleri" listesi ver (deep link, davet kodu alanı, RevenueCat promotional entitlement, kötüye kullanım önlemi). Paylaşım metinleri (TR/AR/EN, WhatsApp'a uygun, ≤200 karakter).
F) marketing/locale-suggestions/ar.md (HANDOFF Görev 3) — locales/ar.json (250 anahtar), locales/native/ar.json ve store/listing.ar.json içindeki Arapça metinleri doğallık/imla/RTL açısından incele. Tablo: anahtar → mevcut → karar (uygun/değişsin) → önerilen → gerekçe. Yalnızca GERÇEKTEN düzeltilmesi gerekenleri "değişsin" yap; zevk farkı için değiştirme. Fusha, sade, İslami terimleri yerleşik biçimiyle kullan. Dosyalara (locales/, store/) YAZMA — yalnızca öneri.

═══ 3) DEĞİŞMEZ KURALLAR ═══
• "Tabu" kelimesi hiçbir yerde geçmez (başka oyun adı/marka da anma). "Çocuklar için" / "for kids" / "للأطفال" yok; "aile" de.
• "Reklamsız" yalnızca Premium bağlamında ve aynı cümlede "Premium" geçerek.
• Mezhepler arası tartışmalı fıkıh, siyaset, mezhepçilik, tekfir yok. Ayet/hadis yalnızca kaynakla ve emin olduğun kadar; emin değilsen koyma.
• Rakip uygulama adı anma, kıyas yapma. Sağlık/kazanç/ödül vaadi yok. "En iyi", "bir numara" gibi doğrulanamaz iddia yok.
• Kişisel veri uydurma: gerçek kişi/kurs/üretici ismi YAZMA; yer tutucu ([Ad], [Kurs adı]) kullan. E-posta/telefon uydurma; iletişim için [İLETİŞİM] yer tutucusu.
• Tarihler 8 Ekim 2026 → 9 Mart 2027 aralığında; Ramazan başlangıcını "≈ 8 Şubat 2027 (ay görünürlüğüne göre ±1 gün)" diye yaz.
• Ton: sıcak, saygılı, esprili ama dinle alay yok. Emoji dozunda.

═══ 4) TESLİM ═══
• HANDOFF.md kilit tablosuna satır ekle, bitince sil. src/, supabase/, locales/, store/, marketing/landing/ klasörlerine YAZMA.
• Bitince `npm run store:check` çalıştır (yasak ifade taraması marketing/ klasörünü de kapsar) — hata varsa düzelt.
• HANDOFF.md → "Geri bildirim"e ≤5 satır özet yaz: ne üretildi, neyden emin olamadın, neyi atladın.
```
