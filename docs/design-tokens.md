# Tasarım jetonları ve kimlik

Kaynak kod: `src/lib/theme.ts`. Karanlık mod birincil; açık mod ikincil. Sistem ayarını izler (`userInterfaceStyle: automatic`).

## Renkler
| Rol | Karanlık | Açık |
|---|---|---|
| Arka plan | `#0B1B33` gece laciverti | `#F7F4EC` krem |
| Yüzey | `#12294A` | `#FFFFFF` |
| Metin | `#F4F1E8` | `#0B1B33` |
| Soluk metin | `#9DB0C9` | `#4B5E7A` |
| Ana (zümrüt) | `#0E9F6E` | `#0A7A54` |
| Vurgu (altın) | `#E0B04A` | `#B88A1F` |
| Kenarlık | `#1E3A63` | `#E1DACA` |
| Hata | `#D64545` | `#D64545` |
Doğru cevap = zümrüt, yanlış = hata kırmızısı; yalnızca renkle ayırma (ikon/metin de ekle — erişilebilirlik).

## Tipografi ve boyut
- Latin/Arapça için sistem fontu başlangıçta; Arapça için Noto Naskh/IBM Plex Sans Arabic değerlendirilecek (Faz 6).
- Dokunma hedefi ≥ 48 dp; Söyleme! butonları ≥ 88 dp yükseklik (elden ele, çocuk eli).
- Aralık: 4/8/16/24/32. Köşe: 14 (kart), 22 (büyük kart).

## Maskot: "Fener"
Geometrik, İslami motifli (sekiz köşeli yıldız / arabesk) konuşan bir fener. İnsan, hayvan, peygamber/sahabe tasviri YOK.
Duygular: sevinç (doğru), düşünceli (süre azalıyor), nazik üzüntü (yanlış — asla alaycı değil).

## Ses ve ton
Sıcak, saygılı, esprili ama dinî konularla dalga geçmeyen. Yanlış cevapta teşvik edici ("Bir dahaki sefere!").
Kumar çağrışımlı öğe yok: ganimet kutusu, şans çarkı, ücretli girişli ödüllü turnuva.
