# Stitch prompt'u — Sual Arena (tek seferlik UI tasarımı)

Stitch'te **App (mobile)** modunu seç, aşağıdaki "ANA PROMPT" bloğunu yapıştır. Beğenmediğin ekranlar için en alttaki "Düzeltme prompt'ları"nı kullan.
Bittiğinde bana şunları ver: (1) her ekranın PNG'si, (2) mümkünse Stitch'in HTML/CSS çıktısı veya "Export → Figma/Code", (3) renk/yazı tipi bilgisi (Stitch'in "design system"/theme sekmesi).
Ben bunu React Native'e (tema jetonları + bileşenler) uygularım; oyun mantığına dokunmam.

---

## ANA PROMPT (İngilizce; ekran metinleri Türkçe)

Design a premium, polished **mobile app UI (iOS + Android, 390×844)** for **"Sual Arena"** — a family-friendly Islamic knowledge quiz game with live 1v1 duels, a party mode, a daily question with streaks, and a Ramadan league. Dark mode is primary. Create a cohesive design system and these screens, all consistent with each other.

**Brand & mood:** warm, respectful, dignified but playful and rewarding — like a high-end game-show app crossed with a beautifully designed prayer-times app. Think "midnight mosque courtyard": deep night-blue backgrounds, emerald and gold accents, soft lantern glow. NOT childish/cartoonish, NOT casino-like.

**Visual language:**
- Colors: night navy `#0B1B33` (background), raised surface `#12294A`, hairline border `#1E3A63`, emerald `#0E9F6E` (primary / correct), antique gold `#E0B04A` (accent / premium / streak), cream text `#F4F1E8`, muted blue-grey text `#9DB0C9`, error red `#D64545`. Allow subtle gradients (navy→deeper navy, emerald→darker emerald, gold shimmer on premium only) and a soft lantern-glow radial highlight.
- Signature motif: **subtle geometric Islamic patterns** (eight-pointed star / arabesque lattice) as a very faint texture (4–6% opacity) in headers and cards, and as thin gold ornamental dividers. Mascot: **a friendly geometric lantern ("Fener")** made of star-pattern facets, with a warm glow, simple expressive "light" states (happy / thinking / gentle-sad). Abstract only.
- Shape: large rounded corners (20–24 px cards, 16 px buttons), soft shadows, 1px gold or blue hairlines, generous spacing, big confident typography.
- Typography: a modern geometric sans for UI (e.g. Plus Jakarta Sans / Manrope) with a more characterful display weight for titles; must fully support Turkish characters (ğ ş ı İ ö ü ç). Arabic companion font (e.g. IBM Plex Sans Arabic or Noto Naskh Arabic). Large readable question text.
- Iconography: simple rounded line icons; no emoji except small reaction emojis (👍 😮 🎉 😅) and 🔥 for streak.
- Must look equally good in **RTL Arabic** — design the Home and the Duel question screen also in Arabic (mirrored layout).

**Hard rules:** no depiction of people, prophets, companions, or animals anywhere (no avatars with faces; use geometric/initial avatars). No gambling look (no slot machines, roulette, loot boxes, coins raining, "spin to win"). No alcohol/romance imagery. Touch targets ≥ 48 dp; keep contrast accessible (WCAG AA); never use color alone for correct/wrong (add icon ✓/✕ too). Reserve a 50 dp ad-banner strip at the bottom ONLY on Home and result screens; question/game screens have no ads.

**Screens (Turkish copy):**
1. **Home ("Sual Arena" – "İslami bilgi yarışması")** — header with lantern mascot, small gold pill "⭐ Premium" and a round "Hesap" avatar button. Five large mode cards with icon, title and one-line subtitle: **Düello**, **Arkadaş Odası**, **Söyleme!** (family party), **Günlük Soru** (shows "🔥 7" streak chip), **Ramazan Ligi** (locked look, "Yakında" tag, crescent motif). Banner-ad placeholder at bottom.
2. **Düello – kurulum** — "Düello", subtitle "5 soru, her soru 10 saniye. Hızlı cevap bonus puan kazandırır.", name field ("Adın"), category chips: Karışık, Kur'an, Siyer, Peygamber Kıssaları, 🔒 İslam Tarihi, 🔒 İlmihal, 🔒 Arapça Kelimeler, text "Bugün kalan düello: 7", big primary button "Düelloya başla". Also show a variant with "Bugünkü düello hakkın bitti." + buttons "Reklam izle (+3 düello)" and "Premium'a geç".
3. **Rakip aranıyor** — animated lantern/star-radar, "Rakip aranıyor…", cancel button "Vazgeç"; then "Rakip bulunamadı, BOT ile oynuyorsun." state with a clear small "BOT" badge.
4. **Düello – soru ekranı (the hero screen)** — top: two player score cards (you highlighted with gold border; opponent with "BOT" tag), thin progress "Soru 2/5" + circular/linear 10-second timer that turns red at 3 s. Question card with large text, e.g. "Bedir Savaşı hicretin kaçıncı yılında yapılmıştır?", four big answer buttons (1., 2., 3., 5.). Show the **answered state**: correct = emerald with ✓ and "+189", wrong = red with ✕, others dimmed, short explanation + "Kaynak: …" line, "Diğer oyuncular bekleniyor…". Bottom row of four reaction-emoji buttons and a quiet "Maçtan çık" text button. No ads.
5. **Düello – sonuç / paylaşım kartı** — celebratory but dignified: headline "Kazandın!" (and a "Bu sefer olmadı" variant), podium/ranking list with scores and "3/5 doğru", a beautiful **shareable result card** (navy with gold border, star pattern, app name, ranks, invite URL), buttons "Kartı paylaş", "WhatsApp'a yaz", "Tekrar oyna", "Ana menü", then banner-ad placeholder. Include a soft inline Premium upsell card ("Reklamsız oyna — Premium ile reklamlar kalkar, tüm içerik açılır.").
6. **Arkadaş Odası – giriş & lobi** — big 6-digit room code display "482 915" with "Davet gönder" button; player list (2–8, initial-letter geometric avatars, "Kurucu" badge); host controls: category chips, question-count stepper, "Oyunu başlat". Join screen with large number-pad style code input.
7. **Söyleme! – kurulum** — "Söyleme!" "Telefonu elden ele geçirin, yasaklı kelimeyi söylemeden anlatın."; two team-name fields; steppers for "Tur süresi 60 sn", "Takım başına tur 3", "Tur başına pas 3"; level chips "Çocuk (7–12) / Genç / 🔒 Yetişkin / Karışık"; button "Oyunu başlat".
8. **Söyleme! – oyun ekranı (hero #2, party-game energy)** — huge card: target word "Kâbe" in large gold display type, ornamental divider, label "Yasaklı kelimeler" and four forbidden words (Mekke, hac, tavaf, kıble) in red with ✕ marks; thin timer bar + big countdown "46"; bottom row of three **very large (≥ 96 dp) buttons**: "Yasaklı söylendi" (red), "Pas (3)" (neutral), "Doğru" (emerald). Also "Sıra: Takım 1 – Telefonu anlatıcıya verin" ready screen with a giant "Başla" button, and turn summary ("Süre doldu!", list of cards with ✓/✕/↷, "Bu turun puanı: 2", "Sıradaki takım"), and final "Takım 2 kazandı!" screen.
9. **Günlük Soru** — intro with large streak flame "🔥 7 günlük seri", "En iyi seri: 12", button "Başla"; a question screen with 5-segment progress and untimed relaxed feel; and the **Wordle-style result card** ("Günlük Soru #8", 🟩🟩🟥🟩🟩 grid, "4/5 doğru", "🔥 7 günlük seri", countdown "Yeni sorulara 3 sa 12 dk var.") with share buttons. Include the "Seriyi kurtar (reklam izle)" button state.
10. **Premium (paywall)** — "Sual Arena Premium", "Reklamsız oyna, her şeye eriş", five benefit rows with gold checks (Reklamlar kaldırılır · Sınırsız düello · Tüm kategoriler · Tüm Söyleme! desteleri · Ramazan Ligi ödülleri), three plan cards (Yıllık highlighted "En avantajlı" / Aylık / Ömür boyu) with price + "/ yıl", primary gold-emerald button "Premium'a geç", "Satın alımları geri yükle", small legal text and links "Kullanım koşulları · Gizlilik politikası".
11. **Hesap** — display-name field, guest card ("Misafir olarak oynuyorsun" + "Apple ile giriş yap" black button, "Google ile giriş yap"), Premium section, Yasal links, red outlined "Hesabı sil" at the bottom.

**Components to define as a mini design system:** primary / secondary / danger / ghost buttons, chips (selected / locked), stepper, score card, answer button (default / correct / wrong / dimmed), timer (bar + number), mode card, bottom-sheet-free dialogs, empty/locked states.

Deliver all screens in dark mode; additionally provide a **light variant** (warm cream `#F7F4EC` background, navy text, deeper emerald `#0A7A54`, darker gold `#B88A1F`) for Home and the Duel question screen. Provide the two Arabic RTL screens (Home, Duel question) using the Arabic copy: "سؤال أرينا" / "مسابقة إسلامية", "تحدٍّ", "غرفة الأصدقاء", "لا تقل!", "سؤال اليوم", "دوري رمضان".

---

## Düzeltme prompt'ları (gerekirse tek tek)
- "Make the Duel question screen feel more premium: stronger hierarchy between question and answers, softer glow on the correct answer, richer gold hairlines, keep it uncluttered."
- "Reduce visual noise on Home: fewer borders, bigger mode cards with a subtle star-pattern texture, clearer primary action."
- "Make the Söyleme! card feel like a physical party-game card with an ornate gold frame, but keep the word readable from 1 meter away."
- "Redesign the paywall to be more elegant and less pushy; highlight the yearly plan; keep legal text visible but quiet."
- "Make all screens consistent with the Home screen's colors, radii and spacing."
