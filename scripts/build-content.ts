/**
 * Uygulamaya girecek içeriği src/content/generated/ altına yazar.
 *   npm run content:build        → yalnızca review_status = approved  (üretim, EAS)
 *   npm run content:build:dev    → rejected hariç hepsi (yerel geliştirme; "_" ile başlayan örnekler hariç)
 * Geçersiz öğe varsa HATA verir ve hiçbir şey yazmaz.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import type { Card, Question } from '../src/content/schema';
import { validateCard, validateQuestion } from '../src/content/validate';

const ROOT = join(__dirname, '..');
const OUT = join(ROOT, 'src/content/generated');
const dev = process.argv.includes('--dev');

function files(dir: string, prefix: string): string[] {
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) return [];
  return readdirSync(abs, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.json') && e.name.startsWith(prefix))
    .map((e) => join(e.parentPath, e.name));
}

function collect<T extends { id: string; review_status: string }>(
  prefix: string,
  validate: (x: unknown) => { id: string; field: string; message: string }[],
): T[] {
  const byId = new Map<string, T>();
  const errors: string[] = [];
  // raw önce, approved sonra: aynı id'de approved kazanır
  const sources = [...(dev ? files('content/raw', prefix) : []), ...files('content/approved', prefix)];
  for (const file of sources) {
    const data = JSON.parse(readFileSync(file, 'utf8')) as T[];
    for (const item of data) {
      if (item.review_status === 'rejected') continue;
      if (!dev && item.review_status !== 'approved') continue;
      const issues = validate(item);
      if (issues.length) errors.push(`${basename(file)} ${issues[0].id}: ${issues[0].field} – ${issues[0].message}`);
      byId.set(item.id, item);
    }
  }
  if (errors.length) {
    console.error(`İçerik hatası (${errors.length}):\n  ${errors.slice(0, 10).join('\n  ')}`);
    process.exit(1);
  }
  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
}

const cards = collect<Card & { review_status: string }>('cards', validateCard);
const questions = collect<Question & { review_status: string }>('questions', validateQuestion);

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'cards.json'), JSON.stringify(cards));
writeFileSync(join(OUT, 'questions.json'), JSON.stringify(questions));
writeFileSync(
  join(OUT, 'meta.json'),
  JSON.stringify({ mode: dev ? 'dev' : 'prod', cards: cards.length, questions: questions.length }),
);
console.log(`content:build (${dev ? 'dev' : 'prod'}) → kart ${cards.length}, soru ${questions.length}`);
