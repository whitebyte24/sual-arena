/**
 * İnsan editör için tek dosyalık İNCELEME SAYFASI üretir: content/review/index.html (git'e girmez).
 *   npm run content:sheet [-- --status draft]      (varsayılan: yalnızca "draft" olanlar)
 * Sayfa tarayıcıda açılır (internet/sunucu gerekmez):
 *   • Filtreler: dil, tür (soru/kart), kategori/seviye, karar durumu, "uyarılı", metin araması; 25'erli sayfalar.
 *   • Her öğe için Onayla / Reddet / Beklet; "bu sayfayı onayla" ve "filtredekileri onayla" toplu düğmeleri.
 *   • İlerleme tarayıcıda (localStorage) saklanır; sayfa kapansa da kaybolmaz. "Kararları içe aktar" ile devam edilebilir.
 *   • "Kararları indir" → decisions.json  →  npm run content:apply -- decisions.json
 * Doğru şık yeşil işaretlenir; kalite denetimi (src/content/lint.ts) uyarıları öğenin altında gösterilir.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { lintCards, lintQuestions } from '../src/content/lint';
import type { Card, Question } from '../src/content/schema';

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

const allQ: Question[] = [];
const allC: Card[] = [];
for (const file of [...files('content/raw'), ...files('content/approved')]) {
  const arr = JSON.parse(readFileSync(file, 'utf8')) as (Question | Card)[];
  for (const it of arr) ('question' in it ? allQ : allC).push(it as never);
}
const warn = new Map<string, string[]>();
for (const w of [...lintQuestions(allQ), ...lintCards(allC)]) {
  if (w.id.startsWith('(')) continue;
  warn.set(w.id, [...(warn.get(w.id) ?? []), `${w.severity === 'error' ? '✗' : '⚠'} ${w.message}`]);
}

const data = [
  ...allQ.filter((q) => q.review_status === wantStatus).map((q) => ({
    i: q.id, l: q.lang, k: 'q', c: q.category, d: q.difficulty, q: q.question, o: q.options, a: q.answer_index, s: q.source, e: q.explanation, w: warn.get(q.id) ?? [],
  })),
  ...allC.filter((c) => c.review_status === wantStatus).map((c) => ({
    i: c.id, l: c.lang, k: 'c', c: c.level, t: c.target, f: c.forbidden, w: warn.get(c.id) ?? [],
  })),
];
const json = JSON.stringify(data).replace(/</g, '\\u003c');

const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sual Arena — İçerik İnceleme</title>
<style>
body{font:16px/1.5 system-ui,sans-serif;background:#0b1b33;color:#f4f1e8;margin:0;padding:16px 16px 140px;max-width:860px;margin-inline:auto}
h1{color:#e0b04a;font-size:22px;margin:0 0 4px} .sub{color:#9db0c9;font-size:14px;margin-bottom:12px}
.filters{position:sticky;top:0;z-index:5;background:#0b1b33;padding:8px 0 10px;border-bottom:1px solid #1e3a63;display:flex;gap:8px;flex-wrap:wrap;align-items:center}
select,input[type=search]{background:#12294a;color:#f4f1e8;border:1px solid #1e3a63;border-radius:10px;padding:8px 10px;font-size:15px}
input[type=search]{flex:1;min-width:140px}
article{background:#18335a;border:1px solid #1e3a63;border-radius:16px;padding:14px;margin:12px 0}
article.dec-approved{border-color:#0e9f6e} article.dec-rejected{border-color:#c0504d;opacity:.85}
header{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px} header code{color:#e0b04a;margin-inline-end:auto;font-size:13px}
.btn{cursor:pointer;padding:5px 12px;border-radius:999px;background:#12294a;border:1px solid transparent;color:#f4f1e8;font-size:14px}
.btn.on{outline:2px solid #e0b04a}.btn.a.on{background:#0e9f6e}.btn.r.on{background:#8a2f2d}
.q{font-size:19px;font-weight:700;margin:6px 0}.opts{margin:6px 0;padding-inline-start:24px}.opts li{padding:2px 0}
.opts li.ok{color:#63dca6;font-weight:700}.opts li.ok::after{content:" ✓"}
.meta{color:#bccac0;font-size:14px;margin:2px 0}.tag{color:#9db0c9;font-size:12px;margin-top:6px}
.warn{color:#f0c36a;font-size:13px;margin-top:6px}
.forb span{display:inline-block;background:#3a2330;border-radius:999px;padding:2px 12px;margin:2px 4px}
.bar{position:fixed;inset-inline:0;bottom:0;background:#12294a;border-top:1px solid #1e3a63;padding:10px 16px;display:flex;gap:10px;align-items:center;justify-content:center;flex-wrap:wrap}
button.p{background:#0e9f6e;color:#fff;border:0;border-radius:12px;padding:9px 14px;font-size:15px;font-weight:700;cursor:pointer}
button.s{background:#223f6b;color:#fff;border:0;border-radius:12px;padding:9px 14px;font-size:15px;cursor:pointer}
</style></head><body>
<h1>İçerik İnceleme</h1>
<div class="sub" id="head"></div>
<div class="filters">
  <select id="fl"><option value="">Tüm diller</option><option value="tr">Türkçe</option><option value="ar">العربية</option><option value="en">English</option></select>
  <select id="fk"><option value="">Soru + kart</option><option value="q">Sorular</option><option value="c">Kartlar</option></select>
  <select id="fc"><option value="">Tüm kategori/seviye</option></select>
  <select id="fd"><option value="">Tüm kararlar</option><option value="u">Karar verilmemiş</option><option value="approved">Onaylanan</option><option value="rejected">Reddedilen</option><option value="w">⚠ Uyarılı</option></select>
  <input type="search" id="fs" placeholder="Ara…">
</div>
<div id="list"></div>
<div class="bar">
  <button class="s" id="prev">‹</button><span id="pg"></span><button class="s" id="next">›</button>
  <button class="s" id="apg">Bu sayfayı onayla</button>
  <button class="s" id="aall">Filtredekileri onayla</button>
  <button class="p" id="dl">Kararları indir</button>
  <button class="s" id="imp">İçe aktar</button><input type="file" id="file" accept=".json" hidden>
  <span id="count"></span>
</div>
<script>
const DATA=${json}, STATUS=${JSON.stringify(wantStatus)}, KEY='sual.decisions.v1', PER=25;
let dec={}; try{dec=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
const cats=[...new Set(DATA.map(x=>x.c))].sort(); cats.forEach(c=>{const o=document.createElement('option');o.value=c;o.textContent=c;$('fc').appendChild(o)});
let page=0, view=[];
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(dec))}catch(e){}};
function filter(){
  const l=$('fl').value,k=$('fk').value,c=$('fc').value,d=$('fd').value,s=$('fs').value.trim().toLowerCase();
  view=DATA.filter(x=>(!l||x.l===l)&&(!k||x.k===k)&&(!c||x.c===c)&&(!s||(x.q||x.t||'').toLowerCase().includes(s)||x.i.includes(s))
    &&(!d||(d==='u'?!dec[x.i]:d==='w'?x.w.length>0:dec[x.i]===d)));
  page=Math.min(page,Math.max(0,Math.ceil(view.length/PER)-1));
}
function card(x){
  const dir=x.l==='ar'?'rtl':'ltr', v=dec[x.i]||'';
  const body=x.k==='q'
    ?'<div class="q" dir="'+dir+'">'+esc(x.q)+'</div><ol class="opts" dir="'+dir+'">'+x.o.map((o,i)=>'<li class="'+(i===x.a?'ok':'')+'">'+esc(o)+'</li>').join('')+'</ol><div class="meta" dir="'+dir+'"><b>Açıklama:</b> '+esc(x.e)+'</div><div class="meta" dir="'+dir+'"><b>Kaynak:</b> '+esc(x.s)+'</div><div class="tag">'+esc(x.c)+' · zorluk '+x.d+'</div>'
    :'<div class="q" dir="'+dir+'">'+esc(x.t)+'</div><div class="forb" dir="'+dir+'">'+x.f.map(f=>'<span>'+esc(f)+'</span>').join('')+'</div><div class="tag">kart · '+esc(x.c)+'</div>';
  const w=x.w.length?'<div class="warn">'+x.w.map(esc).join('<br>')+'</div>':'';
  return '<article class="dec-'+v+'" data-id="'+x.i+'"><header><code>'+x.i+'</code>'
    +'<span class="btn a'+(v==='approved'?' on':'')+'" data-v="approved">Onayla</span>'
    +'<span class="btn r'+(v==='rejected'?' on':'')+'" data-v="rejected">Reddet</span>'
    +'<span class="btn'+(!v?' on':'')+'" data-v="">Beklet</span></header>'+body+w+'</article>';
}
function render(){
  filter();
  const slice=view.slice(page*PER,page*PER+PER);
  $('list').innerHTML=slice.map(card).join('')||'<p>Eşleşen öğe yok.</p>';
  $('pg').textContent=(page+1)+' / '+Math.max(1,Math.ceil(view.length/PER))+' · '+view.length+' öğe';
  const vals=Object.values(dec), ap=vals.filter(v=>v==='approved').length, rj=vals.filter(v=>v==='rejected').length;
  $('count').textContent=ap+' onay · '+rj+' ret · '+(DATA.length-ap-rj)+' bekliyor';
  $('head').textContent=DATA.length+' öğe ('+STATUS+'). Doğru şık yeşildir. Emin olmadığını "Beklet" bırak; ilerleme bu tarayıcıda saklanır.';
  window.scrollTo(0,0);
}
$('list').addEventListener('click',e=>{const b=e.target.closest('.btn');if(!b)return;const id=b.closest('article').dataset.id;if(b.dataset.v)dec[id]=b.dataset.v;else delete dec[id];save();
  const x=DATA.find(y=>y.i===id);const a=b.closest('article');a.outerHTML=card(x);
  const vals=Object.values(dec);$('count').textContent=vals.filter(v=>v==='approved').length+' onay · '+vals.filter(v=>v==='rejected').length+' ret · '+(DATA.length-vals.length)+' bekliyor'});
['fl','fk','fc','fd'].forEach(id=>$(id).addEventListener('change',()=>{page=0;render()}));$('fs').addEventListener('input',()=>{page=0;render()});
$('prev').onclick=()=>{if(page>0){page--;render()}};$('next').onclick=()=>{if((page+1)*PER<view.length){page++;render()}};
$('apg').onclick=()=>{view.slice(page*PER,page*PER+PER).forEach(x=>{if(!dec[x.i])dec[x.i]='approved'});save();render()};
$('aall').onclick=()=>{const n=view.filter(x=>!dec[x.i]).length;if(confirm('Filtredeki '+n+' kararsız öğe onaylanacak. Emin misin?')){view.forEach(x=>{if(!dec[x.i])dec[x.i]='approved'});save();render()}};
$('dl').onclick=()=>{const b=new Blob([JSON.stringify(dec,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='decisions.json';a.click()};
$('imp').onclick=()=>$('file').click();
$('file').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{Object.assign(dec,JSON.parse(await f.text()));save();render()}catch(err){alert('Dosya okunamadı')}};
render();
</script></body></html>`;

mkdirSync(join(ROOT, 'content/review'), { recursive: true });
writeFileSync(join(ROOT, 'content/review/index.html'), html);
console.log(`İnceleme sayfası: content/review/index.html (${data.length} öğe, durum=${wantStatus}, uyarılı=${data.filter((d) => d.w.length).length})`);
