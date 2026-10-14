# Arkadaşını getir — iki taraf da 7 gün Premium (v1.1 tasarımı)

> **Durum:** v1.0'da uygulamada **yoktur**. Bu dosya akış tasarımı, mağaza kurallarına uyum notu, v1.1 uygulama gereksinimleri ve (v1.0'da kullanılabilecek) elle paylaşım metinlerini içerir. Mağaza metninde/videolarda bu özellik **vaat edilmez**.

## 1. Akış tasarımı
1. Kullanıcı Hesap ekranında **"Arkadaşını getir"** kartını açar; kişisel **davet kodu** (örn. `A7K2-9QXP`) ve paylaşım bağlantısı görür.
2. Arkadaş bağlantıdan mağazaya gider, uygulamayı kurar, ilk açılışta (veya Hesap → "Davet kodu gir") kodu girer.
3. Arkadaş **ilk düello/Söyleme!/günlük setini tamamlayınca** (kötüye kullanımı azaltmak için) iki tarafa da **7 gün Premium** tanımlanır (RevenueCat promotional entitlement).
4. Her kullanıcı **en fazla 5 davet** ödülü kazanabilir (üst sınır 35 gün); arkadaşın kodu yalnızca bir kez kullanılır.
5. Bildirim: "Arkadaşın katıldı, 7 gün Premium kazandın."

## 2. Mağaza kurallarına uyum
- **Apple 3.1.1 / Google Play Faturalandırma:** Premium dijital içeriktir. **Para veya uygulama içi ödüle bağlı davet** değil; ödül Premium *erişimi*dir ve bunu **RevenueCat promosyonel erişim** (mağaza satın alma akışına dokunmayan, ücretsiz bir hak) olarak veririz. Davet karşılığı **nakit/hediye kartı verilmez**.
- Apple "App Review 3.2.2(ix)": kullanıcıları başka uygulamalara/aboneliklere yönlendirmeyiz; bildirim zorunlu değildir.
- **Teşvikli davet** mağaza açıklamasında "kullanıcı sayısını şişirmek" amaçlı sahte yorum/puan davetleriyle **karıştırılmaz**: ödül yalnızca uygulamayı kurup kullananadır; yorum/puan ödülü **yok**.
- **Gizlilik:** Davet kodu rastgele dizgedir; kişisel veri içermez. Kod kullanım kaydı (davet eden hesap kimliği ↔ davet edilen hesap kimliği) Supabase'te tutulur ve **hesap silinince silinir**; gizlilik metnine eklenir (v1.1 yayını öncesi).
- **Yaş:** Davet çocuk kitlesine yönelik pazarlanmaz; "aile" dili kullanılır.

## 3. v1.1 uygulama gereksinimleri (Claude Code işi)
| Parça | İş |
|-------|----|
| Sunucu | `referral_codes(user_id, code unique)`, `referral_redemptions(inviter, invitee unique, redeemed_at)` tabloları + RLS; RPC `redeem_referral(code)` (kendi kodunu kullanamaz, tek kullanım, günlük limit) |
| Ödül | Edge Function: RevenueCat REST API ile **promotional entitlement** (7 gün) — **sunucu tarafı gizli anahtar** (istemciye girmez); kuyruk/yeniden deneme |
| Uygulama | Hesap ekranında davet kartı, kod girişi, paylaşım (`shareText`), ilk set tamamlanınca tetik |
| Deep link | `sualarena://invite/<kod>` ve landing `?invite=<kod>`; mağaza yönlendirmesi sonrası kod otomatik doldurma (Android Install Referrer; iOS pano/manual) |
| Kötüye kullanım | Cihaz başına tek ödül; aynı IP kısıtı; 24 saat içinde 3'ten fazla davet → inceleme; ödül için "ilk set tamamlandı" şartı |
| Gizlilik/KVKK | Gizlilik politikası ve mağaza veri formları güncellenir; hesap silme akışı tabloları temizler |
| Test | Vitest (kural mantığı saf TS), canlı Supabase testi, RevenueCat sandbox |

## 4. v1.0 için elle paylaşım metinleri (≤ 200 karakter; WhatsApp'a uygun)
**TR**
- "Sual Arena'da düello yapalım mı? Kaynaklı İslami bilgi yarışması, aileyle 'Söyleme!' oyunu da var. Mağazada ara: Sual Arena 🌙"
- "Günlük 5 soruyu bugün ben bildim 🟩🟩🟩🟥🟩 Sen kaç bilirsin? Sual Arena — Ramazan Ligi geliyor."
- "Ramazan'da iftar sonrası aile oyunu: tek telefonla 'Söyleme!'. Sual Arena'yı dene."

**AR**
- «هل نتحدّى بعضنا في «سؤال أرينا»؟ مسابقة إسلامية موثقة، وفيها لعبة «لا تقل!» العائلية. ابحث عنه في المتجر 🌙»
- «أجبت عن أسئلة اليوم الخمسة 🟩🟩🟩🟥🟩 كم ستعرف أنت؟ دوري رمضان قادم.»
- «لعبة عائلية بعد الإفطار بهاتف واحد: «لا تقل!» في تطبيق «سؤال أرينا».»

**EN**
- "Want a duel in Sual Arena? A sourced Islamic quiz with a family game too. Search 'Sual Arena' 🌙"
- "I got today's 5 questions 🟩🟩🟩🟥🟩 How many will you get? Ramadan League is coming."
- "Family game after iftar on one phone: 'Don't Say It!' in Sual Arena."

> Bu metinler yalnızca **doğal paylaşım** içindir; ödül vaat etmez. v1.1 yayınlandıktan sonra "7 gün Premium" cümlesi eklenir.
