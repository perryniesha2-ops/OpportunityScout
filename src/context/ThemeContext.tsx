// src/context/ThemeContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ColorSchemeName, useColorScheme } from 'react-native';

type Colors = {
  background: string;
  card: string;
  text: string;
  secondaryText: string;
  border: string;
  brandBg?: string;
};

const LIGHT: Colors = {
  background: '#eeeff1',       
  card: '#FFFFFF',
  text: '#2D3436',
  secondaryText: '#636E72',
  border: '#E0E0E0',
  brandBg: '#e5effb',
};

const DARK: Colors = {
  background: '#0F111A',
  card: '#1A1C28',
  text: '#FFFFFF',
  secondaryText: '#B2BEC3',
  border: '#2A2E3C',
};

type ThemeCtx = {
  isDark: boolean;
  colors: Colors;
  setScheme: (mode: 'light' | 'dark') => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeCtx | null>(null);

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  // device preference (iOS/Android/web)
  const deviceScheme: ColorSchemeName = useColorScheme();
  const [isDark, setIsDark] = useState(false);
  const [ready, setReady]   = useState(false);

  // boot once from storage or device
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('scouta_theme').catch(() => null);
      if (saved === 'dark') setIsDark(true);
      else if (saved === 'light') setIsDark(false);
      else setIsDark(deviceScheme === 'dark');
      setReady(true);
    })();
  }, [deviceScheme]);

  const setScheme = useCallback((mode: 'light' | 'dark') => {
    setIsDark(mode === 'dark');
    AsyncStorage.setItem('scouta_theme', mode).catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark(prev => {
      const next = !prev;
      AsyncStorage.setItem('scouta_theme', next ? 'dark' : 'light').catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo<ThemeCtx>(() => ({
    isDark,
    colors: isDark ? DARK : LIGHT,
    setScheme,
    toggleTheme,
  }), [isDark, setScheme, toggleTheme]);

  // Prevent children rendering until we know the initial scheme
  if (!ready) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Fallback that prevents a hard crash and helps diagnose tree placement
    console.warn('useTheme called outside <ThemeProvider>. Rendering with LIGHT fallback.');
    return {
      isDark: false,
      colors: LIGHT,
      setScheme: () => {},
      toggleTheme: () => {},
    } as ThemeCtx;
  }
  return ctx;
};
