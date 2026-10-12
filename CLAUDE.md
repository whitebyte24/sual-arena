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

## Düello / Arkadaş Odası (Faz 3)
- `src/features/duello/`: `match.ts` (saf durum+puan), `session.ts` (MatchSession + Transport soyutlaması + mesajlar), `bot.ts`, `pairing.ts`
  (sıralı çiftleme, kanal adları), `matchmaking.ts` + `room.ts` (Supabase Realtime), `MatchPlay.tsx` (UI+sonuç+paylaşım), `quota.ts` (günlük 10).
- `src/lib/realtime.ts` ChannelTransport = broadcast (olaylar) + presence (varlık). Eşleşme: `queue:<lang>:<cat>` → `duel:<a~b>` el sıkışma → 8 sn sonra BOT.
- Protokol: host `start/next` yayar; herkes `answer` yayar; doğru cevap ağda YOK (seed'den türetilir); konuk `hello` ile `start` tekrarı ister.
- Puan: doğru 100 + hız bonusu (≤100). Sohbet yok: yalnızca beyaz listedeki 4 emoji. Bot "BOT" etiketli.
- Test: `tests/helpers/loopback.ts` bellek içi hub ile ağsız maç testleri. ChannelTransport/matchmaking/room canlı Supabase ile HENÜZ DENENMEDİ.
- Realtime kanalları herkese açık (RLS/yetkilendirme yok); oda kodu 6 hane. Gerekirse Faz 10'da private channel + RLS değerlendirilecek.
- `INVITE_URL` (`src/lib/config.ts`) yer tutucu; landing yayınlanınca güncelle.

## Günlük Soru (Faz 4)
- `src/features/gunluk/daily.ts` (saf TS): gün+dil → aynı 5 soru (kimliğe göre sıralı havuz + tur başı sabit permütasyon), şık sırası `dailySeed`,
  seri (`completeDay`, `streakStatus`: new/done/active/repairable/broken, `repairStreak`), emoji ızgarası + metin. `state.ts` = kayıt biçimi (saf), `store.ts` = AsyncStorage.
- Gün = yerel takvim günü (`src/lib/date.ts`). #1 = 2026-10-01. Her cevap anında kaydedilir (yarım kalan günde aynı soruya geri dönüp hile yok).
- Sunucu tarafı sabitleme isteğe bağlı: tablo `daily_sets` (migration 0002); satır yoksa deterministik seçim. Uygulama sürümleri arası soru bankası farkı olursa bu tablo ile sabitle.
- **Faz 5 bağlantısı:** `repairStreak` hazır, ödüllü reklam düğmesi (status = repairable) henüz yok. Seri yalnızca cihazda (hesap/silme sonrası taşınmaz).
- Ortak paylaşım: `src/lib/share.ts` (`shareView` görüntü, `shareWhatsapp`, `shareText`).

## Premium / Reklam / Hesap (Faz 5)
- **Kademeler** tek dosyada: `src/features/premium/tiers.ts` (ücretsiz: Kur'an/Siyer/Kıssalar + Söyleme! çocuk/genç + günde 10 düello; premium: hepsi + reklamsız). Havuz süzme: `questionPool(.., allowed)`, `eligibleCards(.., allowedLevels)`.
- **Platform ayrımı:** `adapter.ts` (web/Expo Go: boş/sahte) vs `adapter.native.ts` (AdMob, RevenueCat). Native modüller Expo Go'da yok → dev build (`docs/setup-accounts.md` §4). `BannerView(.native).tsx` aynı kural.
- **Reklam politikası** saf TS: `src/features/ads/policy.ts` (+ `tests/monetization.test.ts`). Uzaktan config yalnızca AZALTIR (taban: 3 maçta bir, ≥3 dk, ilk 3 maç yok; ilk oturum yok). Banner yalnızca `home|result`. Geçiş reklamı yalnızca `onMatchFinished()` (MatchPlay Result, Söyleme! bitiş). Ödüllü: `watchRewarded()` (yüklenemezse de ödül).
- **Güvenlik kuralları:** üretimde AdMob kimliği yoksa reklam YOK (test kimliğine düşmez); `mockAdapter` yalnızca `__DEV__` (üretimde sahte premium yok); `configure()` başarısızsa premium=false.
- **Hesap:** `src/lib/auth.ts` (Apple yerel iOS, Google OAuth+linkIdentity, `deleteAccount()` = RPC + yerel temizlik), ekranlar `src/app/{premium,hesap}.tsx`. Onay penceresi `src/ui/confirm.ts` (web'de Alert çalışmaz).
- Uzaktan yapılandırma: `src/lib/remoteConfig.ts` (`remote_config` tablosu → önbellek → varsayılan).
- **Doğrulanmadı (cihaz/hesap gerekir):** gerçek AdMob/UMP/ATT, RevenueCat satın alma, Apple/Google giriş, canlı hesap silme. Yalnızca tip kontrolü + mantık testleri + web'de sahte akış denendi.

## Arayüz (Stitch tasarımı uygulandı)
- Tasarım kaynağı `docs/design/stitch/` (4 ekran + DESIGN.md), kod: `src/lib/theme.ts`, `src/ui/`. Ayrıntı ve "alınmayanlar": `docs/design-tokens.md`.
- **Tüm metin `@/ui/Text`** ile çizilir (Plus Jakarta Sans); `react-native`'den `Text` import etme. Simgeler `@/ui/Icon`. Kilitli çip: `<Chip locked />` (emoji ekleme).
- SVG gradyan kimlikleri `useId` ile benzersiz olmalı (web'de gizli ekranlar kimlik çakışması yapar).
- Stitch yalnızca Ana menü, Düello kurulum/arama/soru ekranlarını verdi; Söyleme!, Günlük, Oda, Paywall, Hesap aynı dille elle genişletildi (Stitch onayı yok).
- Arapça yazı tipi ve RTL denetimi Faz 6'da (şimdilik Arapça glifler sistem yazı tipine düşer).

## Dil, RTL, tema (Faz 6)
- Dil: `src/i18n/` — `lang.ts` (saf: seçim, RTL, tema tercihi), `fonts.ts` (saf: yazı tipi/boyut), `index.ts` (`initLang`, `setLang`, `useLang`, `t`). Kayıtlı tercih > cihaz dili > EN. Kök yerleşim `key={lang}` ile dil değişince yeniden kurulur.
- **RTL:** yerelde `I18nManager.forceRTL` bir SONRAKİ açılışta etkili → yön değişince kökte "uygulamayı yeniden aç" uyarısı çıkar (`needsRestart`). Web'de `document.dir` anında uygular. Plugin: `expo-localization { supportsRTL, supportedLocales }`.
  Yönlü simgeler (`Icon` içinde `DIRECTIONAL`) RTL'de aynalanır. Stil yazarken `start/end` kullan (left/right değil); Arapçada `letterSpacing` Text içinde otomatik sıfırlanır.
- Yazı tipi: Latin/TR Plus Jakarta Sans, Arapça IBM Plex Sans Arabic (~%10 büyük). Tema tercihi (Sistem/Koyu/Açık): `src/lib/appearance.ts`, Hesap ekranında.
- Yerel dizeler: `locales/native/{tr,en,ar}.json` (uygulama adı + ATT metni) `app.json > locales`; taban ATT metni İngilizce.
- Denetimler: `npm run i18n:check` (anahtar paritesi) + `npm run i18n:hardcoded` (sabit/Türkçe metin yakalar; `check` içinde).
- **Arapça içerik yok:** `ar` arayüzünde soru/kart yine de TR'den gelir (dev tohumu yalnızca TR soru + TR/AR kart). Gerçek AR içerik Antigravity'den (HANDOFF Görev 1–3).

## Durum
Faz 1–6 tamam (3 ve 5'in canlı servis kısımları hesap/anahtar bekliyor; Arapça metinlerin ana dili konuşan kontrolü Antigravity Görev 3). Sıradaki: Faz 7 içerik entegrasyonu + doğrulama.
