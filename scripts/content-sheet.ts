/**
 * İnsan editör için tek dosyalık İNCELEME SAYFASI üretir: content/review/index.html (git'e girmez).
 *   npm run content:sheet [-- --status draft]      (varsayılan: yalnızca "draft" olanlar)
 * Sayfayı tarayıcıda aç → her öğe için Onayla / Reddet / Beklet seç → "Kararları indir" → decisions.json.
 * Sonra:  npm run content:apply -- decisions.json
 * Sayfa kendi içinde çalışır (internet/sunucu gerekmez); doğru şık yeşil işaretlenir.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, relative } from 'node:path';

const ROOT = join(__dirname, '..');
const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const wantStatus = arg('status') ?? 'draft';

function files(dir: string): string[] {
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) return [];
  return readdirSync(abs, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.json') && /^(questions|cards)/.test(e.name) && !e.name.includes('dev-seed'))
    .map((e) => join(e.parentPath, e.name));
}

const esc = (s: unknown) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

interface Item {
  id: string;
  lang: string;
  review_status: string;
  question?: string;
  options?: string[];
  answer_index?: number;
  source?: string;
  explanation?: string;
  category?: string;
  difficulty?: number;
  target?: string;
  forbidden?: string[];
  level?: string;
}

const sections: string[] = [];
let total = 0;
for (const file of [...files('content/raw'), ...files('content/approved')]) {
  const items = (JSON.parse(readFileSync(file, 'utf8')) as Item[]).filter((i) => i.review_status === wantStatus);
  if (!items.length) continue;
  total += items.length;
  const cards = items.map((it) => {
    const dir = it.lang === 'ar' ? 'rtl' : 'ltr';
    const body = it.question
      ? `<div class="q" dir="${dir}">${esc(it.question)}</div>
         <ol class="opts" dir="${dir}">${(it.options ?? []).map((o, i) => `<li class="${i === it.answer_index ? 'ok' : ''}">${esc(o)}</li>`).join('')}</ol>
         <div class="meta" dir="${dir}"><b>Açıklama:</b> ${esc(it.explanation ?? '')}</div>
         <div class="meta" dir="${dir}"><b>Kaynak:</b> ${esc(it.source ?? '')}</div>
         <div class="tag">${esc(it.category)} · zorluk ${esc(it.difficulty)}</div>`
      : `<div class="q" dir="${dir}">${esc(it.target)}</div>
         <div class="forb" dir="${dir}">${(it.forbidden ?? []).map((f) => `<span>${esc(f)}</span>`).join('')}</div>
         <div class="tag">kart · ${esc(it.level)}</div>`;
    return `<article data-id="${esc(it.id)}">
      <header><code>${esc(it.id)}</code>
        <label><input type="radio" name="${esc(it.id)}" value="approved"> Onayla</label>
        <label><input type="radio" name="${esc(it.id)}" value="rejected"> Reddet</label>
        <label><input type="radio" name="${esc(it.id)}" value="draft" checked> Beklet</label>
      </header>${body}</article>`;
  });
  sections.push(`<h2>${esc(relative(ROOT, file))} <small>(${items.length})</small></h2>${cards.join('')}`);
}

const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sual Arena — İçerik İnceleme</title>
<style>
body{font:16px/1.5 system-ui,sans-serif;background:#0b1b33;color:#f4f1e8;margin:0;padding:16px 16px 120px;max-width:820px;margin-inline:auto}
h1{color:#e0b04a} h2{margin-top:32px;border-bottom:1px solid #1e3a63;padding-bottom:6px} small{color:#9db0c9}
article{background:#18335a;border:1px solid #1e3a63;border-radius:16px;padding:14px;margin:12px 0}
header{display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin-bottom:8px} header code{color:#e0b04a;margin-inline-end:auto}
label{cursor:pointer;padding:4px 10px;border-radius:999px;background:#12294a} label:has(input:checked){outline:2px solid #e0b04a}
.q{font-size:19px;font-weight:700;margin:6px 0} .opts{margin:6px 0;padding-inline-start:24px} .opts li{padding:2px 0}
.opts li.ok{color:#63dca6;font-weight:700} .opts li.ok::after{content:" ✓"}
.meta{color:#bccac0;font-size:14px;margin:2px 0} .tag{color:#9db0c9;font-size:12px;margin-top:6px}
.forb span{display:inline-block;background:#3a2330;border-radius:999px;padding:2px 12px;margin:2px 4px}
.bar{position:fixed;inset-inline:0;bottom:0;background:#12294a;border-top:1px solid #1e3a63;padding:12px 16px;display:flex;gap:12px;align-items:center;justify-content:center}
button{background:#0e9f6e;color:#fff;border:0;border-radius:12px;padding:10px 18px;font-size:16px;font-weight:700;cursor:pointer}
</style></head><body>
<h1>İçerik İnceleme — ${total} öğe (${esc(wantStatus)})</h1>
<p>Her öğeyi gerçekle karşılaştır. <b>Doğru şık yeşil</b> işaretlidir. Emin olmadığını "Beklet" bırak. Şüpheli/yanlış olanı "Reddet".
Kaynak alanı gerçekten bunu söylüyor mu? Yanlış şıklardan biri de doğru sayılabilir mi? Mezhepler arası ihtilaflı bir hüküm var mı?</p>
${sections.join('\n')}
<div class="bar"><span id="count"></span><button id="dl">Kararları indir (decisions.json)</button></div>
<script>
const out=()=>{const d={};document.querySelectorAll('article').forEach(a=>{const v=a.querySelector('input:checked').value;if(v!=='${wantStatus}')d[a.dataset.id]=v});return d};
const upd=()=>{const d=out();const vals=Object.values(d);document.getElementById('count').textContent=vals.filter(v=>v==='approved').length+' onay · '+vals.filter(v=>v==='rejected').length+' ret'};
document.addEventListener('change',upd);upd();
document.getElementById('dl').onclick=()=>{const b=new Blob([JSON.stringify(out(),null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='decisions.json';a.click()};
</script></body></html>`;

mkdirSync(join(ROOT, 'content/review'), { recursive: true });
writeFileSync(join(ROOT, 'content/review/index.html'), html);
console.log(`İnceleme sayfası: content/review/index.html (${total} öğe, durum=${wantStatus}, ${basename(ROOT)})`);
