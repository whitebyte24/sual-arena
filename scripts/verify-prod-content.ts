/**
 * Mağaza derlemesinden önce: src/content/generated yalnızca ONAYLI içerik taşıyor mu?
 *   npm run content:verify-prod            (taslak/test sızması denetimi; check içinde)
 *   npm run content:verify-store           (--strict: her dilde yeterli ONAYLI içerik var mı? mağaza build'i öncesi)
 * `npm install` ve `npm run check` üretim derlemesi (yalnızca approved) yapar; `npm start` DEV derlemesi yapar.
 * Dev derlemesi kalmışsa veya taslak/test kimliği sızmışsa hata verir (çıkış kodu 1).
 * --strict ek olarak dil başına en az: 300 soru (kategori başına ≥ 30), 90 kart (seviye başına ≥ 25) ister;
 * ayrıca Ramazan Ligi için dil başına ≥ 155 soru gerekir (docs/league-ops.md).
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const strict = process.argv.includes('--strict');
const dir = join(__dirname, '..', 'src/content/generated');
const read = <T>(f: string): T => JSON.parse(readFileSync(join(dir, f), 'utf8')) as T;
if (!existsSync(join(dir, 'meta.json'))) {
  console.error('generated/ yok: önce npm run content:build');
  process.exit(1);
}
const meta = read<{ mode: string; cards: number; questions: number }>('meta.json');
type Q = { id: string; lang: string; category: string; review_status: string };
type C = { id: string; lang: string; level: string; review_status: string };
const cards = read<C[]>('cards.json');
const questions = read<Q[]>('questions.json');

const bad = [...cards, ...questions].filter((x) => x.review_status !== 'approved' || /-9\d{5}$/.test(x.id));
const errors: string[] = [];
if (meta.mode !== 'prod') errors.push(`meta.mode = "${meta.mode}" (prod olmalı; npm run content:build çalıştır)`);
if (bad.length) errors.push(`${bad.length} onaysız/test öğesi var (ilk: ${bad[0].id})`);

console.log(`Üretim içeriği: ${questions.length}/1800 soru, ${cards.length}/450 kart (lansman hedefi) · mod=${meta.mode}`);
for (const lang of ['tr', 'ar', 'en']) {
  const q = questions.filter((x) => x.lang === lang);
  const c = cards.filter((x) => x.lang === lang);
  const perCat = ['quran', 'siyer', 'kissalar', 'tarih', 'ilmihal', 'arapca'].map((k) => `${k}:${q.filter((x) => x.category === k).length}`).join(' ');
  const perLv = ['child', 'teen', 'adult'].map((k) => `${k}:${c.filter((x) => x.level === k).length}`).join(' ');
  console.log(`  ${lang}: ${q.length} soru (${perCat}) · ${c.length} kart (${perLv})`);
  if (!strict) continue;
  if (q.length < 300) errors.push(`${lang}: ${q.length} onaylı soru var, ≥300 gerekir`);
  if (q.length < 155) errors.push(`${lang}: Ramazan Ligi için ≥155 soru gerekir`);
  for (const k of ['quran', 'siyer', 'kissalar', 'tarih', 'ilmihal', 'arapca']) {
    const n = q.filter((x) => x.category === k).length;
    if (n < 30) errors.push(`${lang}/${k}: ${n} onaylı soru var, ≥30 gerekir`);
  }
  if (c.length < 90) errors.push(`${lang}: ${c.length} onaylı kart var, ≥90 gerekir`);
  for (const lv of ['child', 'teen', 'adult']) {
    const n = c.filter((x) => x.level === lv).length;
    if (n < 25) errors.push(`${lang}/${lv}: ${n} onaylı kart var, ≥25 gerekir`);
  }
}
if (errors.length) {
  errors.forEach((e) => console.error('✗ ' + e));
  process.exit(1);
}
console.log(strict ? '✓ Yalnızca onaylı içerik ve dil başına yeterli hacim.' : '✓ Yalnızca onaylı içerik.');
