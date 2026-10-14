# Anahtar kelime havuzu (ASO)

Kullanılan alan değerleri `listing.<dil>.json > appStore.keywords` içindedir (≤100 karakter, virgülden sonra boşluk yok, ad/alt başlıktaki kelimeler tekrarlanmaz).
Bu dosya **havuz**dur: sürüm güncellemelerinde alan test edilip değiştirilir. Rakip/marka adı KULLANILMAZ (hiçbir tescilli oyun/uygulama adı yok; bkz. uyumluluk #21).

## TR
- **Kullanılan:** kuran, quiz, siyer, ilmihal, soru, cevap, ramazan, iftar, oyun, dini, peygamber, sure, arapça, kelime, oruç, test
- **Yedek:** bilgi, yarışma (başlıkta var), hadis (YALNIZCA kaynaklı içerik gelirse), kıssa, sahabe, cuma, dua, kadir gecesi, aile oyunu, arkadaşla oyun, günlük soru, ilim, tarih, mukaddes
- **Uzun kuyruk (Play açıklaması için doğal cümle içinde):** islami bilgi yarışması, kuran soruları, siyer soruları, peygamber kıssaları, ramazan oyunu, iftar sonrası oyun, aile ile oynanacak oyun

## AR
- **Kullanılan:** قرآن، سيرة، رمضان، أسئلة، ألعاب، معلومات، دينية، نبي، سور، صيام، إفطار، اختبار، كلمات، قصص، أنبياء
- **Yedek:** ثقافة إسلامية، مسابقات، تحدي، عائلي، سؤال وجواب، لغة عربية، فقه، تاريخ إسلامي، ليلة القدر
- **Not:** Arapçada ön ek (ال) ve çoğul biçimleri indekslemede ayrı sayılabilir; ilk yayından sonra Search Ads/ASA verisiyle sadeleştir.

## EN
- **Kullanılan:** quran, seerah, ramadan, muslim, faith, prophet, iftar, fasting, game, religion, knowledge, arabic, stories
- **Yedek:** islam, islamic, quiz (başlıkta var), duel, family, challenge, daily, streak, history
- **Not:** "trivia" alt başlıkta olduğu için alana yazılmaz (çift sayım israfı).

## Kurallar
- Alt başlık ve ad zaten indekslenir: orada geçen kelimeyi anahtar alana yazma (`npm run store:check` denetler).
- Çoğul/tekil ayrı yazma (Apple birleştirir); TR'de İ/ı farkına dikkat.
- Her sürümde en fazla 2-3 kelime değiştir; 2 hafta bekle, sıralamayı karşılaştır.
- Ramazan'a 4 hafta kala (≈ 11 Ocak 2027) "ramazan, iftar, oruç" önceliği zaten alanda; sezon sonrası "kadir gecesi" gibi mevsimsel kelimeler yedekten alınabilir.
