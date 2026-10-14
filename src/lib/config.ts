/** Davet bağlantısı: açılış sayfası yayınlanınca (Faz 9) gerçek adresle değiştirilecek. */
export const INVITE_URL = 'https://sual-arena.netlify.app';
export const APP_SCHEME = 'sualarena';
export const MAX_ROOM_PLAYERS = 8;

/** Landing sayfası yayınlanınca (Faz 9) gerçek adreslerle değiştirilecek. */
export const PRIVACY_URL = 'https://sual-arena.netlify.app/privacy';
export const TERMS_URL = 'https://sual-arena.netlify.app/terms';
/**
 * Uzaktan soru/kart paketleri (statik, landing sitesiyle birlikte yayınlanır; `npm run content:publish`, bkz. docs/content-ops.md).
 * Boş bırakılırsa uzaktan güncelleme kapalıdır (yalnızca gömülü içerik). Alan adı kararından sonra gerçek adresle eşleştir.
 */
export const CONTENT_URL = 'https://sual-arena.netlify.app/content';
export const MANAGE_SUBSCRIPTIONS_URL = {
  ios: 'https://apps.apple.com/account/subscriptions',
  android: 'https://play.google.com/store/account/subscriptions',
} as const;
