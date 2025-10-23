import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Appearance, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getUserProfile, supabase } from '../services/supabase';


const SCOUTA = { grad: ['#7C5CFF', '#00E5FF', '#FF5CA8'], primary: '#7C5CFF' };
const lightColors = { background: '#F8F9FA', card: '#FFFFFF', text: '#2D3436', secondaryText: '#636E72', border: '#E0E0E0' };
const darkColors = { background: '#0F111A', card: '#1A1C28', text: '#FFFFFF', secondaryText: '#B2BEC3', border: '#2A2E3C' };
const useLocalTheme = () => {
  const isDark = Appearance.getColorScheme() === 'dark';
  const [dark, setDark] = useState(isDark);
  return {
    isDark: dark,
    colors: dark ? darkColors : lightColors,
    toggleTheme: () => setDark((p) => !p),
  };
};

const ProfileScreen: React.FC = () => {
  const { isDark, colors, toggleTheme } = useLocalTheme();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const p = await getUserProfile();
        setProfile(p);
      } catch (e) {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleThemeToggle = async () => {
    const next = !isDark;
    toggleTheme();
    try { await AsyncStorage.setItem('scouta_theme', next ? 'dark' : 'light'); } catch {}
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      if (Platform.OS === 'web') window.location.reload();
    } catch {}
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <ActivityIndicator size="large" color={SCOUTA.primary} />
      </SafeAreaView>
    );
  }

  const interestLabels: Record<string, string> = { social: 'Social Media', hobbies: 'Hobbies', business: 'Side Hustles', stocks: 'Stocks & Crypto' };
  const skillLabels: any = { beginner: 'Beginner', intermediate: 'Intermediate', expert: 'Expert' };
  const timeLabels: any = { casual: '1-5 hrs/week', serious: '5-15 hrs/week', fulltime: '15+ hrs/week' };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <LinearGradient colors={['#7C5CFF', '#00E5FF', '#FF5CA8'] as const} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.avatar}>
            <Text style={{ fontSize: 34 }}>🐶</Text>
          </LinearGradient>
          <Text style={{ color: colors.secondaryText }}>{profile?.email || 'Anonymous User'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#B2BEC3' }]}>Interests</Text>
          <View style={styles.tags}>
            {profile?.interests?.map((i: string) => (
              <View key={i} style={styles.tag}><Text style={styles.tagText}>{interestLabels[i] ?? i}</Text></View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#B2BEC3' }]}>Experience Level</Text>
          <Text style={[styles.value, { color: colors.text }]}>{skillLabels[profile?.skill_level]}</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#B2BEC3' }]}>Time Commitment</Text>
          <Text style={[styles.value, { color: colors.text }]}>{timeLabels[profile?.time_available]}</Text>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={[styles.item, { backgroundColor: colors.card }]} onPress={handleThemeToggle}>
            <Ionicons name={isDark ? 'sunny' : 'moon'} size={24} color={colors.text} />
            <Text style={[styles.itemText, { color: colors.text }]}>{isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</Text>
            <Ionicons name="chevron-forward" size={24} color="#B2BEC3" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.signOut} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Reset App</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  content: { padding: 24 },
  header: { alignItems: 'center', marginBottom: 28 },
  avatar: { width: 84, height: 84, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '800', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  tags: { flexDirection: 'row', flexWrap: 'wrap' },
  tag: { backgroundColor: SCOUTA.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, marginBottom: 8 },
  tagText: { color: '#FFF', fontWeight: '800' },
  value: { fontSize: 16, fontWeight: '700' },
  item: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 8 },
  itemText: { flex: 1, fontSize: 16, marginLeft: 12 },
  signOut: { backgroundColor: '#FF3B30', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  signOutText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
