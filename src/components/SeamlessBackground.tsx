// SeamlessBackground.tsx
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';

// Brand tones tuned to your logo
const COLORS = {
  baseStart: '#0B1120',  // deep navy
  baseEnd:   '#020617',  // almost black
  magenta:   '#A855F7',  // left glow
  cyan:      '#22D3EE',  // right glow
};

export default function SeamlessBackground() {
  return (
    <View style={StyleSheet.absoluteFill}>
      {/* 1) Base diagonal wash */}
      <LinearGradient
        colors={[COLORS.baseStart, COLORS.baseEnd]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* 2) Magenta halo (left) */}
      <LinearGradient
        colors={['rgba(168,85,247,0.35)', 'transparent']}
        start={{ x: 0.2, y: 0.25 }}
        end={{ x: 0.6, y: 0.6 }}
        style={[StyleSheet.absoluteFill, { opacity: 1 }]}
      />
      {/* 3) Cyan halo (right) */}
      <LinearGradient
        colors={['rgba(34,211,238,0.28)', 'transparent']}
        start={{ x: 0.85, y: 0.15 }}
        end={{ x: 0.4, y: 0.6 }}
        style={StyleSheet.absoluteFill}
      />
      {/* 4) Subtle vignette so the center pops */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.35)']}
        start={{ x: 0.5, y: 0.4 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
