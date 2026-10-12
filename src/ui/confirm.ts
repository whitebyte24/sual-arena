import { Alert, Platform } from 'react-native';

/** Onay penceresi. Native: Alert; web: window.confirm (react-native-web'de Alert yoktur). */
export function confirm(title: string, message: string, confirmLabel: string, cancelLabel: string, destructive = true): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`));
  return new Promise((resolve) =>
    Alert.alert(
      title,
      message,
      [
        { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
        { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    ),
  );
}
