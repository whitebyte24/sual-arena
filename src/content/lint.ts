/**
 * İçerik KALİTE denetimi (biçim denetimi `validate.ts`'te). Saf TS.
 * Hata = düzeltilmeden onaya gidemez; Uyarı = editör bilsin.
 * Yakalananlar: Kur'an kaynak referanslarında sure/ayet uyuşmazlığı, "hepsi/hiçbiri" şıkları, dil–yazı uyuşmazlığı,
 * cevabı soruda verme, "en uzun şık doğru" yanlılığı, doğru şık dağılımı, yakın tekrar soru.
 */
import { SURAHS, nameMatches } from './quranData';
import type { Card, Question } from './schema';
import { normalize } from './validate';

export interface LintItem {
  id: string;
  severity: 'error' | 'warning';
  message: string;
}

const BAD_OPTION = /(^|\s)(hepsi|hiçbiri|hiçbirisi|yukarıdakilerin|yukarıdakiler|all of the above|none of the above|both a and b|كل ما سبق|لا شيء مما|جميع ما سبق)(\s|$|[.,])/iu;
const ARABIC = /[؀-ۿ]/;
const TURKISH_ONLY = /[çğışöüÇĞİŞÖÜ]/;

const stripName = (s: string) =>
  s
    .replace(/kur['’]an[-\s]ı kerim|kur['’]an|quran|qur['’]an|القرآن الكريم|سورة|sûresi|suresi|sure|surah|sûre/giu, ' ')
    .replace(/[(),;:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Kaynak metnindeki Kur'an referanslarını (Ad N/M[-K]) doğrular. */
export function lintSource(id: string, source: string): LintItem[] {
  const out: LintItem[] = [];
  const parts = source.split(/[;؛،]|,\s|\s(?:ve|and|و)\s/u);
  for (const part of parts) {
    const m = part.match(/^\s*(.*?)\s*(\d{1,3})\s*[/:]\s*(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?\s*$/u);
    if (!m) continue;
    const name = stripName(m[1]);
    const n = Number(m[2]);
    const from = Number(m[3]);
    const to = m[4] ? Number(m[4]) : from;
    // Kur'an referansı sayılması için adın herhangi bir sureye benzemesi gerekir (hadis/kitap referansı değilse)
    const anyMatch = name ? SURAHS.some((s) => nameMatches(name, s.n)) : false;
    if (!anyMatch) {
      if (n >= 1 && n <= 114 && /sure|sûre|surah|سورة|quran|kur['’]an/iu.test(part)) {
        out.push({ id, severity: 'warning', message: `kaynak "${part.trim()}": sure adı tanınmadı` });
      }
      continue;
    }
    if (n < 1 || n > 114) {
      out.push({ id, severity: 'error', message: `kaynak "${part.trim()}": sure numarası 1-114 olmalı` });
      continue;
    }
    if (!nameMatches(name, n)) {
      out.push({ id, severity: 'error', message: `kaynak "${part.trim()}": ad ile sure numarası uyuşmuyor (${n}. sure = ${SURAHS[n - 1].tr})` });
    }
    const max = SURAHS[n - 1].verses;
    if (from < 1 || to > max || to < from) {
      out.push({ id, severity: 'error', message: `kaynak "${part.trim()}": ${SURAHS[n - 1].tr} ${max} ayettir` });
    }
  }
  return out;
}

const tokens = (s: string) => new Set(normalize(s).replace(/[^\p{L}\p{N}\s]/gu, ' ').split(' ').filter((w) => w.length > 2));

function jaccard(a: Set<string>, b: Set<string>): number {
  // kısa/şablon sorular ("Arapça 'X' ne anlama gelir?") benzer görünür; yalnızca yeterince uzun sorular karşılaştırılır
  if (a.size < 8 || b.size < 8) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

export function lintQuestions(questions: readonly Question[]): LintItem[] {
  const out: LintItem[] = [];
  const add = (id: string, severity: LintItem['severity'], message: string) => out.push({ id, severity, message });

  for (const q of questions) {
    out.push(...lintSource(q.id, q.source));
    for (const o of q.options) if (BAD_OPTION.test(o)) add(q.id, 'error', `"hepsi/hiçbiri" türü şık yasak: "${o}"`);
    const text = `${q.question} ${q.options.join(' ')} ${q.explanation}`;
    if (q.lang === 'ar' && !ARABIC.test(q.question)) add(q.id, 'error', 'Arapça soru Arapça yazı içermiyor');
    if (q.lang !== 'ar' && ARABIC.test(q.question) && q.category !== 'arapca') add(q.id, 'warning', 'soru metninde Arapça yazı var (arapca kategorisi dışında)');
    if (q.lang === 'en' && TURKISH_ONLY.test(text)) add(q.id, 'error', 'İngilizce metinde Türkçe harf var');
    const correct = normalize(q.options[q.answer_index]);
    if (correct.length >= 4 && ` ${normalize(q.question)} `.includes(` ${correct} `))
      add(q.id, 'warning', 'doğru şık soru metninde geçiyor (cevap sızıyor olabilir)');
    if (q.explanation.length < 15) add(q.id, 'warning', 'açıklama çok kısa');
  }

  for (const lang of ['tr', 'ar', 'en'] as const) {
    const qs = questions.filter((q) => q.lang === lang);
    if (qs.length >= 40) {
      const pos = [0, 0, 0, 0];
      let longest = 0;
      for (const q of qs) {
        pos[q.answer_index]++;
        const lens = q.options.map((o) => o.length);
        if (lens[q.answer_index] === Math.max(...lens) && lens.filter((l) => l === Math.max(...lens)).length === 1) longest++;
      }
      pos.forEach((c, i) => {
        const r = c / qs.length;
        if (r < 0.18 || r > 0.32) add(`(${lang})`, 'warning', `doğru şık dağılımı dengesiz: ${'ABCD'[i]} = %${Math.round(r * 100)}`);
      });
      if (longest / qs.length > 0.4) add(`(${lang})`, 'warning', `doğru cevap sıklıkla en uzun şık (%${Math.round((longest / qs.length) * 100)}); yanlış şıkları uzatın`);
    }
    // yakın tekrar
    const tk = qs.map((q) => ({ q, t: tokens(q.question) }));
    for (let i = 0; i < tk.length; i++)
      for (let j = i + 1; j < tk.length; j++) {
        if (tk[i].q.category !== tk[j].q.category) continue;
        if (jaccard(tk[i].t, tk[j].t) >= 0.85) add(tk[j].q.id, 'warning', `${tk[i].q.id} ile çok benzer soru`);
      }
  }
  return out;
}

export function lintCards(cards: readonly Card[]): LintItem[] {
  const out: LintItem[] = [];
  for (const c of cards) {
    const all = [c.target, ...c.forbidden].join(' ');
    if (c.lang === 'ar' && !ARABIC.test(c.target)) out.push({ id: c.id, severity: 'error', message: 'Arapça kart Arapça yazı içermiyor' });
    if (c.lang === 'en' && TURKISH_ONLY.test(all)) out.push({ id: c.id, severity: 'error', message: 'İngilizce kartta Türkçe harf var' });
    if (c.lang !== 'ar' && ARABIC.test(c.target)) out.push({ id: c.id, severity: 'warning', message: 'hedef Arapça yazıyla' });
  }
  const seen = new Map<string, string>();
  for (const c of cards) {
    const k = `${c.lang}|${normalize(c.target)}`;
    const p = seen.get(k);
    if (p) out.push({ id: c.id, severity: 'error', message: `${p} ile aynı hedef` });
    else seen.set(k, c.id);
  }
  return out;
}
