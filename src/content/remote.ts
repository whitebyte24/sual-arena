/**
 * Uzaktan içerik paketlerinin indirilmesi/önbelleği (RN). Mantık `packs.ts` içinde (saf, testli).
 *  • Açılışta `loadCachedContent()` önbellekteki geçerli paketleri uygular (ilk çizimden önce; zaman aşımı kısa).
 *  • Sonra `refreshContent(lang)` arka planda manifest'i kontrol eder ve yeni paketi indirip önbelleğe yazar → SONRAKİ açılışta kullanılır
 *    (oyun ortasında içerik değişmez). Ağ yoksa/hata varsa sessizce gömülü içerikle devam edilir.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { CONTENT_URL } from '@/lib/config';
import { applyCardPack, bundledCardCount } from './cards';
import { acceptCards, acceptQuestions, parseManifest, type PackEntry } from './packs';
import { applyQuestionPack, BUNDLED_CONTENT_VERSION, bundledQuestionCount } from './questions';
import { LANGS, type Card, type ContentLang, type Question } from './schema';

interface Cached<T> {
  version: number;
  sha256: string;
  items: T[];
}
const keyQ = (l: ContentLang) => `content.q.${l}.v1`;
const keyC = (l: ContentLang) => `content.c.${l}.v1`;
const KEY_CHECKED = 'content.checked.v1';
const CHECK_EVERY_MS = 6 * 3600_000;

const withTimeout = <T>(p: Promise<T>, ms: number, fallback: T): Promise<T> =>
  Promise.race([p, new Promise<T>((r) => setTimeout(() => r(fallback), ms))]);

async function readCached<T>(key: string): Promise<Cached<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Cached<T>) : null;
  } catch {
    return null;
  }
}

/** Açılışta: önbellekteki (gömülüden yeni ve geçerli) paketleri uygula. Asla hata fırlatmaz. */
export async function loadCachedContent(timeoutMs = 1500): Promise<void> {
  await withTimeout(
    (async () => {
      for (const lang of LANGS) {
        const q = await readCached<Question>(keyQ(lang));
        if (q && q.version > BUNDLED_CONTENT_VERSION) {
          const ok = acceptQuestions(lang, q.items, bundledQuestionCount(lang));
          if (ok) applyQuestionPack(lang, ok);
        }
        const c = await readCached<Card>(keyC(lang));
        if (c && c.version > BUNDLED_CONTENT_VERSION) {
          const ok = acceptCards(lang, c.items, bundledCardCount(lang));
          if (ok) applyCardPack(lang, ok);
        }
      }
    })().catch(() => {}),
    timeoutMs,
    undefined,
  );
}

async function fetchText(url: string, ms: number): Promise<string | null> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try {
    const res = await fetch(url, { signal: ac.signal });
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function sha256(text: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, text);
}

async function downloadPack<T>(entry: PackEntry): Promise<T[] | null> {
  const text = await fetchText(`${CONTENT_URL}/${entry.file}`, 20_000);
  if (!text || (await sha256(text)) !== entry.sha256) return null;
  try {
    const data = JSON.parse(text) as unknown;
    return Array.isArray(data) ? (data as T[]) : null;
  } catch {
    return null;
  }
}

/**
 * Manifest'i kontrol eder (6 saatte bir; `force` ile hemen); gerekiyorsa `lang` için yeni paketleri indirip önbelleğe yazar.
 * Dönüş: yeni paket indirildi mi (uygulama bir SONRAKİ açılışta kullanır).
 */
export async function refreshContent(lang: ContentLang, force = false): Promise<boolean> {
  if (!CONTENT_URL) return false;
  try {
    const last = Number((await AsyncStorage.getItem(KEY_CHECKED)) ?? 0);
    if (!force && Date.now() - last < CHECK_EVERY_MS) return false;

    const text = await fetchText(`${CONTENT_URL}/manifest.json?t=${Math.floor(Date.now() / 600_000)}`, 6000);
    const manifest = text ? parseManifest(JSON.parse(text)) : null;
    if (!manifest) return false;
    AsyncStorage.setItem(KEY_CHECKED, String(Date.now())).catch(() => {});
    if (manifest.version <= BUNDLED_CONTENT_VERSION) return false;

    const entry = manifest.packs[lang];
    let stored = false;
    if (entry?.questions) {
      const cached = await readCached<Question>(keyQ(lang));
      if (cached?.sha256 !== entry.questions.sha256) {
        const items = await downloadPack<Question>(entry.questions);
        if (items && acceptQuestions(lang, items, bundledQuestionCount(lang))) {
          await AsyncStorage.setItem(keyQ(lang), JSON.stringify({ version: manifest.version, sha256: entry.questions.sha256, items }));
          stored = true;
        }
      }
    }
    if (entry?.cards) {
      const cached = await readCached<Card>(keyC(lang));
      if (cached?.sha256 !== entry.cards.sha256) {
        const items = await downloadPack<Card>(entry.cards);
        if (items && acceptCards(lang, items, bundledCardCount(lang))) {
          await AsyncStorage.setItem(keyC(lang), JSON.stringify({ version: manifest.version, sha256: entry.cards.sha256, items }));
          stored = true;
        }
      }
    }
    return stored;
  } catch {
    return false;
  }
}
