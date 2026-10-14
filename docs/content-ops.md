# İçerik güncelleme ve acil durum anahtarları (mağaza incelemesi olmadan)

İki araç var: **uzaktan soru/kart paketleri** (içerik) ve **`remote_config` anahtarları** (davranış). İkisi de yalnızca VERİ indirir/okur; uygulama kodu değişmez, bu yüzden Apple/Google incelemesi gerekmez.

## 1. Uzaktan içerik paketleri

Nasıl çalışır: uygulama açılışta önbellekteki paketi uygular; arka planda (6 saatte bir) `CONTENT_URL/manifest.json`'ı sorar. Manifest sürümü, uygulamaya gömülü sürümden ve önbellekten yeniyse dil paketini indirir, SHA-256 + şema + `approved` + dil + tekrar kimlik denetiminden geçirip önbelleğe yazar; **bir sonraki açılışta** devreye girer. Her şey başarısız olursa gömülü içerik kullanılır. Bir paket o dilin gömülü içeriğinin yarısından küçükse reddedilir.

### Yayın adımları
1. İnsan editör içeriği onaylar (`npm run content:sheet` → `content:apply`). Claude/Antigravity `approved` yazmaz.
2. `npm run content:build` (üretim) ve `npm run check` yeşil olsun.
3. `npm run content:publish` (önce `-- --dry` ile bak). Dil başına ≥300 onaylı soru + ≥90 kart yoksa durur.
   Çıktı: `marketing/landing/content/` (manifest + hash'li paketler) ve `content/version.json` +1.
4. `git add marketing/landing/content content/version.json && git commit && git push` → site yeniden yayınlanır → uygulamalar indirir.

### Geri alma
Önceki onaylı duruma dön (`git revert` ya da kararları geri al) ve yeniden `content:publish` çalıştır: sürüm numarası yine artar, istemciler eski içeriğe geçer. Manifest'i elle eski sürüme düşürme (istemci daha düşük sürümü kullanmaz).

### Sınırlar (bilerek)
- Yalnızca soru ve kart VERİSİ. Şema değişikliği (yeni alan, yeni kategori, yeni dil) ya da yeni ekran = yeni mağaza sürümü.
- Mağaza sürümü her zaman gömülü içerikle çıkar; `src/content/generated/meta.json` içinde `"mode":"prod"` ve `version` = `content/version.json` olmalı.
- **Günlük Soru tutarlılığı:** seçim "havuz + gün"e bağlı. İki cihazın paket sürümü farklıysa aynı gün farklı 5 soru görebilir (yayından sonraki ilk ~gün). Önemliyse yayını gece yarısından uzak yap; kesin sabitleme için `daily_sets` tablosu var.
- **Lig:** sezon soruları sürümde/pakette bulunmalı; içerik yayınlarında sezon sorularını silme (bkz. `docs/league-ops.md`).
- Gizlilik: içerik isteği IP'yi barındırma sağlayıcısının günlüğüne düşürür; `marketing/landing/privacy.html` bunu belirtir.
- `CONTENT_URL` (`src/lib/config.ts`) alan adı netleşince gerçek adrese ayarlanır; boş string = uzaktan güncelleme kapalı.

## 2. Acil durum anahtarları (`remote_config`, Supabase SQL Editor)

| Anahtar | Etki |
|---|---|
| `features.online_matching = false` | Çevrimiçi eşleşme kapanır: Düello doğrudan BOT'a düşer; Arkadaş Odası "geçici olarak kapalı" der. Çevrimdışı modlar (Günlük, Söyleme!, Lig) etkilenmez. |
| `features.league_enabled = false` | Ramazan Ligi kapanır. |
| `features.free_duels_per_day` | Ücretsiz günlük düello sınırı (1–100). |
| `ads.enabled = false` / `ads.reduced_mode = true` | Reklamları kapat / azalt. |

```sql
-- Kapat (yoğunluk / Supabase limiti / sorun):
update public.remote_config set value = jsonb_set(value, '{online_matching}', 'false'), updated_at = now() where key = 'features';
-- Aç:
update public.remote_config set value = jsonb_set(value, '{online_matching}', 'true'), updated_at = now() where key = 'features';
```
Uygulama anahtarı en geç 10 dakikada (bellek önbelleği) ya da yeniden açılışta okur; sunucuya ulaşılamazsa son bilinen değeri kullanır, hiç değer yoksa varsayılan (açık). Anahtar yoksa açık sayılır.

### Yük büyürse (Supabase ücretsiz sınırları)
Sırayla: (1) `online_matching=false` ile Realtime yükünü sıfırla (BOT'lu düello kalır); (2) Günlük/Söyleme!/Lig çevrimdışı çalışmaya devam eder; (3) sınır sürekli aşılıyorsa Supabase Pro kararı için ÖNCE kullanıcıya sor (CLAUDE.md kuralı).
