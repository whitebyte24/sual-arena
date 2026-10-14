/**
 * Uygulamaya girecek içeriği src/content/generated/ altına yazar.
 *   npm run content:build        → yalnızca review_status = approved  (üretim, EAS)
 *   npm run content:build:dev    → rejected hariç hepsi (yerel geliştirme; "_" ile başlayan örnekler hariç)
 * Kaynak: content/raw VE content/approved (ikisinde de durum alanı belirler; onay = review_status değişikliği, bkz. content:sheet/content:apply).
 * Geçersiz öğe varsa HATA verir ve hiçbir şey yazmaz. meta.version = content/version.json (uzaktan paketlerle karşılaştırılır).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { collectContent, readContentVersion, ROOT } from './lib/collect';

const OUT = join(ROOT, 'src/content/generated');
const dev = process.argv.includes('--dev');

const { cards, questions } = collectContent(dev);

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'cards.json'), JSON.stringify(cards));
writeFileSync(join(OUT, 'questions.json'), JSON.stringify(questions));
writeFileSync(
  join(OUT, 'meta.json'),
  JSON.stringify({ mode: dev ? 'dev' : 'prod', cards: cards.length, questions: questions.length, version: readContentVersion() }),
);
console.log(`content:build (${dev ? 'dev' : 'prod'}) → kart ${cards.length}, soru ${questions.length}`);
