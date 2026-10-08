# Sual Arena — proje notları (Claude Code için)

İslami bilgi yarışması. Expo SDK 57 (RN 0.86, React 19), TypeScript strict, Expo Router (`src/app/`).
Hedef: en geç ~11 Ocak 2027'de iOS+Android'de yayında (Ramazan 2027 ≈ 8 Şubat). Plan: `PLAN.md`. Devir: `HANDOFF.md`.

## Çalışma kuralları
- Önce plan, faz sonunda ≤5 satır rapor. Alt ajan yok (sen istemedikçe). Uzun çıktı dosyaya.
- Ücretli servis/paket yok (tek istisna: Apple 99$/yıl, Google 25$). Supabase Pro gerekirse ÖNCE sor.
- Toplu içerik (soru, kart, çeviri, pazarlama) Antigravity'nin işi; ben şema + doğrulama kurarım.
- Expo API'leri değişti: kod yazmadan önce `https://docs.expo.dev/versions/v57.0.0/` veya `llms.txt` oku.
- Paket eklerken `npx expo install <paket>` (npm install değil). Windows/bash: büyük dosyaları heredoc ile değil Write ile yaz.

## Komutlar
- `npm run check` = typecheck + vitest + i18n paritesi + içerik doğrulama (her faz sonunda yeşil olmalı)
- `npm run content:validate [-- --approved-only]` → özet konsola, ayrıntı `content/report.json`
- `npx expo start` · `npx expo-doctor` · `npx expo lint`

## Mimari
- `src/app/` yalnızca rotalar. Özellik kodu `src/features/<mod>/`, ortak UI `src/ui/`, yardımcılar `src/lib/`.
- Oyun mantığı (Söyleme!, günlük set, skor) SAF TS, ağ/RN bağımsız → vitest ile test edilir.
- `src/content/` içerik şeması+doğrulayıcı (hem uygulama hem script kullanır). Uygulamaya yalnızca `review_status: approved` girer.
- i18n: `locales/{tr,ar,en}.json`, `t('anahtar')` (tipli). Kodda sabit metin YOK. `tr` referans, `npm run i18n:check`.
- Supabase: `src/lib/supabase.ts` env yoksa `null` döner → çevrimdışı modlar çalışır. Misafir = anonymous sign-in.
- Düello eşleşmesi + Arkadaş Odası = Realtime kanalları (tablo yok). Bot: 8 sn içinde rakip yoksa, "BOT" etiketiyle.
- Reklam sıklığı/lig açma = `remote_config` ve `league_*` tabloları (yeniden yayın gerekmez).
- Şema: `supabase/migrations/`. Hesap silme = RPC `delete_my_account()`.

## İçerik kuralları (değişmez)
Mezhepler arası tartışmalı fıkıh yok · peygamber/sahabe görseli yok · siyasi/mezhepçi/tekfirci içerik yok ·
ayet/hadis yalnızca kaynakla · yanlış şıklar saygısız/komik olmaz · kullanıcılar arası sohbet YOK (yalnızca hazır emoji).
"Tabu" adı hiçbir yerde geçmez. Mağaza metninde "çocuklar için" denmez ("aile").

## Reklam kuralları (özet; ayrıntı prompt §7.1)
Ödüllü=isteğe bağlı, ödül yüklenemezse yine ver · geçiş: yalnız maç sonu, ≥3 maçta bir, ≥3 dk ara, ilk 3 maç yok ·
banner: yalnız ana menü+sonuç · soru/düello/Söyleme! turu/iftar bildirimi ekranları reklamsız · max içerik derecesi G ·
engelli kategoriler: alkol, kumar/bahis, flört, faizli kredi, kripto, cinsel, astroloji/fal, açık giyim, korku.

## Kimlik
Ad: **Sual Arena** (çakışma nedeniyle "Sual" tek başına kullanılmaz). Bundle/package: `com.sualarena.app` (GEÇİCİ, hesap açılınca netleşir).
Renkler: zümrüt `#0E9F6E`, gece laciverti `#0B1B33`, altın `#E0B04A`; karanlık mod zorunlu. Detay: `docs/design-tokens.md`.

## Kurulu skill/plugin notu
`review-ready:scan` (uyumluluk, Faz 10) · `expo` plugin (resmî) · `ASO Specialist` (Faz 9) — kurulum kullanıcı onayına bağlıydı;
kurulu değilse bu dosyadaki kurallarla devam et. i18n/RTL ve UI için hazır skill yok → script + docs ile çözüldü.

## İçerik → uygulama hattı
`content/approved/*.json` (+ dev'de `content/raw/`) → `npm run content:build[:dev]` → `src/content/generated/` (gitignore'lu).
`npm start/android/ios` DEV derlemesi yapar (draft dahil); `npm install` ve `npm run check` ÜRETİM derlemesi yapar (yalnız approved).
**Mağaza build'inden önce** `src/content/generated/meta.json` içinde `"mode":"prod"` olmalı. `*dev-seed*` dosyaları Claude'un test verisidir (draft, c-xx-9xxxxx kimlikleri).

## Söyleme! (Faz 2)
Motor: `src/features/soyleme/engine.ts` (saf TS, 14 test). Ekranlar: `src/app/soyleme/{index,play}.tsx`. Kural: doğru +1, yasaklı −1, pas 0, tur puanı ≥0,
süre dolunca ekrandaki kart sonraki tura kalır, görülen kartlar `AsyncStorage`'da tutulup desteye sona atılır.

## Durum
Faz 1 (kurulum) ve Faz 2 (Söyleme!) tamam. Sıradaki: Faz 3 Düello + bot + Arkadaş Odası (Supabase projesi/.env gerekir).
