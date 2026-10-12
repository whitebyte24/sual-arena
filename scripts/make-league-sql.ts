/**
 * Ramazan Ligi sezonu için SQL üretir (onaylı sorulardan, tekrarsız 30 gün; finale günü 10 soru).
 *   npm run league:sql -- --lang tr --start 2027-02-08 [--name "Ramazan Ligi 1448"] [--qadr-night 27] [--days 30]
 * Çıktı: supabase/seed/league-<lang>-<start>.sql  → Supabase SQL Editor'da çalıştır.
 * Sezon KAPALI (enabled=false) oluşur; açmak için dosyanın sonundaki iki ifadeyi çalıştır (yeniden yayın gerekmez).
 * Gün numarası = "o takvim gününün iftarından sonra açılan set"; "27. gece" → finale günü 26 (bkz. seasonPlan.ts).
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEFAULT_QADR_NIGHT, finalDayFor, planSeason, questionsNeeded } from '../src/features/lig/seasonPlan';
import { addDays } from '../src/lib/date';

const arg = (n: string) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const lang = arg('lang');
const start = arg('start');
const days = Number(arg('days') ?? 30);
const qadrNight = Number(arg('qadr-night') ?? DEFAULT_QADR_NIGHT);
if (!lang || !['tr', 'ar', 'en'].includes(lang) || !start || !/^\d{4}-\d{2}-\d{2}$/.test(start)) {
  console.error('Kullanım: npm run league:sql -- --lang tr|ar|en --start YYYY-MM-DD [--name "…"] [--qadr-night 27] [--days 30]');
  process.exit(2);
}
const name = arg('name') ?? `Ramazan Ligi ${start.slice(0, 4)}`;

const ROOT = join(__dirname, '..');
function files(dir: string): string[] {
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) return [];
  return readdirSync(abs, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.json') && e.name.startsWith('questions') && !e.name.includes('dev-seed'))
    .map((e) => join(e.parentPath, e.name));
}
const ids = new Set<string>();
for (const f of [...files('content/raw'), ...files('content/approved')]) {
  for (const q of JSON.parse(readFileSync(f, 'utf8')) as { id: string; lang: string; review_status: string }[]) {
    if (q.lang === lang && q.review_status === 'approved') ids.add(q.id);
  }
}

const need = questionsNeeded(days, qadrNight);
if (ids.size < need) {
  console.error(`Yetersiz onaylı soru (${lang}): ${ids.size} var, ${need} gerekli. Önce içerik onayı (docs/editor-guide.md).`);
  process.exit(1);
}

const plan = planSeason({ questionIds: [...ids], startsOn: start, days, qadrNight, seedKey: `${lang}-${start}` });
const end = addDays(start, days - 1);

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
const rows = plan
  .map((d) => `  (${d.day_no}, array[${d.question_ids.map(q).join(', ')}]::text[], timestamptz ${q(d.opens_at)}, ${d.is_final})`)
  .join(',\n');

const sql = `-- Ramazan Ligi (${lang}) ${start} → ${end}; finale günü ${finalDayFor(qadrNight)} (${qadrNight}. gece). Üretildi: scripts/make-league-sql.ts
with s as (
  insert into public.league_seasons (name, starts_on, ends_on, qadr_day_no, enabled, lang)
  values (${q(name)}, ${q(start)}, ${q(end)}, ${finalDayFor(qadrNight)}, false, ${q(lang)})
  returning id
)
insert into public.league_days (season_id, day_no, question_ids, opens_at, is_final)
select s.id, v.day_no, v.ids, v.opens_at, v.is_final
from s, (values
${rows}
) as v(day_no, ids, opens_at, is_final);

-- ── AÇMAK İÇİN (yeniden yayın gerekmez) ───────────────────────────────────────
-- update public.league_seasons set enabled = true where name = ${q(name)} and lang = ${q(lang)};
-- update public.remote_config set value = jsonb_set(value, '{league_enabled}', 'true'), updated_at = now() where key = 'features';
-- ── KAPATMAK İÇİN ─────────────────────────────────────────────────────────────
-- update public.remote_config set value = jsonb_set(value, '{league_enabled}', 'false'), updated_at = now() where key = 'features';
`;

mkdirSync(join(ROOT, 'supabase/seed'), { recursive: true });
const out = join(ROOT, `supabase/seed/league-${lang}-${start}.sql`);
writeFileSync(out, sql);
console.log(`Yazıldı: ${out} (${days} gün, ${plan.reduce((n, d) => n + d.question_ids.length, 0)} soru, finale ${finalDayFor(qadrNight)}. gün)`);
