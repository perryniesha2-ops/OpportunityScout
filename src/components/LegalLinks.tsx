// src/components/LegalLinks.tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LEGAL } from '../constrants/legal';
import { useTheme } from '../theme';
import { openExternal } from '../utils/openExternal';

const LegalLinks: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const { colors } = useTheme();
  const style = styles(colors, compact);

  return (
    <View style={style.row}>
      <TouchableOpacity onPress={() => openExternal(LEGAL.PRIVACY_URL)}>
        <Text style={style.link}>Privacy</Text>
      </TouchableOpacity>
      <Text style={style.dot}>•</Text>
      <TouchableOpacity onPress={() => openExternal(LEGAL.TERMS_URL)}>
        <Text style={style.link}>Terms</Text>
      </TouchableOpacity>
      <Text style={style.dot}>•</Text>
      <TouchableOpacity onPress={() => openExternal(LEGAL.CONTACT_URL)}>
        <Text style={style.link}>Contact</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = (colors: any, compact?: boolean) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 10,
      marginTop: compact ? 8 : 16,
      marginBottom: compact ? 8 : 16,
      opacity: 0.9,
    },
    link: {
      color: colors.secondaryText,
      textDecorationLine: 'underline',
      fontSize: compact ? 12 : 13,
      fontWeight: '600',
    },
    dot: { color: colors.secondaryText, opacity: 0.7 },
  });

export default LegalLinks;
