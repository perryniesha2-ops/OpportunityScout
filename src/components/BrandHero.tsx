// src/components/BrandHero.tsx
import React from 'react';
import { Image, ImageSourcePropType, Text, View } from 'react-native';

type Props = {
  source: ImageSourcePropType;
  size?: number;
  title?: string;
  subtitle?: string;
  backgroundColor?: string; // optional, pass colors.background if you want
  textColor?: string;       // optional, pass colors.text if you want
};

export default function BrandHero({
  source,
  size = 220,
  title = '',
  subtitle = "",
  backgroundColor,
  textColor = '#111',
}: Props) {
  return (
    <View style={{ alignItems: 'center', gap: 1, backgroundColor }}>
      <Image
        source={source}
        resizeMode="contain"
        style={{ width: size, height: size }}
      />
      <Text style={{ fontSize: 28, fontWeight: '800', color: textColor }}>{title}</Text>
      <Text style={{ fontSize: 16, color: textColor, opacity: 0.7 }}>{subtitle}</Text>
    </View>
  );
}
