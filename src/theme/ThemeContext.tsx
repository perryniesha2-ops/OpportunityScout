// src/theme/ThemeContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, Theme as NavTheme } from '@react-navigation/native';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

type NavThemeWithFonts = NavTheme & { fonts: typeof BASE_FONTS };


const BASE_FONTS = {
  regular: { fontFamily: 'System', fontWeight: '400' as const },
  medium:  { fontFamily: 'System', fontWeight: '500' as const },
  bold:    { fontFamily: 'System', fontWeight: '700' as const },
};

const SCOUTA = {
  grad: ['#7C5CFF', '#00E5FF', '#FF5CA8'],
  primary: '#7C5CFF',
  success: '#00D084',
  success2: '#4ECDC4',
  warn: '#FFA726',
};

type Colors = {
  background: string;
  card: string;
  text: string;
  secondaryText: string;
  border: string;
  brandBg: string;
};

const light: Colors = {
  background: '#e5effb', // blends with your logo bg
  brandBg:    '#e5effb',
  card: '#FFFFFF',
  text: '#2D3436',
  secondaryText: '#636E72',
  border: '#E0E0E0',
};

const dark: Colors = {
  background: '#0F111A',
  brandBg:    '#0F111A',
  card: '#1A1C28',
  text: '#FFFFFF',
  secondaryText: '#B2BEC3',
  border: '#2A2E3C',
};

type Ctx = {
  isDark: boolean;
  colors: Colors;
  toggleTheme: () => void;
  navTheme: NavTheme;
  fonts: typeof BASE_FONTS;
  tokens: typeof SCOUTA;
};

const ThemeContext = createContext<Ctx | null>(null);

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>');
  return ctx;
};

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const system = useColorScheme();
  const [mode, setMode] = useState<'light' | 'dark'>(() => (system === 'dark' ? 'dark' : 'light'));

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('scouta_theme').catch(() => null);
      if (saved === 'dark' || saved === 'light') setMode(saved);
    })();
  }, []);

  const isDark = mode === 'dark';
  const colors = isDark ? dark : light;

  const toggleTheme = async () => {
    const next = isDark ? 'light' : 'dark';
    setMode(next);
    await AsyncStorage.setItem('scouta_theme', next);
  };

 const navTheme = useMemo<NavTheme>(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      dark: isDark,
      colors: {
        ...base.colors,
        primary: SCOUTA.primary,
        background: colors.background,
        card: colors.card,
        text: colors.text,
        border: colors.border,
        notification: '#FF5CA8',
      },
    };
  }, [isDark, colors]);

  const value: Ctx = {
    isDark,
    colors,
    toggleTheme,
    navTheme,
    fonts: BASE_FONTS,     // use via useTheme().fonts in your UI
    tokens: SCOUTA,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};