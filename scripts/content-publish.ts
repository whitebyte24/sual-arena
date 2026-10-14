/**
 * Onaylı soru/kart paketlerini UZAKTAN yayınlanacak biçimde üretir (mağaza incelemesi gerektirmez):
 *   npm run content:publish [-- --dry] [-- --allow-small]
 * Çıktı: marketing/landing/content/{manifest.json, q.<dil>.<hash>.json, c.<dil>.<hash>.json}
 * → landing sitesiyle birlikte dağıtılır (push → Cloudflare/GitHub Pages) ve uygulama açılışta indirir.
 * Sürüm: content/version.json +1 (mağaza build'i bu sürümü gömer; uzaktan paket yalnızca daha yeniyse kullanılır).
 * Güvenlik: yalnızca `approved`; dil başına en az 300 soru + 90 kart yoksa durur (--allow-small ile geçilir): paket o dilin
 * gömülü içeriğinin yerini alır, eksik yayın uygulamayı fakirleştirmesin. Şema değişikliği varsa bu yol değil, yeni sürüm gerekir.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { LANGS } from '../src/content/schema';
import { collectContent, readContentVersion, ROOT } from './lib/collect';

const dry = process.argv.includes('--dry');
const allowSmall = process.argv.includes('--allow-small');
const OUT = join(ROOT, 'marketing', 'landing', 'content');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');

const { cards, questions } = collectContent(false);
const version = readContentVersion() + 1;
const problems: string[] = [];
const files = new Map<string, string>();
const packs: Record<string, unknown> = {};

for (const lang of LANGS) {
  const q = questions.filter((x) => x.lang === lang);
  const c = cards.filter((x) => x.lang === lang);
  console.log(`  ${lang}: ${q.length} soru, ${c.length} kart`);
  if (!allowSmall) {
    if (q.length < 300) problems.push(`${lang}: ${q.length} onaylı soru (en az 300)`);
    if (c.length < 90) problems.push(`${lang}: ${c.length} onaylı kart (en az 90)`);
  }
  if (!q.length && !c.length) continue;
  const entry = (kind: 'q' | 'c', items: unknown[]) => {
    const text = JSON.stringify(items);
    const hash = sha(text);
    const file = `${kind}.${lang}.${hash.slice(0, 8)}.json`;
    files.set(file, text);
    return { file, sha256: hash, count: items.length };
  };
  packs[lang] = { ...(q.length ? { questions: entry('q', q) } : {}), ...(c.length ? { cards: entry('c', c) } : {}) };
}

if (problems.length) {
  problems.forEach((p) => console.error('✗ ' + p));
  console.error('Yayın durduruldu. Hacmi tamamlayın ya da bilerek --allow-small kullanın.');
  process.exit(1);
}

const manifest = { schema: 1, version, updated: new Date().toISOString().slice(0, 10), packs };
console.log(`content:publish → sürüm ${version}, ${files.size} paket dosyası${dry ? ' (DRY: yazılmadı)' : ''}`);
if (dry) process.exit(0);

// önceki manifest'in dosyalarını bir sürüm daha tut (eski önbellekli manifest'lerde 404 olmasın), gerisini sil
mkdirSync(OUT, { recursive: true });
const keep = new Set<string>(files.keys());
const oldManifestFile = join(OUT, 'manifest.json');
if (existsSync(oldManifestFile)) {
  try {
    const old = JSON.parse(readFileSync(oldManifestFile, 'utf8')) as { packs?: Record<string, { questions?: { file: string }; cards?: { file: string } }> };
    for (const p of Object.values(old.packs ?? {})) for (const e of [p.questions, p.cards]) if (e) keep.add(e.file);
  } catch {
    // bozuk eski manifest: yoksay
  }
}
for (const f of readdirSync(OUT)) if (f !== 'manifest.json' && !keep.has(f)) rmSync(join(OUT, f));
for (const [file, text] of files) writeFileSync(join(OUT, file), text);
writeFileSync(oldManifestFile, JSON.stringify(manifest, null, 1) + '\n');
writeFileSync(join(ROOT, 'content', 'version.json'), JSON.stringify({ version }) + '\n');
console.log(`Yazıldı: ${OUT}\nSıradaki adım: git add marketing/landing/content content/version.json && commit && push (site yeniden yayınlanır).`);
