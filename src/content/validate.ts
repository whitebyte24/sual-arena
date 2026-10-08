import {
  CARD_ID_RE,
  CATEGORIES,
  LANGS,
  LEVELS,
  LIMITS,
  QUESTION_ID_RE,
  REVIEW_STATUSES,
} from './schema';

export interface Issue {
  id: string;
  field: string;
  message: string;
}

/** Karşılaştırma için: küçük harf (TR kurallı), Arapça harekeleri/tatweel sil, boşlukları sadeleştir. */
export function normalize(s: string): string {
  return s
    .normalize('NFC')
    .toLocaleLowerCase('tr')
    .replace(/[ً-ٰٟـ]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/\s+/g, ' ')
    .trim();
}

const isStr = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

export function validateQuestion(raw: unknown): Issue[] {
  const issues: Issue[] = [];
  if (!isObj(raw)) return [{ id: '?', field: '*', message: 'nesne değil' }];
  const id = isStr(raw.id) ? raw.id : '?';
  const add = (field: string, message: string) => issues.push({ id, field, message });

  if (!isStr(raw.id) || !QUESTION_ID_RE.test(raw.id)) add('id', 'biçim: q-<lang>-<category>-<6 hane>');
  if (!LANGS.includes(raw.lang as never)) add('lang', 'tr|ar|en olmalı');
  if (!CATEGORIES.includes(raw.category as never)) add('category', 'geçersiz kategori');
  if (![1, 2, 3].includes(raw.difficulty as number)) add('difficulty', '1, 2 veya 3 olmalı');
  if (!REVIEW_STATUSES.includes(raw.review_status as never)) add('review_status', 'geçersiz durum');
  if (isStr(raw.id) && QUESTION_ID_RE.test(raw.id)) {
    const [, lang, cat] = raw.id.split('-');
    if (lang !== raw.lang) add('id', 'id içindeki dil, lang alanıyla uyuşmuyor');
    if (cat !== raw.category) add('id', 'id içindeki kategori, category alanıyla uyuşmuyor');
  }

  if (!isStr(raw.question)) add('question', 'boş');
  else if (raw.question.length > LIMITS.question) add('question', `en fazla ${LIMITS.question} karakter`);

  if (!Array.isArray(raw.options) || raw.options.length !== 4) add('options', 'tam 4 şık olmalı');
  else if (!raw.options.every(isStr)) add('options', 'boş şık var');
  else {
    if (raw.options.some((o: string) => o.length > LIMITS.option)) add('options', `şık en fazla ${LIMITS.option} karakter`);
    if (new Set(raw.options.map(normalize)).size !== 4) add('options', 'şıklar birbirinin aynısı (tek doğru cevap garanti değil)');
  }
  if (!Number.isInteger(raw.answer_index) || (raw.answer_index as number) < 0 || (raw.answer_index as number) > 3)
    add('answer_index', '0-3 arası tam sayı olmalı');

  if (!isStr(raw.source)) add('source', 'kaynak zorunlu');
  else if (raw.source.length > LIMITS.source) add('source', `en fazla ${LIMITS.source} karakter`);
  if (!isStr(raw.explanation)) add('explanation', 'açıklama zorunlu');
  else if (raw.explanation.length > LIMITS.explanation) add('explanation', `en fazla ${LIMITS.explanation} karakter`);

  return issues;
}

export function validateCard(raw: unknown): Issue[] {
  const issues: Issue[] = [];
  if (!isObj(raw)) return [{ id: '?', field: '*', message: 'nesne değil' }];
  const id = isStr(raw.id) ? raw.id : '?';
  const add = (field: string, message: string) => issues.push({ id, field, message });

  if (!isStr(raw.id) || !CARD_ID_RE.test(raw.id)) add('id', 'biçim: c-<lang>-<6 hane>');
  if (!LANGS.includes(raw.lang as never)) add('lang', 'tr|ar|en olmalı');
  if (!LEVELS.includes(raw.level as never)) add('level', 'child|teen|adult olmalı');
  if (!REVIEW_STATUSES.includes(raw.review_status as never)) add('review_status', 'geçersiz durum');
  if (isStr(raw.id) && CARD_ID_RE.test(raw.id) && raw.id.split('-')[1] !== raw.lang)
    add('id', 'id içindeki dil, lang alanıyla uyuşmuyor');

  if (!isStr(raw.target)) {
    add('target', 'boş');
    return issues;
  }
  if (raw.target.length > LIMITS.target) add('target', `en fazla ${LIMITS.target} karakter`);

  if (!Array.isArray(raw.forbidden) || raw.forbidden.length !== 4 || !raw.forbidden.every(isStr)) {
    add('forbidden', 'tam 4 dolu yasaklı kelime olmalı');
    return issues;
  }
  const target = normalize(raw.target);
  const forbidden = (raw.forbidden as string[]).map(normalize);
  if ((raw.forbidden as string[]).some((f) => f.length > LIMITS.forbidden))
    add('forbidden', `en fazla ${LIMITS.forbidden} karakter`);
  if (new Set(forbidden).size !== 4) add('forbidden', 'yasaklı kelimeler tekrar ediyor');
  for (const f of forbidden) {
    if (f === target || f.includes(target) || target.includes(f))
      add('forbidden', `"${f}" hedef kelimenin kendisi ya da parçası`);
  }
  return issues;
}

/** Aynı dilde aynı soru metni / aynı hedef kelime tekrarını bulur. */
export function findDuplicates(items: { id: string; lang: string; text: string }[]): Issue[] {
  const seen = new Map<string, string>();
  const issues: Issue[] = [];
  for (const it of items) {
    const key = `${it.lang}|${normalize(it.text)}`;
    const prev = seen.get(key);
    if (prev) issues.push({ id: it.id, field: 'text', message: `${prev} ile tekrar` });
    else seen.set(key, it.id);
  }
  return issues;
}
