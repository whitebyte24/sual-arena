export type ContentLang = 'tr' | 'ar' | 'en';
export type ReviewStatus = 'draft' | 'reviewed' | 'approved' | 'rejected';
export type Category = 'quran' | 'siyer' | 'kissalar' | 'tarih' | 'ilmihal' | 'arapca';
export type CardLevel = 'child' | 'teen' | 'adult';

export const LANGS: ContentLang[] = ['tr', 'ar', 'en'];
export const CATEGORIES: Category[] = ['quran', 'siyer', 'kissalar', 'tarih', 'ilmihal', 'arapca'];
export const LEVELS: CardLevel[] = ['child', 'teen', 'adult'];
export const REVIEW_STATUSES: ReviewStatus[] = ['draft', 'reviewed', 'approved', 'rejected'];

export interface Question {
  id: string; // q-<lang>-<category>-<6 hane>
  lang: ContentLang;
  category: Category;
  difficulty: 1 | 2 | 3;
  question: string;
  options: [string, string, string, string];
  answer_index: 0 | 1 | 2 | 3;
  source: string;
  explanation: string;
  review_status: ReviewStatus;
}

export interface Card {
  id: string; // c-<lang>-<6 hane>
  lang: ContentLang;
  level: CardLevel;
  target: string;
  forbidden: [string, string, string, string];
  review_status: ReviewStatus;
}

export const LIMITS = {
  question: 160,
  option: 60,
  explanation: 300,
  source: 120,
  target: 30,
  forbidden: 30,
} as const;

export const QUESTION_ID_RE = /^q-(tr|ar|en)-(quran|siyer|kissalar|tarih|ilmihal|arapca)-\d{6}$/;
export const CARD_ID_RE = /^c-(tr|ar|en)-\d{6}$/;
