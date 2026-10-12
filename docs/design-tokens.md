# Tasarım sistemi ve kimlik

Kaynak: Stitch çıktısı `docs/design/stitch/` ("Serene Illumination": `DESIGN.md` + 4 referans ekran). Kod karşılığı: `src/lib/theme.ts` + `src/ui/`.
Karanlık mod birincil; açık mod ikincil (sistem ayarını izler).

## Renk (karanlık / açık)
| Jeton | Karanlık | Açık | Kullanım |
|---|---|---|---|
| `bg` | `#0B1B33` | `#F7F4EC` | sayfa zemini (Level 0) |
| `raised` | `#12294A` | `#FBF8F0` | paneller, rozet/ikon karoları (Level 1) |
| `surface` | `#18335A` | `#FFFFFF` | kartlar, cevap kutuları, girişler (Level 2) |
| `border` | `#1E3A63` | `#E1DACA` | 1 px kenarlık |
| `goldLine` | `rgba(224,176,74,.25)` | `rgba(184,138,31,.35)` | premium/aktif vurgu kenarlığı |
| `primary` | `#0E9F6E` | `#0A7A54` | doğru, ana eylem |
| `accent` | `#E0B04A` | `#B88A1F` | seri, premium, vurgu |
| `text` / `textMuted` | `#F4F1E8` / `#9DB0C9` | `#0B1B33` / `#4B5E7A` | |
| `danger` | `#D64545` | `#D64545` | yanlış, yıkıcı eylem |
Doğru/yanlış yalnızca renkle ayrılmaz: ✓/✕ simgesi + metin de var.

## Biçim ve boşluk
- 4 pt ızgara; ekran kenar boşluğu 20. Köşe: kart 24, düğme 16, çip/rozet hap (9999). Dokunma hedefi ≥ 48 dp (Söyleme! eylem düğmeleri ≥ 100 dp).
- Derinlik gölgeyle değil **fener parıltısıyla**: `glow(theme.glowGold|glowEmerald)`; yükseltilmiş her bileşen 1 px kenarlıklı.
- Süs: sekiz köşeli yıldız filigranı (%4–5), altın gradyan ayırıcı + yıldız düğümü (`Divider`).

## Yazı tipi
Plus Jakarta Sans (400–800), `src/ui/Text.tsx` ağırlığı aileye çevirir; tüm metin bu `Text` ile çizilir. Sayaç/skorda `TABULAR`.
**Arapça yazı tipi Faz 6'da eklenecek** (IBM Plex Sans Arabic veya Noto Naskh Arabic; Arapça gövde Latin'den ~2 pt büyük).

## Bileşenler (`src/ui/`)
`Button` (primary/gold/neutral/danger/ghost, simge) · `Chip` (seçili ✓ / kilitli 🔒) · `Stepper` · `Card` (glow, filigran, gold kenarlık) · `Badge` · `Avatar` (harf mührü / BOT altıgeni) ·
`ScreenHeader` · `Icon` (MaterialCommunityIcons) · `ornaments` (`Lantern`, `Star`, `StarWatermark`, `Divider`) · `confirm`.

## Maskot: "Fener"
Geometrik, yıldız desenli, sıcak ışıklı fener (`Lantern`, SVG). İnsan/hayvan/peygamber/sahabe betimlemesi YOK; avatarlar harf mührüdür.

## Ses ve ton
Sıcak, saygılı, esprili ama dinî konularla dalga geçmeyen. Yanlış cevapta teşvik edici, asla alaycı değil.
Kumar çağrışımlı öğe yok: ganimet kutusu, şans çarkı, ücretli girişli ödüllü turnuva.

## Stitch'ten bilerek ALINMAYANLAR (bizde karşılığı yok / kurallara aykırı)
Alt sekme çubuğu (gezinme yığın tabanlı) · puan/seviye/rütbe sistemi ("1.420 Puan", "Seviye 14", "Dereceli") · Hicri tarih şeridi ·
uydurma kurum reklamı ("Hilal Vakfı…": reklam alanı yalnızca gerçek `AdBanner`) · uydurma kaynak ("TDV İslâm Ansiklopedisi": gerçek `source` alanı gösterilir) ·
insan figürlü aile simgesi (Söyleme! için soyut konuşma balonu simgesi).
