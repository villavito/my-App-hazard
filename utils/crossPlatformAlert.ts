import { Alert, Platform } from 'react-native';

type AlertButton = {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

// react-native-web's Alert.alert is a total no-op (no popup, no onPress ever
// fires), so route through window.alert/confirm on web instead.
export function showAlert(title: string, message?: string, buttons?: AlertButton[]) {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }

  const text = [title, message].filter(Boolean).join('\n\n');

  if (!buttons || buttons.length === 0) {
    window.alert(text);
    return;
  }

  if (buttons.length === 1) {
    window.alert(text);
    buttons[0].onPress?.();
    return;
  }

  const confirmed = window.confirm(text);
  const target = confirmed
    ? buttons.find((b) => b.style !== 'cancel')
    : buttons.find((b) => b.style === 'cancel');
  target?.onPress?.();
}
