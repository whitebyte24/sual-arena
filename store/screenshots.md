# Ekran görüntüsü planı (6 adet, bu sırayla)

Kural: her görselde yalnızca **uygulamada gerçekten bulunan** bir ekran. Peygamber/sahabe görseli yok, kişi fotoğrafı yok.
Avatarlar uygulamanın kendi avatarları, rakip adı kurgusal ("Misafir 4821" gibi). Reklam ekranı görseli YOK.
Boyutlar: iPhone 6.9" (1320×2868), iPhone 6.5" (1284×2778), iPad 13" (yalnız `supportsTablet` açıksa), Android telefon 1080×1920+ ve 7"/10" tablet (isteğe bağlı).
Tüm ekranlar karanlık temada alınır (marka: gece laciverti #0B1B33, zümrüt #0E9F6E, altın #E0B04A). Üst başlık metni 2 satırı geçmez.

| # | Ekran | Başlık TR | Başlık AR | Başlık EN | Çekim notu |
|---|-------|-----------|-----------|-----------|------------|
| 1 | Düello — soru anı (süre çubuğu, iki skor) | Düellonun heyecanını yaşa | عِش حماس التحدّي | Feel the duel | Rakip adı kurgusal. Rakip bot ise "BOT" etiketi görüntüde KALMALI (gerçek rakip izlenimi verilmez) |
| 2 | Söyleme! — kart ve yasaklı kelimeler | Tek telefonla aile oyunu | لعبة عائلية بهاتف واحد | One phone, whole family | Seviye: genç/çocuk destesi, kart içeriği onaylı olmalı |
| 3 | Günlük Soru — seri + emoji ızgarası | Her gün 5 yeni soru | ٥ أسئلة جديدة كل يوم | 5 new questions daily | Seri 7+ gün; paylaşım ızgarası görünür |
| 4 | Ramazan Ligi — iftar sayacı / günün seti | Ramazan'a özel lig | دوري رمضان | The Ramadan League | Sezon açıkken (remote_config) çek; iftar saati kentsel örnek |
| 5 | Arkadaş Odası — 6 haneli kod, oyuncu listesi | Arkadaşlarınla özel oda | غرفة خاصة مع أصدقائك | Private room with friends | Kod örnek: 482913; 4 oyuncu |
| 6 | Arapça arayüz (RTL) — ana menü | Tam Arapça, sağdan sola | عربية كاملة من اليمين لليسار | Full Arabic, right-to-left | AR dilinde çek; diğer dillerde de bu 6. kare AR arayüzle kalır |

## Notlar
- Mağaza görsellerini ve çerçeveyi insan üretir (Stitch/Figma); Claude yalnızca metin ve sıra planını verir.
- Başlık metinleri `listing.*.json` içinde değil, görselin üzerindedir; çeviri değişirse bu tabloyu da güncelle.
- Play "Özellik grafiği" (1024×500): "Sual Arena" logosu + "İslami bilgi yarışması" + zümrüt/altın deseni; metin AR/EN/TR ayrı.
- Önizleme videosu (opsiyonel): 15-20 sn, düello → Söyleme! → günlük soru; ses yok ya da telifsiz.

## "Yenilikler" şablonu (her sürümde)
```
• <Öne çıkan yenilik, 1 satır>
• <İyileştirme/düzeltme, 1 satır>
• <İçerik: "N yeni soru" ya da "yeni Söyleme! destesi">
```
- Ramazan öncesi sürüm: "Ramazan Ligi hazır! Sezon Ramazan'ın ilk günü iftarda açılıyor." (yalnızca sezon gerçekten uzaktan açılacaksa)
- Yalnızca gerçekten yayında olan özelliği yaz; "yakında" vaadi verme (mağaza incelemesi + güven).
- İçerik sayısı uygulamada ONAYLI içeriğe eşit olmalı (`content:verify-prod` çıktısı).
