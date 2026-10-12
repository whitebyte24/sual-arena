/**
 * Mağaza derlemesinden önce: src/content/generated yalnızca ONAYLI içerik taşıyor mu?
 *   npm run content:verify-prod
 * `npm install` ve `npm run check` üretim derlemesi (yalnızca approved) yapar; `npm start` DEV derlemesi yapar.
 * Dev derlemesi kalmışsa veya taslak/test kimliği sızmışsa hata verir (çıkış kodu 1).
 * Lansman hedefleri (3.000 soru, 600 kart) için bilgi satırı basar; eksik olması hatayı tetiklemez.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(__dirname, '..', 'src/content/generated');
const read = <T>(f: string): T => JSON.parse(readFileSync(join(dir, f), 'utf8')) as T;
if (!existsSync(join(dir, 'meta.json'))) {
  console.error('generated/ yok: önce npm run content:build');
  process.exit(1);
}
const meta = read<{ mode: string; cards: number; questions: number }>('meta.json');
const cards = read<{ id: string; review_status: string }[]>('cards.json');
const questions = read<{ id: string; review_status: string }[]>('questions.json');

const bad = [...cards, ...questions].filter((x) => x.review_status !== 'approved' || /-9\d{5}$/.test(x.id));
const errors: string[] = [];
if (meta.mode !== 'prod') errors.push(`meta.mode = "${meta.mode}" (prod olmalı; npm run content:build çalıştır)`);
if (bad.length) errors.push(`${bad.length} onaysız/test öğesi var (ilk: ${bad[0].id})`);

console.log(`Üretim içeriği: ${questions.length}/3000 soru, ${cards.length}/600 kart (hedef) · mod=${meta.mode}`);
if (errors.length) {
  errors.forEach((e) => console.error('✗ ' + e));
  process.exit(1);
}
console.log('✓ Yalnızca onaylı içerik.');
