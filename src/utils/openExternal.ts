// src/utils/openExternal.ts
import { Linking, Platform } from 'react-native';

export async function openExternal(url: string) {
  try {
    if (Platform.OS === 'web') {
      // open in new tab on web
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
    else console.warn('Cannot open URL:', url);
  } catch (e) {
    console.warn('openExternal error:', e);
  }
}
