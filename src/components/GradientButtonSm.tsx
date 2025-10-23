import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Text, TouchableOpacity, ViewStyle } from 'react-native';

export default function GradientButtonsm({
  children,
  style,
  disabled,
  ...props
}: React.PropsWithChildren<{ style?: ViewStyle; disabled?: boolean; onPress?: () => void }>) {
  return (
    <TouchableOpacity activeOpacity={0.9} disabled={disabled} {...props}>
 <LinearGradient
  colors={['#7C5CFF', '#00E5FF', '#FF5CA8'] as const}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 0 }}style={[{ paddingVertical: 16, borderRadius: 12, alignItems: 'center', paddingHorizontal: 18 }, disabled && { opacity: 0.6 }, style]}>
        {typeof children === 'string' ? <Text style={{ color:'#FFF', fontWeight:'800' }}>{children}</Text> : children}
      </LinearGradient>
    </TouchableOpacity>
  );
}
