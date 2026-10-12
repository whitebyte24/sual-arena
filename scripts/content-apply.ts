/**
 * Editör kararlarını (content/review sayfasından inen decisions.json) içerik dosyalarına uygular.
 *   npm run content:apply -- decisions.json [--dry]
 * Yalnızca `review_status` alanı değişir. Bilinmeyen kimlik / geçersiz durum raporlanır.
 * Uygulamadan sonra içerik doğrulanır; hata varsa dosyalar değişmeden kalır.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { applyDecisions, type Decisions } from '../src/content/review';
import type { ReviewStatus } from '../src/content/schema';
import { validateCard, validateQuestion } from '../src/content/validate';

const ROOT = join(__dirname, '..');
const decisionsFile = process.argv.slice(2).find((a) => !a.startsWith('--'));
const dry = process.argv.includes('--dry');
if (!decisionsFile || !existsSync(decisionsFile)) {
  console.error('Kullanım: npm run content:apply -- <decisions.json> [--dry]');
  process.exit(2);
}
const decisions = JSON.parse(readFileSync(decisionsFile, 'utf8')) as Decisions;

function files(dir: string): string[] {
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) return [];
  return readdirSync(abs, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.json') && /^(questions|cards)/.test(e.name) && !e.name.includes('dev-seed'))
    .map((e) => join(e.parentPath, e.name));
}

const writes: { file: string; json: string }[] = [];
const applied = new Set<string>();
let invalidTotal = 0;
let changedTotal = 0;
for (const file of [...files('content/raw'), ...files('content/approved')]) {
  const isQ = /questions/.test(file);
  const items = JSON.parse(readFileSync(file, 'utf8')) as { id: string; review_status: ReviewStatus }[];
  const res = applyDecisions(items, decisions);
  res.changed.concat(res.invalid).forEach((id) => applied.add(id));
  items.forEach((i) => decisions[i.id] !== undefined && applied.add(i.id));
  if (res.invalid.length) {
    console.error(`${relative(ROOT, file)}: geçersiz durum → ${res.invalid.join(', ')}`);
    invalidTotal += res.invalid.length;
  }
  if (!res.changed.length) continue;
  // onaylanacak her öğe biçim doğrulamasından geçmeli
  for (const it of res.items.filter((i) => res.changed.includes(i.id) && i.review_status === 'approved')) {
    const issues = isQ ? validateQuestion(it) : validateCard(it);
    if (issues.length) {
      console.error(`ONAYLANAMAZ ${it.id}: ${issues[0].field} – ${issues[0].message}`);
      invalidTotal++;
    }
  }
  changedTotal += res.changed.length;
  writes.push({ file, json: JSON.stringify(res.items, null, 2) + '\n' });
  console.log(`${relative(ROOT, file)}: ${res.changed.length} değişti`);
}

const unknown = Object.keys(decisions).filter((id) => !applied.has(id));
if (unknown.length) console.error(`Dosyada bulunamayan ${unknown.length} kimlik: ${unknown.slice(0, 5).join(', ')}${unknown.length > 5 ? '…' : ''}`);
if (invalidTotal) {
  console.error('Hata var: hiçbir dosya yazılmadı.');
  process.exit(1);
}
if (dry) {
  console.log(`(dry) ${changedTotal} değişiklik yazılmadı.`);
} else {
  for (const w of writes) writeFileSync(w.file, w.json);
  console.log(`Toplam ${changedTotal} öğenin durumu güncellendi. Şimdi: npm run content:validate && npm run content:build`);
}
