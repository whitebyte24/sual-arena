/**
 * Mağaza metinlerini denetler (store/listing.<dil>.json):
 *  • karakter sınırları (App Store: ad 30, alt başlık 30, tanıtım 170, açıklama 4000, anahtar kelime 100; Play: başlık 30, kısa 80, tam 4000)
 *  • anahtar kelimeler: virgülle ayrılmış, boşluksuz, tekrarsız, ad/alt başlıktaki kelimeleri tekrar etmez (App Store zaten indeksler)
 *  • yasak ifadeler: "Tabu" (tescilli), "çocuklar için / for kids" (Aileler politikası), her yerde (store/, marketing/, src/, locales/)
 *  • "reklamsız / ad-free" yalnızca AYNI cümlede Premium geçiyorsa (spec §8: reklamsızlık yalnızca Premium için)
 *  • açıklamada abonelik bilgisi + Kullanım Koşulları + Gizlilik bağlantıları
 * Kullanım: npm run store:check  (hata varsa çıkış kodu 1)
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(__dirname, '..');
const LANGS = ['tr', 'ar', 'en'] as const;
type Listing = {
  lang: string;
  appStore: { name: string; subtitle: string; promotionalText: string; keywords: string; description: string; whatsNew: string };
  googlePlay: { title: string; shortDescription: string; fullDescription: string };
};

const LIMITS = {
  name: 30,
  subtitle: 30,
  promotionalText: 170,
  keywords: 100,
  description: 4000,
  whatsNew: 4000,
  title: 30,
  shortDescription: 80,
  fullDescription: 4000,
} as const;

const AD_FREE = /reklamsız|reklamlar kalkar|ad-free|removes ads|بلا إعلانات|يزيل الإعلانات|بدون إعلانات/i;
const PREMIUM = /premium|بريميوم/i;
const KIDS = /çocuklar için|çocuklara yönelik|for kids|for children|kids game|للأطفال|للصغار فقط/i;
const TABU = /\btabu\b/i; // "tabular-nums" gibi sözcükleri yakalamasın
const len = (s: string) => Array.from(s).length; // kod noktası sayısı (Arapça/Türkçe için doğru)

const errors: string[] = [];
const err = (lang: string, field: string, msg: string) => errors.push(`${lang}/${field}: ${msg}`);

for (const lang of LANGS) {
  const file = join(ROOT, `store/listing.${lang}.json`);
  if (!existsSync(file)) {
    err(lang, '*', 'dosya yok');
    continue;
  }
  const l = JSON.parse(readFileSync(file, 'utf8')) as Listing;
  const a = l.appStore;
  const g = l.googlePlay;

  const check = (field: string, value: string, max: number) => {
    if (!value?.trim()) return err(lang, field, 'boş');
    if (len(value) > max) err(lang, field, `${len(value)} > ${max} karakter`);
  };
  check('appStore.name', a.name, LIMITS.name);
  check('appStore.subtitle', a.subtitle, LIMITS.subtitle);
  check('appStore.promotionalText', a.promotionalText, LIMITS.promotionalText);
  check('appStore.keywords', a.keywords, LIMITS.keywords);
  check('appStore.description', a.description, LIMITS.description);
  check('appStore.whatsNew', a.whatsNew, LIMITS.whatsNew);
  check('googlePlay.title', g.title, LIMITS.title);
  check('googlePlay.shortDescription', g.shortDescription, LIMITS.shortDescription);
  check('googlePlay.fullDescription', g.fullDescription, LIMITS.fullDescription);

  // anahtar kelimeler
  const kws = a.keywords.split(',');
  if (kws.some((k) => k !== k.trim() || !k)) err(lang, 'keywords', 'boşluk/boş öğe yok olmalı (virgülden sonra boşluk bırakma)');
  if (new Set(kws.map((k) => k.toLowerCase())).size !== kws.length) err(lang, 'keywords', 'tekrar eden kelime var');
  const nameWords = new Set(`${a.name} ${a.subtitle}`.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean));
  for (const k of kws) if (nameWords.has(k.toLowerCase())) err(lang, 'keywords', `"${k}" ad/alt başlıkta zaten var (karakter israfı)`);

  // metin kuralları
  const texts: [string, string][] = [
    ['appStore.name', a.name],
    ['appStore.subtitle', a.subtitle],
    ['appStore.promotionalText', a.promotionalText],
    ['appStore.description', a.description],
    ['appStore.whatsNew', a.whatsNew],
    ['googlePlay.title', g.title],
    ['googlePlay.shortDescription', g.shortDescription],
    ['googlePlay.fullDescription', g.fullDescription],
  ];
  for (const [field, text] of texts) {
    if (TABU.test(text)) err(lang, field, '"Tabu" kullanılamaz (tescilli marka)');
    if (KIDS.test(text)) err(lang, field, 'çocuk kitlesini doğrudan hedefleyen ifade (Aileler politikası)');
    for (const sentence of text.split(/(?<=[.!؟?\n])/)) {
      if (AD_FREE.test(sentence) && !PREMIUM.test(sentence)) err(lang, field, `"reklamsız" ifadesi Premium'a bağlanmamış: «${sentence.trim().slice(0, 70)}»`);
    }
  }
  for (const [field, text] of [['appStore.description', a.description], ['googlePlay.fullDescription', g.fullDescription]] as const) {
    if (!/sual-arena\.netlify\.app\/terms/.test(text) || !/sual-arena\.netlify\.app\/privacy/.test(text)) err(lang, field, 'Kullanım Koşulları ve Gizlilik bağlantıları eksik');
    if (!/24|٢٤|auto|otomatik|تلقائي/i.test(text)) err(lang, field, 'abonelik/otomatik yenileme bilgisi eksik');
  }
  if (!(a.name === g.title)) err(lang, 'title', 'App Store adı ile Play başlığı aynı olmalı (tutarlı marka)');
}

// "Tabu" taraması (uyumluluk #21): kullanıcıya görünen/yayınlanan klasörler
function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    return e.isDirectory() ? (e.name === 'generated' || e.name === 'node_modules' ? [] : walk(p)) : [p];
  });
}
for (const dir of ['src', 'locales', 'store', 'marketing']) {
  for (const f of walk(join(ROOT, dir))) {
    if (!/\.(ts|tsx|json|md|html|txt)$/.test(f) || f.endsWith('check-store.ts') || f.endsWith('compliance-checklist.md')) continue;
    if (TABU.test(readFileSync(f, 'utf8'))) errors.push(`${relative(ROOT, f)}: "Tabu" geçiyor`);
  }
}

// Pazarlama/açılış metinleri (md, html): çocuk hedefleme ve "reklamsız ⇒ Premium" kuralı
const copyFiles = [...walk(join(ROOT, 'marketing')), ...walk(join(ROOT, 'store'))].filter(
  (f) => /\.(md|html)$/.test(f) && !/compliance-checklist\.md$|content-stats\.md$|screenshots\.md$/.test(f),
);
for (const f of copyFiles) {
  const rel = relative(ROOT, f);
  const text = readFileSync(f, 'utf8').replace(/<[^>]+>/g, ' ');
  if (KIDS.test(text)) errors.push(`${rel}: çocuk kitlesini hedefleyen ifade`);
  for (const line of text.split('\n')) {
    for (const sentence of line.split(/(?<=[.!؟?])\s/)) {
      if (AD_FREE.test(sentence) && !PREMIUM.test(sentence)) errors.push(`${rel}: "reklamsız" Premium'a bağlı değil: «${sentence.trim().slice(0, 60)}»`);
    }
  }
}

// Kısa video senaryoları: tam 40 adet, dil dağılımı bilgi amaçlı
const videos = join(ROOT, 'marketing/short-video-scripts.md');
if (existsSync(videos)) {
  const n = (readFileSync(videos, 'utf8').match(/^###\s+Video\s+\d{2}\b/gm) ?? []).length;
  if (n !== 40) errors.push(`marketing/short-video-scripts.md: ${n} senaryo var, 40 olmalı ("### Video 01 — …" biçimi)`);
}

if (errors.length) {
  console.log(`Mağaza metni hatası (${errors.length}):`);
  errors.slice(0, 25).forEach((e) => console.log('  ' + e));
  process.exit(1);
}
console.log(`store: ${LANGS.length} dil tamam (sınırlar, anahtar kelimeler, yasak ifadeler, abonelik bilgisi)`);
