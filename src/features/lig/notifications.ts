/**
 * İftar sonrası hatırlatma: yerel (çevrimdışı) bildirimler. Konum/ sunucu gerekmez.
 * Bildirime dokunmak Lig ekranını `from=iftar` ile açar: o ekranlarda reklam YOK (spec §7.1).
 * Web'de desteklenmez (no-op).
 */
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const CHANNEL = 'iftar';
const supported = Platform.OS !== 'web';

let handlerSet = false;
function ensureHandler() {
  if (handlerSet || !supported) return;
  handlerSet = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
  });
}

export async function ensureReminderPermission(): Promise<boolean> {
  if (!supported) return false;
  try {
    ensureHandler();
    let s = await Notifications.getPermissionsAsync();
    const ok = (x: typeof s) =>
      x.ios ? x.ios.status === Notifications.IosAuthorizationStatus.AUTHORIZED || x.ios.status === Notifications.IosAuthorizationStatus.PROVISIONAL : x.granted;
    if (!ok(s)) s = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowBadge: false, allowSound: true } });
    return ok(s);
  } catch {
    return false;
  }
}

/** Önceki lig bildirimlerini silip verilen anlar için yenilerini kurar. */
export async function scheduleReminders(plan: { dayNo: number; at: number }[], text: { title: string; body: (dayNo: number) => string; channelName: string }): Promise<void> {
  if (!supported) return;
  try {
    ensureHandler();
    await cancelReminders();
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL, { name: text.channelName, importance: Notifications.AndroidImportance.HIGH });
    }
    for (const p of plan) {
      await Notifications.scheduleNotificationAsync({
        identifier: `lig-${p.dayNo}`,
        content: { title: text.title, body: text.body(p.dayNo), data: { url: '/lig?from=iftar' } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(p.at), channelId: CHANNEL },
      });
    }
  } catch {
    // bildirim kurulamazsa oyun etkilenmez
  }
}

export async function cancelReminders(): Promise<void> {
  if (!supported) return;
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(all.filter((n) => n.identifier.startsWith('lig-')).map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
  } catch {
    // yoksay
  }
}

/** Dokunulan bildirim bir rota taşıyorsa çağır. Aboneliği döndürür. */
export function onNotificationTap(go: (url: string) => void): () => void {
  if (!supported) return () => {};
  const sub = Notifications.addNotificationResponseReceivedListener((r) => {
    const url = r.notification.request.content.data?.url;
    if (typeof url === 'string' && url.startsWith('/')) go(url);
  });
  return () => sub.remove();
}
