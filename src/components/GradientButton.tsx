// src/components/GradientButton.tsx
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { BRAND } from '../theme';

type Props = {
  children: React.ReactNode;
  onPress?: () => void | Promise<void>;
  disabled?: boolean;
  style?: ViewStyle;
  gradient?: [string, string];
  /** Show spinner instead of text */
  loading?: boolean;
};

export default function GradientButton({
  children,
  onPress,
  disabled,
  style,
  gradient = [BRAND.primary, BRAND.success],
  loading = false,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.pressable,
        style,
        (disabled || loading) && { opacity: 0.6 },
        pressed && { transform: [{ translateY: 1 }] },
      ]}
    >
      {/* outer glow */}
      <LinearGradient
        colors={[gradient[0], gradient[1]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.glow}
      />
      {/* main pill */}
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.pill}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          typeof children === 'string' ? (
            <Text style={styles.label}>{children}</Text>
          ) : (
            children
          )
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignSelf: 'stretch',
    borderRadius: 999,
  },
  glow: {
    position: 'absolute',
    top: 6, left: 0, right: 0, bottom: 0,
    borderRadius: 999,
    opacity: 0.35,
    filter: ('blur(18px)' as any), // web-only, harmless elsewhere
  },
  pill: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  label: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
