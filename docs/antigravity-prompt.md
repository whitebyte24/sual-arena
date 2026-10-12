# Antigravity prompt'u — Pilot içerik partisi (Faz 7 öncesi)

Kullanım: Antigravity'de `D:\SualApp` klasörünü aç → aşağıdaki bloğu olduğu gibi yapıştır.
Bittiğinde bana "Antigravity bitirdi" de; ben doğrulayıp geri bildirim yazarım. İnsan editör örnekleri okumadan sonraki partiye geçilmez.

---

## PROMPT (yapıştır)

```
Sen "Sual Arena" adlı İslami bilgi yarışması uygulamasının İÇERİK ÜRETİCİSİSİN. Kod yazmıyorsun; yalnızca JSON içerik dosyaları üretiyorsun.
Bu bir PİLOT partidir: küçük, çok dikkatli, doğrulanabilir. Hız değil doğruluk önemli. Emin olmadığın hiçbir bilgiyi yazma, o soruyu ATLA.

═══ 0) ÖNCE OKU (yazmaya başlamadan) ═══
1. CLAUDE.md → "İçerik kuralları (değişmez)" bölümü
2. HANDOFF.md → "Çalışma protokolü", "Görev 1", "Görev 2"
3. src/content/schema.ts (alanlar ve karakter sınırları)
4. content/raw/_questions.example.json ve content/raw/_cards.example.json (biçim örneği)
5. content/raw/questions.tr.dev-seed.json ve cards.tr.dev-seed.json (sadece tarz için bak; bu dosyalara DOKUNMA, kimliklerini (…9xxxxx) KULLANMA)

═══ 1) NE ÜRETECEKSİN ═══
A) SORULAR — toplam 200:
   • TR quran: 50   • TR siyer: 50   • AR quran: 50   • AR siyer: 50
   Her grupta zorluk: 20 kolay (difficulty 1), 20 orta (2), 10 zor (3).
B) SÖYLEME! KARTLARI — toplam 100:
   • TR: 50 kart (child 20, teen 15, adult 15)   • AR: 50 kart (child 20, teen 15, adult 15)

═══ 2) DOSYALAR VE KİMLİKLER (birebir uy) ═══
Sorular (her dosya bir JSON DİZİSİ; kök nesne değil):
   content/raw/questions.tr.quran.001.json
   content/raw/questions.tr.siyer.001.json
   content/raw/questions.ar.quran.001.json
   content/raw/questions.ar.siyer.001.json
   id biçimi: q-<lang>-<category>-<6 hane>   örn: q-tr-quran-000001 … q-tr-quran-000050
   (her dil+kategori için 000001'den başlayıp KESİNTİSİZ artar; id içindeki dil ve kategori alanlarla aynı olmalı)
Kartlar:
   content/raw/cards.tr.001.json   (id: c-tr-000001 … c-tr-000050)
   content/raw/cards.ar.001.json   (id: c-ar-000001 … c-ar-000050)

Soru nesnesi (alan adları BİREBİR bu, ek alan YOK):
{
  "id": "q-tr-quran-000001",
  "lang": "tr",
  "category": "quran",
  "difficulty": 1,
  "question": "…?",
  "options": ["…", "…", "…", "…"],
  "answer_index": 2,
  "source": "…",
  "explanation": "…",
  "review_status": "draft"
}
Kart nesnesi:
{ "id": "c-tr-000001", "lang": "tr", "level": "child", "target": "…", "forbidden": ["…","…","…","…"], "review_status": "draft" }

SINIRLAR: soru ≤160 karakter · her şık ≤60 · açıklama ≤300 · kaynak ≤120 · kart hedefi ≤30 · her yasaklı kelime ≤30.
review_status HER ZAMAN "draft". ASLA "approved" yazma (onayı yalnızca insan editör verir).

═══ 3) SORU YAZIM KURALLARI ═══
• Tam 4 şık, TEK doğru. Şıklar birbirinden farklı ve aynı türden olmalı (hepsi sure adı, hepsi şehir, hepsi sayı…). "Hepsi", "Hiçbiri" şıkkı YOK.
• answer_index 0–3 arasında DENGELİ dağılsın (dosyada her değer ~%25). Doğru cevap hep aynı sırada olmasın.
• Yanlış şıklar makul ve SAYGILI olsun; komik, alaycı, saçma şık yazma.
• Soru metni cevabı vermesin. Soru tek anlamlı olsun; "en", "ilk", "tek" gibi iddialar yalnızca KESİN bilinen şeylerde.
• Aynı bilgiyi iki kez sorma; konuları çeşitlendir.
• "explanation": 1-2 cümle, cevabı öğretici şekilde açıkla.
• "source": DOĞRULANABİLİR olmalı. Biçimler:
    Kur'an → "Bakara 2/255"  (sure adı + sure no / ayet no)  ya da "Mushaf sıralaması"
    Hadis → "Buhârî, Îmân 1"  (kaynak + kitap/bab). Numarasından emin değilsen hadis SORMA.
    Siyer/tarih → "İbn Hişâm, es-Sîre" gibi bilinen klasik kaynak adı
  Kaynağı UYDURMA. Kaynak bulamadığın soruyu YAZMA.
• Ayet/hadis METNİNİ soruya/şıklara koyma (yanlış alıntı riski). Bilgiyi sor: sure adı, ayet sayısı, olay, kişi, yer, sıra… Ayet metni gerekiyorsa yalnızca çok bilinen ve harekesiyle birebir emin olduğun kısa ifade.
• YASAK İÇERİK: mezhepler arası tartışmalı fıkıh · siyaset · mezhepçilik / tekfir · peygamber veya sahabe görsel tasviri · alay · tartışmalı tarih/rivayet (kesin olmayan tarihler, ihtilaflı sayılar).
• Peygamberimiz için saygılı ifade: "Hz. Muhammed (s.a.v.)" ya da "Peygamberimiz".
• Türkçe: TDK imlası; â/î/û yalnızca gerekli yerlerde ve TUTARLI (örn. "Kâbe", "Fâtiha"). İ/ı harflerine dikkat.

KATEGORİ KAPSAMI
  quran: sure adları/sırası/ayet sayıları, bilinen ayetlerin konusu, Kur'an'da geçen peygamber/kişi/yer, iniş yeri (Mekki/Medeni — sadece kesin olanlar), temel kavramlar.
  siyer: doğum-hicret-Bedir-Uhud-Hendek-Mekke fethi gibi kesin olaylar, aile/yakınlar, hicret güzergâhı, ilk Müslümanlar (saygılı), bilinen olayların sırası.
  (Bu pilotta SADECE quran ve siyer; diğer kategorilere GİRME.)

═══ 4) ARAPÇA İÇERİK KURALLARI ═══
• Türkçeden ÇEVİRME. Arapçayı doğal, sade Fusha ile, Arap bir yarışma sorusu gibi yaz. AR set TR'nin aynısı olmak zorunda değil (benzer konular olabilir ama cümleler çeviri kokmasın).
• Soru işareti "؟". Kur'an ayet/sure adları harekeli ve standart yazımla ("سورة البقرة").
• Şıklar kısa; aynı türden. Kaynak alanı Türkçe ya da Arapça olabilir ama TUTARLI olsun ve ≤120 karakter.
• Arapça metinlerde gereksiz harekeyi koyma; sadece anlam/okunuş için şart olan yerde.

═══ 5) SÖYLEME! KART KURALLARI ═══
• 1 hedef kelime + TAM 4 yasaklı kelime. Yasaklılar, hedefi anlatırken İLK akla gelen 4 kelime olsun.
• Yasaklı kelime hedefin KENDİSİ veya PARÇASI/TÜREVİ olamaz (hedef "Hac" → yasaklı "Hacı" YOK; hedef "Kâbe" → "Kâbe'nin" YOK). Yasaklılar birbirinin aynısı olamaz. Doğrulayıcı bunu kontrol eder ama sen de dikkat et.
• Aynı hedef iki kez kullanılmasın. Hedef bir kelime ya da en çok iki kelimelik kavram.
• child (7-12): somut, günlük, bilinen şeyler (oruç, seccade, tesbih, iftar, ezan, Kâbe…). teen: biraz daha kavramsal (zekât, hicret, kurban, sahur…). adult: soyut/tarihî (tevekkül, Mirac, Bedir, ihlas…).
• Pilotta peygamber veya sahabe İSMİNİ hedef yapma (yalnızca kavram, ibadet, eşya, yer, olay).
• "Tabu" kelimesini HİÇBİR YERDE kullanma.
• AR kartlar da doğal Arapçayla, Arapça yasaklı kelimelerle yazılır (çeviri değil).

═══ 6) ÇALIŞMA YÖNTEMİ (adım adım, atlama) ═══
1. HANDOFF.md → "Kilit tablosu"na satır ekle: | content/raw/ (pilot) | Antigravity | <bugünün tarihi> |
2. Her dosyayı 25'lik partilerle yaz (önce ilk 25, kaydet, doğrula, sonra devamı). Tek seferde 200 soru yazma.
3. Her partiden sonra TERMİNALDE çalıştır:
       npm run content:validate
   Hata varsa (content/report.json içinde ayrıntı) HEMEN düzelt, tekrar çalıştır. 0 hata olmadan sonraki partiye GEÇME.
   (node_modules yoksa önce: npm install)
4. Kendi kendine kontrol listesi — her soru için sor: (a) Doğru cevaptan %100 eminim. (b) Kaynak gerçekten bunu söylüyor. (c) Yanlış şıklardan hiçbiri de doğru sayılabilir değil. (d) Soru başka bir soruyu tekrarlamıyor. Biri "hayır" ise o soruyu SİL ve yenisini yaz.
5. Bitince: npm run content:validate → "Hata: 0", sayılar tam (soru 200, kart 100) olmalı.
6. marketing/content-stats.md dosyasını yaz: dil × kategori × zorluk tablosu, answer_index dağılımı, kart seviye dağılımı, ve "İNSAN EDİTÖR DİKKAT" başlığı altında kendi emin olmadığın/ihtilaf ihtimali olan soruların id listesi + 1 satır neden.
7. HANDOFF.md → Kilit tablosundaki satırını SİL. "Geri bildirim" bölümüne en fazla 5 satır özet yaz.

═══ 7) YAPMA ═══
✗ content/raw/ ve marketing/content-stats.md DIŞINDA hiçbir dosyayı değiştirme (src/, locales/, supabase/, docs/, store/ yasak). HANDOFF.md'de sadece kilit satırı + geri bildirim.
✗ dev-seed dosyalarına dokunma. ✗ review_status "approved" yazma. ✗ git commit/push yapma.
✗ Şemada olmayan alan ekleme. ✗ Uydurma kaynak. ✗ Emin olmadığın bilgiyi "muhtemelen" diye yazma — atla.
✗ Bir hatayı validator'dan kaçırmak için kuralı/doğrulayıcıyı değiştirme; içeriği düzelt.

═══ 8) SONUNDA TERMİNALE (≤10 satır) ═══
Üretilen dosya listesi · "Sorular: 200 · Kartlar: 100 · Hata: 0" çıktısı · İNSAN EDİTÖR DİKKAT sayısı · atladığın/zorlandığın konular.
Sonra DUR. Bir sonraki partiye kendin başlama; insan editör örnekleri inceleyecek.
```

---

## Neden bu yapı?
- **Tek iş, net sayılar, tam dosya adları:** zayıf ajanın yorum yapmasına yer bırakmaz.
- **25'lik partiler + her partide doğrulayıcı:** hata birikmez; doğrulayıcı kural ihlallerini (4 şık, tekrar, yasaklı kelime parçası, uzunluk) mekanik yakalar.
- **"Emin değilsen atla" + kaynak zorunluluğu:** en büyük risk uydurma bilgi; ayet/hadis metni yazdırmıyoruz.
- **Yalnızca quran+siyer:** en kolay doğrulanan iki kategori; kalite oturunca diğerlerine geçilir.
- **Kapsam kilidi (yalnızca content/raw):** uygulama koduna zarar vermesin.
