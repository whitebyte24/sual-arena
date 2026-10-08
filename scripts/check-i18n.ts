/** locales/*.json anahtar eşitliğini kontrol eder (tr referanstır). */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '..', 'locales');
const flat = (o: Record<string, unknown>, p = ''): string[] =>
  Object.entries(o).flatMap(([k, v]) =>
    typeof v === 'object' && v ? flat(v as Record<string, unknown>, `${p}${k}.`) : [`${p}${k}`],
  );
const load = (l: string) => new Set(flat(JSON.parse(readFileSync(join(ROOT, `${l}.json`), 'utf8'))));

const ref = load('tr');
let bad = 0;
for (const l of ['ar', 'en']) {
  const set = load(l);
  const missing = [...ref].filter((k) => !set.has(k));
  const extra = [...set].filter((k) => !ref.has(k));
  if (missing.length || extra.length) {
    bad++;
    console.log(`${l}: eksik ${missing.length} (${missing.slice(0, 3).join(', ')}), fazla ${extra.length}`);
  }
}
console.log(bad ? 'i18n: HATA' : `i18n: tamam (${ref.size} anahtar)`);
process.exit(bad ? 1 : 0);
