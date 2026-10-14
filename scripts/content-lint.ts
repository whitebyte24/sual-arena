/**
 * Kullanım: npm run content:lint
 * content/raw + content/approved içindeki soru/kartların KALİTE denetimi (src/content/lint.ts). Hata varsa çıkış kodu 1.
 * Uyarılar content/lint-report.json'a yazılır; konsola yalnızca sayılar basılır.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { lintCards, lintQuestions, type LintItem } from '../src/content/lint';
import type { Card, Question } from '../src/content/schema';

const ROOT = join(__dirname, '..');
const read = <T>(dir: string, prefix: string): T[] => {
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) return [];
  return readdirSync(abs)
    .filter((f) => f.startsWith(prefix) && f.endsWith('.json') && !f.includes('dev-seed'))
    .flatMap((f) => JSON.parse(readFileSync(join(abs, f), 'utf8')) as T[]);
};
const questions = [...read<Question>('content/raw', 'questions'), ...read<Question>('content/approved', 'questions')];
const cards = [...read<Card>('content/raw', 'cards'), ...read<Card>('content/approved', 'cards')];

const items: LintItem[] = [...lintQuestions(questions), ...lintCards(cards)];
const errors = items.filter((i) => i.severity === 'error');
const warnings = items.filter((i) => i.severity === 'warning');
writeFileSync(join(ROOT, 'content/lint-report.json'), JSON.stringify({ errors, warnings }, null, 1));

const by = (lang: string, cat?: string) => questions.filter((q) => q.lang === lang && (!cat || q.category === cat)).length;
console.log(`content:lint → soru TR ${by('tr')} · AR ${by('ar')} · EN ${by('en')} · kart ${cards.length} · hata ${errors.length} · uyarı ${warnings.length}`);
if (errors.length) {
  errors.slice(0, 30).forEach((e) => console.log(`  ✗ ${e.id}: ${e.message}`));
  if (errors.length > 30) console.log(`  … ${errors.length - 30} hata daha (content/lint-report.json)`);
  process.exit(1);
}
