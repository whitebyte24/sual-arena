/**
 * Kompakt yazım biçimi → content/raw şeması. Kullanım: npm run content:compile [-- --force]
 *
 * content/authoring/q.<dil>.<kategori>.<ad>.json : { "lang":"tr", "category":"quran", "items":[ [soru, DOĞRU, yanlış1, yanlış2, yanlış3, zorluk(1-3), kaynak, açıklama], … ] }
 * content/authoring/c.<dil>.<ad>.json            : { "lang":"tr", "items":[ [hedef, y1, y2, y3, y4, "c"|"t"|"a"], … ] }   (c=child t=teen a=adult)
 *
 * Çıktı: content/raw/questions.<dil>.<kat>.auto.json  ve  content/raw/cards.<dil>.auto.json (hepsi review_status "draft").
 * • Kimlikler, aynı dil+kategorideki mevcut (auto olmayan) dosyaların en büyük kimliğinden sonra, dosya adı sırasıyla artar.
 * • Doğru şıkkın yeri tohumlu karışımla dengelenir (A/B/C/D eşit). Şıkların hepsi sayıyla başlıyorsa küçükten büyüğe sıralanır.
 * • Bir auto dosyasında draft dışında durum varsa (insan kararı) üzerine YAZILMAZ (--force ile geçersiz kılınır).
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { hashString, shuffle } from '../src/lib/rng';
import type { Card, CardLevel, Category, ContentLang, Question } from '../src/content/schema';

const ROOT = join(__dirname, '..');
const AUTH = join(ROOT, 'content/authoring');
const RAW = join(ROOT, 'content/raw');
const force = process.argv.includes('--force');

type QItem = [string, string, string, string, string, 1 | 2 | 3, string, string];
type CItem = [string, string, string, string, string, 'c' | 't' | 'a'];

const pad = (n: number) => String(n).padStart(6, '0');
const leadingNumber = (s: string): number | null => {
  const m = s.trim().match(/^[~≈]?\s*(\d[\d.,]*)/);
  return m ? Number(m[1].replace(/[.,]/g, '')) : null;
};

function maxExistingId(prefix: string): number {
  let max = 0;
  for (const f of readdirSync(RAW)) {
    if (!f.endsWith('.json') || f.endsWith('.auto.json') || !f.startsWith(prefix.split('|')[0])) continue;
    const arr = JSON.parse(readFileSync(join(RAW, f), 'utf8')) as { id: string }[];
    if (!Array.isArray(arr)) continue;
    for (const it of arr) {
      if (it.id.startsWith(prefix.split('|')[1]) && !/-9\d{5}$/.test(it.id)) max = Math.max(max, Number(it.id.slice(-6)));
    }
  }
  return max;
}

function guard(file: string) {
  if (!existsSync(file) || force) return;
  const arr = JSON.parse(readFileSync(file, 'utf8')) as { review_status: string }[];
  const decided = arr.filter((x) => x.review_status !== 'draft').length;
  if (decided) throw new Error(`${file}: ${decided} öğede insan kararı var; ezmemek için durdum (--force ile geçersiz kıl)`);
}

const files = readdirSync(AUTH).filter((f) => f.endsWith('.json')).sort();

// ─── sorular ─────────────────────────────────────────────────────────────────
const qGroups = new Map<string, { lang: ContentLang; category: Category; items: QItem[] }>();
for (const f of files.filter((x) => x.startsWith('q.'))) {
  const j = JSON.parse(readFileSync(join(AUTH, f), 'utf8')) as { lang: ContentLang; category: Category; items: QItem[] };
  const key = `${j.lang}.${j.category}`;
  const g = qGroups.get(key) ?? { lang: j.lang, category: j.category, items: [] };
  g.items.push(...j.items);
  qGroups.set(key, g);
}
let qTotal = 0;
for (const [key, g] of qGroups) {
  const start = maxExistingId(`questions.${g.lang}.${g.category}|q-${g.lang}-${g.category}-`);
  // hedef konumlar: 4'lü bloklar halinde karışık permütasyonlar → tam denge
  const positions: number[] = [];
  for (let b = 0; positions.length < g.items.length; b++) positions.push(...shuffle([0, 1, 2, 3], hashString(`pos|${key}|${b}`))[0]);
  const out: Question[] = g.items.map((it, i) => {
    const [question, correct, w1, w2, w3, difficulty, source, explanation] = it;
    const wrong = [w1, w2, w3];
    const nums = [correct, ...wrong].map(leadingNumber);
    let options: string[];
    let answer: number;
    if (nums.every((n) => n !== null)) {
      options = [correct, ...wrong].sort((a, b) => leadingNumber(a)! - leadingNumber(b)!);
      answer = options.indexOf(correct);
    } else {
      answer = positions[i];
      options = [...wrong];
      options.splice(answer, 0, correct);
    }
    return {
      id: `q-${g.lang}-${g.category}-${pad(start + 1 + i)}`,
      lang: g.lang,
      category: g.category,
      difficulty,
      question,
      options: options as Question['options'],
      answer_index: answer as Question['answer_index'],
      source,
      explanation,
      review_status: 'draft',
    };
  });
  const file = join(RAW, `questions.${g.lang}.${g.category}.auto.json`);
  guard(file);
  writeFileSync(file, JSON.stringify(out, null, 1) + '\n');
  qTotal += out.length;
  console.log(`questions.${g.lang}.${g.category}.auto.json: ${out.length} soru (id ${pad(start + 1)}…${pad(start + out.length)})`);
}

// ─── kartlar ─────────────────────────────────────────────────────────────────
const cGroups = new Map<ContentLang, CItem[]>();
for (const f of files.filter((x) => x.startsWith('c.'))) {
  const j = JSON.parse(readFileSync(join(AUTH, f), 'utf8')) as { lang: ContentLang; items: CItem[] };
  cGroups.set(j.lang, [...(cGroups.get(j.lang) ?? []), ...j.items]);
}
const LEVEL: Record<string, CardLevel> = { c: 'child', t: 'teen', a: 'adult' };
let cTotal = 0;
for (const [lang, items] of cGroups) {
  const start = maxExistingId(`cards.${lang}|c-${lang}-`);
  const out: Card[] = items.map(([target, f1, f2, f3, f4, lv], i) => ({
    id: `c-${lang}-${pad(start + 1 + i)}`,
    lang,
    level: LEVEL[lv],
    target,
    forbidden: [f1, f2, f3, f4],
    review_status: 'draft',
  }));
  const file = join(RAW, `cards.${lang}.auto.json`);
  guard(file);
  writeFileSync(file, JSON.stringify(out, null, 1) + '\n');
  cTotal += out.length;
  console.log(`cards.${lang}.auto.json: ${out.length} kart (id ${pad(start + 1)}…${pad(start + out.length)})`);
}
console.log(`derlendi: ${qTotal} soru, ${cTotal} kart (hepsi draft)`);
