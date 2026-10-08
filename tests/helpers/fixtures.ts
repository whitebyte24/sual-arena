import type { Question } from '../../src/content/schema';

export const mkQ = (n: number, answer = 1): Question => ({
  id: `q-tr-quran-${String(n).padStart(6, '0')}`,
  lang: 'tr',
  category: 'quran',
  difficulty: 1,
  question: `Soru ${n}?`,
  options: ['A' + n, 'B' + n, 'C' + n, 'D' + n],
  answer_index: answer as 0 | 1 | 2 | 3,
  source: 's',
  explanation: 'e',
  review_status: 'approved',
});
