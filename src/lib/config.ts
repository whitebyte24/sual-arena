/** Davet bağlantısı: açılış sayfası yayınlanınca (Faz 9) gerçek adresle değiştirilecek. */
export const INVITE_URL = 'https://sualarena.app';
export const APP_SCHEME = 'sualarena';
export const MAX_ROOM_PLAYERS = 8;

/** Landing sayfası yayınlanınca (Faz 9) gerçek adreslerle değiştirilecek. */
export const PRIVACY_URL = 'https://sualarena.app/privacy';
export const TERMS_URL = 'https://sualarena.app/terms';
export const MANAGE_SUBSCRIPTIONS_URL = {
  ios: 'https://apps.apple.com/account/subscriptions',
  android: 'https://play.google.com/store/account/subscriptions',
} as const;
