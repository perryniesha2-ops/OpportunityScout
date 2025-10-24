// src/screens/ProfileScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { LOGO_DARK, LOGO_LIGHT } from '../branding';
import LegalLinks from '../components/LegalLinks';
import SignOutButton from '../components/SignOutButton';
import { getUserProfile } from '../services/supabase';
import { useTheme } from '../theme';
import { SCOUTA } from '../theme/tokens';


const ProfileScreen: React.FC = () => {
  const { isDark, colors, toggleTheme } = useTheme();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const p = await getUserProfile();
        setProfile(p);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <ActivityIndicator size="large" color={SCOUTA.primary} />
      </SafeAreaView>
    );
  }

  const interestLabels: Record<string, string> = {
    social: 'Social Media',
    hobbies: 'Hobbies',
    business: 'Side Hustles',
    stocks: 'Stocks & Crypto',
  };
  const skillLabels: any = { beginner: 'Beginner', intermediate: 'Intermediate', expert: 'Expert' };
  const timeLabels: any = { casual: '1–5 hrs/week', serious: '5–15 hrs/week', fulltime: '15+ hrs/week' };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 32 }]}>
        {/* Header with brand logo (dark variant requested) */}
        <View style={styles.header}>
          <View style={[styles.logoWrap, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Image source={isDark ? LOGO_DARK : LOGO_LIGHT} resizeMode="contain" style={{ width: 72, height: 72 }} />
          </View>
          <Text style={{ color: colors.secondaryText, marginTop: 8 }}>
            {profile?.email || 'Anonymous User'}
          </Text>
        </View>

        {/* Interests */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>Interests</Text>
          <View style={styles.tags}>
            {(profile?.interests || []).map((i: string) => (
              <View
                key={i}
                style={[
                  styles.tag,
                  { backgroundColor: isDark ? 'rgba(124,92,255,0.18)' : '#E8E4FF', borderColor: colors.border },
                ]}
              >
                <Text style={[styles.tagText, { color: SCOUTA.primary }]}>
                  {interestLabels[i] ?? i}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Skill */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>Experience Level</Text>
          <View style={[styles.valueCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.value, { color: colors.text }]}>{skillLabels[profile?.skill_level] || '—'}</Text>
          </View>
        </View>

        {/* Time */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>Time Commitment</Text>
          <View style={[styles.valueCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.value, { color: colors.text }]}>{timeLabels[profile?.time_available] || '—'}</Text>
          </View>
        </View>

        {/* Theme toggle */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={toggleTheme}
            activeOpacity={0.9}
          >
            <Ionicons name={isDark ? 'sunny' : 'moon'} size={22} color={colors.text} />
            <Text style={[styles.itemText, { color: colors.text }]}>
              {isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.secondaryText} />
          </TouchableOpacity>
        </View>

        {/* Global sign out */}
        <SignOutButton title="Sign Out" />
      </ScrollView>
       <LegalLinks />
    </SafeAreaView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  content: { padding: 24 },

  header: { alignItems: 'center', marginBottom: 28 },
  logoWrap: {
    width: 92,
    height: 92,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },

  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  tags: { flexDirection: 'row', flexWrap: 'wrap' },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tagText: { fontSize: 12, fontWeight: '800' },

  valueCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  value: { fontSize: 16, fontWeight: '700' },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  itemText: { flex: 1, fontSize: 16, marginLeft: 12 },
});
