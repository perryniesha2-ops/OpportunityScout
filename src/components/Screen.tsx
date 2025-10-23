import React from 'react';
import { ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';

export default function Screen({
  children,
  style,
}: React.PropsWithChildren<{ style?: ViewStyle }>) {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Optional inner container for padding */}
      <SafeAreaView style={[{ flex: 1, backgroundColor: colors.background }, style]}>
        {children}
      </SafeAreaView>
    </SafeAreaView>
  );
}
