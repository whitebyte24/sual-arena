import type { RefObject } from 'react';
import { Linking, Share, type View } from 'react-native';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';

/** Metni sistem paylaşım sayfasıyla gönderir (WhatsApp dahil). */
export function shareText(message: string): Promise<unknown> {
  return Share.share({ message }).catch(() => {});
}

/** Doğrudan WhatsApp; yüklü değilse sistem paylaşımına düşer. */
export async function shareWhatsapp(message: string): Promise<void> {
  const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
  try {
    if (await Linking.canOpenURL(url)) {
      await Linking.openURL(url);
      return;
    }
  } catch {
    // sistem paylaşımına düş
  }
  await shareText(message);
}

/** Görünümü PNG olarak paylaşır; yakalama/paylaşım mümkün değilse (ör. web) metne düşer. */
export async function shareView(ref: RefObject<View | null>, fallbackText: string, title: string): Promise<void> {
  try {
    const uri = await captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile' });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: title });
      return;
    }
  } catch {
    // metne düş
  }
  await shareText(fallbackText);
}
