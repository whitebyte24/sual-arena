# İnsan editör kılavuzu — içerik onayı

Uygulamaya yalnızca **sizin onayladığınız** (`review_status: "approved"`) soru ve kartlar girer. Antigravity ve Claude Code içeriği `draft` olarak teslim eder; onay yetkisi yalnızca sizdedir.

## 1) İnceleme sayfasını oluşturun
```bash
npm run content:sheet
```
`content/review/index.html` oluşur (taslak olan tüm soru/kartlar). Dosyayı çift tıklayıp tarayıcıda açın; internet gerekmez.
(Başka durumları görmek için: `npm run content:sheet -- --status approved`.)

## 2) Her öğeyi karar verin
- **Doğru şık yeşil ✓** ile işaretlidir. Önce bunun gerçekten doğru olup olmadığına bakın.
- Kendinize şunları sorun:
  1. Doğru cevap %100 doğru mu? Kaynak gerçekten bunu söylüyor mu?
  2. Yanlış şıklardan biri de doğru sayılabilir mi? (Özellikle "en kısa / en uzun / ilk / tek" sorularında.)
  3. Mezhepler arasında ihtilaflı bir hüküm var mı (farz/vacip, rekât, secde sayısı…)? → **Reddet**
  4. Saygısız, alaycı veya siyasi/mezhepçi bir ifade var mı? → **Reddet**
  5. Hadis ise sıhhati tartışmalı mı? → **Reddet** ya da **Beklet**
- **Onayla / Reddet / Beklet** seçin. Emin değilseniz *Beklet* bırakın (hiçbir şey değişmez).
- Kart için: yasaklı kelimeler hedefi anlatırken ilk akla gelenler mi? Hedefin kendisi/türevi içinde mi?

## 3) Kararları uygulayın
Sayfanın altındaki **"Kararları indir"** düğmesi `decisions.json` dosyası verir. Sonra:
```bash
npm run content:apply -- C:\yol\decisions.json --dry     # önce deneme: ne değişecek?
npm run content:apply -- C:\yol\decisions.json           # gerçek uygulama
npm run content:validate
```
Bilinmeyen kimlik ya da geçersiz durum varsa **hiçbir dosya yazılmaz** ve neden raporlanır.

## 4) Uygulamaya girdiğini doğrulayın
```bash
npm run content:build
npm run content:verify-prod
```
Çıktı örneği: `Üretim içeriği: 120/3000 soru, 40/600 kart (hedef) · mod=prod` ve `✓ Yalnızca onaylı içerik.`
Mağazaya gönderilecek her derlemeden önce `verify-prod` yeşil olmalıdır.

## Kullanıcı bildirimleri
Oyuncuların "Hatalı soru bildir" ile gönderdikleri kayıtlar Supabase `question_reports` tablosundadır
(Dashboard → Table Editor). Sık bildirilen bir soruyu inceleyip gerekirse `rejected` yapın ve düzeltilmiş hâlini yeni bir kimlikle ekletin.
