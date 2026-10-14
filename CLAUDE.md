# Sual Arena — proje notları (Claude Code için)

İslami bilgi yarışması. Expo SDK 57 (RN 0.86, React 19), TypeScript strict, Expo Router (`src/app/`).
Hedef: en geç ~11 Ocak 2027'de iOS+Android'de yayında (Ramazan 2027 ≈ 8 Şubat). Plan: `PLAN.md`. Devir: `HANDOFF.md`.

## Çalışma kuralları
- Önce plan, faz sonunda ≤5 satır rapor. Alt ajan yok (sen istemedikçe). Uzun çıktı dosyaya.
- Ücretli servis/paket yok (tek istisna: Apple 99$/yıl, Google 25$). Supabase Pro gerekirse ÖNCE sor.
- Toplu içerik (soru, kart, çeviri, pazarlama): kullanıcı 2026-10-14 tarihinde Claude'a devretti; yalnızca `draft` yazılır, onay insan editörde. Antigravity yedek.
- Expo API'leri değişti: kod yazmadan önce `https://docs.expo.dev/versions/v57.0.0/` veya `llms.txt` oku.
- Paket eklerken `npx expo install <paket>` (npm install değil). Windows/bash: büyük dosyaları heredoc ile değil Write ile yaz; komutlara literal `\uXXXX` kaçışı yazma (araç gerçek karaktere çevirir; `chr(92)` ile üret).

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
- **Yazım (Claude, 2026-10-14):** `content/authoring/q.<dil>.<kategori>.<ad>.json` (soru: `[soru, DOĞRU, yanlış×3, zorluk, kaynak, açıklama]`) ve `c.<dil>.<ad>.json` (kart: `[hedef, y1..y4, c|t|a]`) →
  `npm run content:compile` → `content/raw/questions.<dil>.<kat>.auto.json` + `cards.<dil>.auto.json` (hepsi `draft`; doğru şık konumu tohumlu karışımla dengelenir; sayıyla başlayan şıklar sıralanır).
  Compile, içinde insan kararı olan (draft dışı) dosyayı EZMEZ (`--force` ile geçersiz kılınır). Onay başladıktan sonra authoring dosyalarını düzenleme: düzeltmeyi doğrudan raw dosyasında yap.
- **Denetimler:** `content:validate` (şema/biçim) · `content:lint` (`src/content/lint.ts`: Kur'an kaynaklarını `quranData.ts` ile doğrular — 114 sure/6236 ayet; "hepsi/hiçbiri" şıkkı; dil–yazı uyumu; cevap sızıntısı; yakın tekrar; doğru şık dağılımı) — ikisi de `npm run check` içinde.
- **Hacim (taslak):** TR 592 · AR 582 · EN 580 soru (kategori başına ~100) · dil başına 150 kart. Pilot (Antigravity) dosyaları `*.001.json`. Hepsi `draft`; **onay yalnızca insan editörde** (`npm run content:sheet` → `docs/editor-guide.md`).
- `content/approved/*.json` (+ dev'de `content/raw/`) → `npm run content:build[:dev]` → `src/content/generated/` (gitignore'lu).
`npm start/android/ios` DEV derlemesi yapar (draft dahil); `npm install`, `npx expo install` ve `npm run check` ÜRETİM derlemesi yapar (yalnız approved → onaysızken 0 içerik!). Emülatörde içerik görmek için önce `npm run content:build:dev`, Metro'yu `--clear` ile başlat.
**Mağaza build'inden önce** `npm run content:verify-store` yeşil olmalı (prod modu, yalnız approved, dil başına yeterli hacim). Dev-seed test dosyaları kaldırıldı (gerçek içerik var).
- Uygulama, kullanıcının dilinde içerik yoksa `questionLangs()`/`cardLangs()` ile ilk mevcut dile düşer (kısmi onayda boş ekran olmaz).

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

## İçerik onayı ve bildirim (Faz 7)
- Akış: Antigravity/Claude `draft` yazar → insan editör `npm run content:sheet` (tarayıcıda inceleme sayfası) → `decisions.json` → `npm run content:apply -- decisions.json` (yalnızca `review_status` değişir; hata varsa hiçbir şey yazılmaz). Kılavuz: `docs/editor-guide.md`.
- **Onay yetkisi yalnızca insan editörde.** Claude/Antigravity `approved` yazmaz. Üretim derlemesi `content/raw` + `content/approved` içinden YALNIZCA `approved` alır; `npm run content:verify-prod` (`check` içinde) taslak/test kimliği sızmasını yakalar.
- Doğrulayıcı yalnızca BİÇİMİ denetler; içerik doğruluğu elle okunur (pilotta ~12 soru + 2 kart hata taşıyordu, bkz. `marketing/content-stats.md` §5 ve HANDOFF "dersler"). `_*.example.json` dosyaları kimlik/tekrar denetimine girmez.
- "Hatalı soru bildir": `src/features/report/` (`logic.ts` saf, `service.ts` Supabase `question_reports` + çevrimdışı kuyruk, `ReportButton.tsx`). Düello/oda ve Günlük Soru cevap ekranında. (kullanıcı, soru) başına tek kayıt; 23505 = zaten bildirilmiş.
- Tekrar önleme: `features/duello/seen.ts` (en son 3000 soru) → host `pickQuestions`'a verir; maç sonunda her oyuncu oynananları kaydeder.

## Ramazan Ligi (Faz 8)
- `src/features/lig/`: `prayer.ts` (saf: gün batımı = iftar, NOAA/Spencer; ekinoks + Mekke/Londra testleri), `cities.ts` (56 şehir, konum izni YOK), `schedule.ts` (saf: sezon günü, durum not-started/locked/open/done/ended/no-set, bildirim planı), `seasonPlan.ts` (saf: 30 gün, tekrarsız, finale = kadir gecesi−1 günü 10 soru), `run.ts` (puan = düello), `ligState.ts`/`store.ts` (yerel kayıt), `remote.ts` (Supabase + önbellek + skor gönderme), `notifications.ts` (yerel iftar bildirimi).
- Ekranlar: `src/app/lig/{index,play}.tsx`. **Reklamsız** (banner/geçiş yok; `onMatchFinished` çağrılmaz). Ana ekran kartı sezon+bayrak açıksa etkinleşir (`isLeagueAvailable`).
- Sunucu: migration `0003_league.sql` (sezon başına dil, skor ≤5000). Sezon SQL'i: `npm run league:sql` (onaylı soru ister: ≥155/dil). Açma/kapama ve kısıtlar: `docs/league-ops.md`.
- Gün N = o günün iftarından sonraki set; her soru kimliği kullanıcının uygulama sürümünde bulunmalı (yoksa "güncelle"). **Sezon sorularını sürümden önce onayla.**
- **Doğrulanmadı:** canlı Supabase (sezon/sıralama/skor), gerçek bildirim zamanlaması (cihaz gerekir). Web'de demo için `lig.cache.v1` önbelleği elle yazılarak denendi.

## Mağaza + Pazarlama (Faz 9)
- `store/listing.{tr,ar,en}.json` (App Store + Play metinleri), `store/keywords.md`, `store/screenshots.md` (6 kare + "yenilikler" şablonu). Doğrulayıcı: `npm run store:check` (`scripts/check-store.ts`, `npm run check`'e bağlı):
  karakter sınırları, anahtar kelime kuralları, "Tabu" taraması (`tabu`; `tabular-nums` yanlış pozitif değil), "çocuklar için", "reklamsız ⇒ aynı cümlede Premium", abonelik/koşullar/gizlilik bağlantısı, `marketing/` içinde 40 video senaryosu.
- Açılış sayfası `marketing/landing/` (statik, TR/AR/EN, `?lang=`): `index`, `privacy`, `terms`, `delete-account`, `app-ads.txt`, `config.js` (yayıncı adı/e-posta/mağaza URL'leri; `TODO` = doldurulacak). Bekleme listesi: migration `0004_waitlist.sql` (yalnızca ekleme) ya da mailto yedeği. Yayın adımları: `docs/setup-accounts.md` §5.
- Toplu pazarlama (launch-plan, 40 video, creator/kurs outreach, referral) + AR inceleme = Antigravity: `docs/antigravity-prompt-marketing.md`.
- **Doğrulanmadı / yapılmadı:** landing yayında değil (alan adı kararı), AdMob `pub-` kimliği yok, ekran görüntüsü görselleri yok, hukuki metinler hukukçu/AR yerel okuyucu görmedi, referral/gelir paylaşımı uygulamada YOK (elle takip).

## Faz 10 — uyumluluk ve yayın hazırlığı (2026-10-14)
- **Uyumluluk taraması** (`review-ready` kuralları, alt ajansız satır içi): sonuç `review-ready-report.html` (yerel, gitignore) + `store/compliance-checklist.md`. Kalan **BLOCKER'lar insan/hesap işi:** gizlilik/koşullar sayfalarının yayını, Apple belirteç iptali fonksiyonlarının dağıtımı (`docs/setup-accounts.md` §6).
- `app.config.js` (app.json üstüne): mağaza profillerinde gereksiz Android izinlerini engeller; **production derlemesinde eksik Supabase/RevenueCat/AdMob anahtarı varsa HATA** verir (`ALLOW_INCOMPLETE_ENV=1` ile atlanır); AdMob uygulama kimliklerini `ADMOB_*_APP_ID` ortam değişkeninden alır. Kök `app.json` anahtarı `react-native-google-mobile-ads` Gradle hatasını önler (silme!).
- iOS gizlilik manifesti `app.json > ios.privacyManifests`; form cevapları `store/forms.md` (App Privacy, Data safety, yaş derecesi, inceleme notları).
- Apple ile girişli hesap silme: Edge Function'lar `supabase/functions/{apple-link,delete-account}` + migration 0005; istemci `src/lib/auth.ts` (fonksiyon yoksa RPC'ye düşer). **Canlı denenmedi.**
- Android: `docs/android-emulator.md` (komutlar, Windows derleme ipuçları). Metro bu ortamda dosya değişikliğini izlemeyebilir → kod/içerik değişince `--clear` ile yeniden başlat. Hermes `toLocaleUpperCase(yerel)` yerelini yok sayar → büyük harf için `upper()` (`@/i18n`) kullan.
- `eas.json`: development / preview (APK) / production (AAB, otomatik sürüm artışı). EAS ortam değişkenleri gerekli (bkz. `.env.example`).

## Durum
Faz 1–10 kod/metin/içerik taslağı tamam. **Yayın öncesi insan işleri:** hesaplar (Supabase, AdMob, RevenueCat, Apple, Google) + alan adı kararı, içerik onayı (`npm run content:sheet`), Arapça metin okuması, mağaza formları, gerçek cihaz/TestFlight/Play kapalı test, `npm run content:verify-store` yeşil. Açık kararlar: alan adı (ücretli), Premium "lig ödülleri" paywall'dan kaldırıldı (tanımsız), hediye/referral v1.1.
