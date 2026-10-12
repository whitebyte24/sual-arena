# Ramazan Ligi — işletme kılavuzu

Lig **yeniden yayın gerektirmeden** açılıp kapanır. Uygulama içinde sezon, günlük setler ve iftar hesabı hazırdır; sunucuda iki anahtar gerekir.

## Nasıl çalışır
- Sezon 30 gündür. **Gün N = o takvim gününün iftarından sonra açılan set** (İslâmî gün akşam başlar).
  "27. gece" 26. günün iftarıyla başlar → **finale günü 26** (10 soru; diğer günler 5 soru).
- Her kullanıcı **şehrini seçer** (konum izni YOK, şehir yalnızca cihazda). İftar = şehrin gün batımı + 5 dk güvenlik payı; hesap çevrimdışı yapılır ve "yaklaşık"tır (resmî imsakiye esastır).
- Set tek kişiliktir: soru başına 10 sn, puan düellodaki gibi (100 + hız bonusu ≤ 100). Skor kullanıcı+gün başına tek kez gider; çevrimdışıysa kuyrukta bekler.
- **Reklamsız ekran:** Lig ekranlarında banner/geçiş reklamı yoktur; iftar bildirimiyle açılan ekranlar dahil (spec §7.1).
- Her dilin ayrı sezonu ve sıralaması vardır (sorular dile özgü).

## Sezon hazırlama (Ocak 2027'ye kadar)
1. **İçerik:** o dilde **en az 155 ONAYLI soru** gerekir (29×5 + finale 10). Önce `docs/editor-guide.md` ile onaylayın.
2. `npm run league:sql -- --lang tr --start 2027-02-08 --name "Ramazan Ligi 1448"` → `supabase/seed/league-tr-2027-02-08.sql` (onaylı sorulardan tekrarsız 30 gün). Arapça için `--lang ar`, İngilizce için `--lang en`.
   Ramazan'ın başlangıcı ay görünümüne göre 8–9 Şubat 2027'dir; resmî ilan sonrası `--start` düzeltilir (satır silinip yeniden üretilebilir).
3. Supabase SQL Editor'da önce `supabase/migrations/0003_league.sql`, sonra üretilen dosyayı çalıştırın. Sezon **kapalı** (`enabled=false`) oluşur.
4. **Açma** (iki anahtar da gerekir; dosyanın sonunda hazır ifadeler var):
   ```sql
   update public.league_seasons set enabled = true where name = 'Ramazan Ligi 1448' and lang = 'tr';
   update public.remote_config set value = jsonb_set(value, '{league_enabled}', 'true'), updated_at = now() where key = 'features';
   ```
5. **Kapatma:** `remote_config.features.league_enabled = false` (uygulama önbelleği de kullanmaz). Tek bir dili kapatmak için o sezonun `enabled=false`'ı.

## Önemli kısıtlar
- Günün soruları **uygulamaya gömülü banka**dan okunur. Sezondaki her soru kimliği, kullanıcının sürümünde bulunmalı (aksi hâlde "uygulamayı güncelle" der). Bu yüzden **sezon sorularını mağaza sürümünü yayınlamadan ONAYLAYIN** ve sezon boyunca o soruları içerikten kaldırmayın.
- Skor istemcide hesaplanır; sunucu yalnızca 0–5000 aralığını denetler (para ödülü olmadığı için kabul edildi).
- Sıralamada görünen ad `profiles.display_name`'dir (skor gönderirken güncellenir). Sıralama ayrı satır vurgusu yapmaz.
- **Reklam azaltma:** Ramazan boyunca `remote_config.ads.reduced_mode = true` (3 maçta bir yerine 6'da bir). Kadir Gecesi için ayrıca `ads.enabled=false` yapabilirsiniz.

## Bildirimler
İftar hatırlatması yerel (çevrimdışı) bildirimdir; kullanıcı Lig ekranından açar, izin o anda istenir. Bildirime dokunmak `/lig` açar. Android'de bildirim kanalı "iftar" oluşturulur.
