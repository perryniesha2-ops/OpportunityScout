import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TopSafeGradient() {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient colors={['#7C5CFF', '#00E5FF', '#FF5CA8'] as const} start={{ x:0,y:0 }} end={{ x:1,y:0 }} style={{ height: insets.top, width: '100%' }} />
  );
}
