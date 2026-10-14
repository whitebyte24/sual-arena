/**
 * Soru/kart toplama (build-content ve content-publish ortak). Kaynak: content/raw VE content/approved
 * (durum alanı belirler). Geçersiz öğe varsa HATA verip çıkar.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import type { Card, Question } from '../../src/content/schema';
import { validateCard, validateQuestion } from '../../src/content/validate';

export const ROOT = join(__dirname, '..', '..');

function files(dir: string, prefix: string): string[] {
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) return [];
  return readdirSync(abs, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.json') && e.name.startsWith(prefix))
    .map((e) => join(e.parentPath, e.name));
}

function collect<T extends { id: string; review_status: string }>(
  prefix: string,
  validate: (x: unknown) => { id: string; field: string; message: string }[],
  dev: boolean,
): T[] {
  const byId = new Map<string, T>();
  const errors: string[] = [];
  // raw önce, approved klasörü sonra: aynı id'de sonraki kazanır. Üretimde durum süzgeci zaten yalnızca approved alır.
  const sources = [...files('content/raw', prefix), ...files('content/approved', prefix)];
  for (const file of sources) {
    const data = JSON.parse(readFileSync(file, 'utf8')) as T[];
    for (const item of data) {
      if (item.review_status === 'rejected') continue;
      if (!dev && item.review_status !== 'approved') continue;
      const issues = validate(item);
      if (issues.length) errors.push(`${basename(file)} ${issues[0].id}: ${issues[0].field} – ${issues[0].message}`);
      byId.set(item.id, item);
    }
  }
  if (errors.length) {
    console.error(`İçerik hatası (${errors.length}):\n  ${errors.slice(0, 10).join('\n  ')}`);
    process.exit(1);
  }
  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
}

export function collectContent(dev: boolean): { cards: (Card & { review_status: string })[]; questions: (Question & { review_status: string })[] } {
  return {
    cards: collect<Card & { review_status: string }>('cards', validateCard, dev),
    questions: collect<Question & { review_status: string }>('questions', validateQuestion, dev),
  };
}

/** content/version.json: son YAYINLANAN içerik sürümü (`content:publish` artırır). */
export function readContentVersion(): number {
  const f = join(ROOT, 'content', 'version.json');
  if (!existsSync(f)) return 0;
  return Number((JSON.parse(readFileSync(f, 'utf8')) as { version?: number }).version ?? 0);
}
