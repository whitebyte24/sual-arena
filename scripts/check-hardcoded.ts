/**
 * Kodda sabit (çevrilmemiş) kullanıcı metni arar:
 *  1) JSX metin düğümleri ve label/placeholder/title/accessibilityLabel/subtitle nitelikleri,
 *  2) Türkçe harf içeren string sabitleri (yorumlar hariç).
 * Kural: görünen her metin `t('anahtar')` ile locales/*.json'dan gelir (CLAUDE.md). İstisnalar aşağıda açıkça listelidir.
 * Kullanım: npm run i18n:hardcoded  (hata varsa çıkış kodu 1)
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(__dirname, '..');
// Dil adları kendi dillerinde yazılır, marka/teknik etiketler çevrilmez.
const ALLOW = new Set(['BOT', 'Premium', 'Sual Arena', 'TR', 'AR', 'EN', 'ABCD']);
const ATTRS = ['label', 'placeholder', 'title', 'subtitle', 'accessibilityLabel'];
const LETTER = /[A-Za-zÇĞİÖŞÜçğıöşü؀-ۿ]{2,}/;
const TR_CHARS = /[çğıöşüÇĞİÖŞÜ]/;
// dil adları kendi dillerinde; içerik doğrulayıcı iletileri geliştirici aracıdır (kullanıcıya gösterilmez)
// şehir adları üç dilde VERİDİR (cities.ts); seasonPlan.ts hata iletisi sezon üretme betiğine (geliştirici aracı) gider
const SKIP_TR = [
  join('src', 'content', 'generated'),
  join('src', 'i18n', 'lang.ts'),
  join('src', 'content', 'validate.ts'),
  join('src', 'features', 'lig', 'cities.ts'),
  join('src', 'features', 'lig', 'seasonPlan.ts'),
];

function files(dir: string, ext: RegExp): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    return e.isDirectory() ? files(p, ext) : ext.test(p) ? [p] : [];
  });
}

const problems: string[] = [];
const src = join(ROOT, 'src');

// 1) JSX metin düğümleri ve nitelikler
for (const file of files(src, /\.tsx$/)) {
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      const code = line.replace(/\/\/.*$/, '');
      for (const m of code.matchAll(/(?<!=)>([^<>{}]*)</g)) {
        const text = m[1].trim();
        if (LETTER.test(text) && !ALLOW.has(text)) problems.push(`${relative(ROOT, file)}:${i + 1}  metin: "${text}"`);
      }
      for (const attr of ATTRS) {
        for (const m of code.matchAll(new RegExp(`\\b${attr}="([^"]*)"`, 'g'))) {
          const text = m[1].trim();
          if (LETTER.test(text) && !ALLOW.has(text)) problems.push(`${relative(ROOT, file)}:${i + 1}  ${attr}="${text}"`);
        }
      }
    });
}

// 2) Türkçe harf içeren string sabitleri
for (const file of files(src, /\.tsx?$/)) {
  const rel = relative(ROOT, file);
  if (SKIP_TR.some((s) => rel.startsWith(s))) continue;
  const noBlock = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  noBlock.split('\n').forEach((line, i) => {
    const code = line.replace(/(^|\s)\/\/.*$/, '$1');
    for (const m of code.matchAll(/(['"`])((?:\\.|(?!\1).)*?)\1/g)) {
      if (TR_CHARS.test(m[2])) problems.push(`${rel}:${i + 1}  Türkçe sabit: ${m[0]}`);
    }
  });
}

if (problems.length) {
  console.log(`Sabit metin bulundu (${problems.length}):`);
  problems.slice(0, 20).forEach((p) => console.log('  ' + p));
  process.exit(1);
}
console.log('i18n: sabit metin yok');
