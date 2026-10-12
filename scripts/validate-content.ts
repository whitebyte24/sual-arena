/**
 * Kullanım: npm run content:validate [-- --approved-only]
 * content/raw/**.json ve content/approved/**.json dosyalarını doğrular.
 * Dosya adı: questions*.json (Question[]) veya cards*.json (Card[]).
 * Başında "_" olan dosyalar örnektir: doğrulanır ama sayıma girmez.
 * Ayrıntılı rapor content/report.json'a yazılır (sohbete basılmaz).
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import { findDuplicates, validateCard, validateQuestion, type Issue } from '../src/content/validate';

const ROOT = join(__dirname, '..');
const DIRS = ['content/raw', 'content/approved'];
const approvedOnly = process.argv.includes('--approved-only');

function listJson(dir: string): string[] {
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) return [];
  return readdirSync(abs, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.json'))
    .map((e) => join(e.parentPath, e.name));
}

const report: { file: string; issues: Issue[] }[] = [];
const dupQ: { id: string; lang: string; text: string }[] = [];
const dupC: { id: string; lang: string; text: string }[] = [];
const ids = new Map<string, string>();
const counts = { questions: 0, cards: 0, approvedQuestions: 0, approvedCards: 0 };
const fileIssue = (file: string, message: string) => report.push({ file, issues: [{ id: '?', field: '*', message }] });

for (const file of DIRS.flatMap(listJson)) {
  const rel = relative(ROOT, file);
  const name = basename(file);
  const example = name.startsWith('_');
  const base = name.replace(/^_/, '');
  const isQ = base.startsWith('questions');
  const isC = base.startsWith('cards');
  let data: unknown;
  try {
    data = JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    fileIssue(rel, `JSON okunamadı: ${(e as Error).message}`);
    continue;
  }
  if (!isQ && !isC) {
    fileIssue(rel, 'dosya adı questions* veya cards* ile başlamalı');
    continue;
  }
  if (!Array.isArray(data)) {
    fileIssue(rel, 'kök dizi olmalı');
    continue;
  }
  const issues: Issue[] = [];
  for (const item of data as Record<string, unknown>[]) {
    if (approvedOnly && item.review_status !== 'approved') continue;
    issues.push(...(isQ ? validateQuestion(item) : validateCard(item)));
    const id = String(item.id);
    if (example) continue; // örnek dosyalar kimlik/tekrar denetimine girmez (gerçek içerikle çakışabilir)
    if (ids.has(id)) issues.push({ id, field: 'id', message: `${ids.get(id)} dosyasında da var` });
    else ids.set(id, rel);
    const approved = item.review_status === 'approved';
    if (isQ) {
      counts.questions++;
      if (approved) counts.approvedQuestions++;
      dupQ.push({ id, lang: String(item.lang), text: String(item.question) });
    } else {
      counts.cards++;
      if (approved) counts.approvedCards++;
      dupC.push({ id, lang: String(item.lang), text: String(item.target) });
    }
  }
  report.push({ file: rel, issues });
}
report.push({ file: '(tekrar: sorular)', issues: findDuplicates(dupQ) });
report.push({ file: '(tekrar: kartlar)', issues: findDuplicates(dupC) });

const total = report.reduce((n, r) => n + r.issues.length, 0);
writeFileSync(join(ROOT, 'content/report.json'), JSON.stringify({ counts, total, report }, null, 2));
console.log(
  `Sorular: ${counts.questions} (onaylı ${counts.approvedQuestions}) · Kartlar: ${counts.cards} (onaylı ${counts.approvedCards}) · Hata: ${total}`,
);
if (total) {
  for (const r of report.filter((r) => r.issues.length).slice(0, 5))
    console.log(`  ${r.file}: ${r.issues.length} hata (ilk: ${r.issues[0].id} ${r.issues[0].field} – ${r.issues[0].message})`);
  console.log('Ayrıntı: content/report.json');
  process.exit(1);
}
