import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Appearance, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View
} from 'react-native';
import { deleteSavedOpportunity, getSavedOpportunities } from '../services/supabase';

import { useTheme } from '../theme';

const SCOUTA = {
  grad: ['#7C5CFF', '#00E5FF', '#FF5CA8'],
  primary: '#7C5CFF',
  success: '#00D084',
  success2: '#4ECDC4',
  warn: '#FFA726',
};

const lightColors = { background: '#F8F9FA', card: '#FFFFFF', text: '#2D3436', secondaryText: '#636E72', border: '#E0E0E0' };
const darkColors = { background: '#0F111A', card: '#1A1C28', text: '#FFFFFF', secondaryText: '#B2BEC3', border: '#2A2E3C' };
const useLocalTheme = () => {
  const isDark = Appearance.getColorScheme() === 'dark';
  return { isDark, colors: isDark ? darkColors : lightColors };
};

const GradientButtonSm: React.FC<React.ComponentProps<typeof TouchableOpacity>> = ({ children, style, ...props }) => (
  <TouchableOpacity activeOpacity={0.9} {...props}>
    <LinearGradient colors={['#7C5CFF', '#00E5FF', '#FF5CA8'] as const} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.gButtonSm, style]}>
      <Text style={styles.gButtonTextSm}>{children}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

type Props = { navigation: any };
type SavedRow = {
  id: string;
  user_id: string;
  opportunity_id: string;
  category: string;
  title: string;
  score: number;
  saved_at: string;
};

const SavedScreen: React.FC<Props> = ({ navigation }) => {
const { colors, isDark } = useTheme();  
const [rows, setRows] = useState<SavedRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const saved = await getSavedOpportunities();
        setRows(saved);
      } catch (e) {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getScoreColor = (score: number) => (score >= 90 ? SCOUTA.success : score >= 75 ? SCOUTA.success2 : SCOUTA.warn);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <ActivityIndicator size="large" color={SCOUTA.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>Saved</Text>
        <Text style={{ color: colors.secondaryText }}>{rows.length} saved</Text>
      </View>

      {rows.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="bookmark-outline" size={80} color="#B2BEC3" />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No saved opportunities</Text>
          <Text style={{ color: colors.secondaryText, textAlign: 'center', marginTop: 8 }}>Save opportunities from the feed to see them here.</Text>
        </View>
      ) : (
        <ScrollView>
          {rows.map((item) => (
            <View key={item.id} style={[styles.card, { backgroundColor: colors.card }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
                <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(item.score) }]}>
                  <Text style={styles.scoreText}>{item.score}</Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryText}>{item.category}</Text>
                </View>
                <Text style={{ color: colors.secondaryText }}>Saved {new Date(item.saved_at).toLocaleDateString()}</Text>
              </View>

              <View style={styles.rowActions}>
                <GradientButtonSm
  onPress={() => {
    const opportunity = {
      id: item.opportunity_id,
      title: item.title,
      category: item.category,
      score: item.score,
      description: 'View full details to see description',
      trend: 'Saved',
      competition: 'N/A',
      potential: 'N/A',
      timeframe: 'N/A',
      tags: [],
    };
    navigation.navigate('OpportunityDetail', { opportunity, userProfile: {} });
  }}
>
  <Text>View Details</Text>
</GradientButtonSm>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={async () => {
                    try {
                      await deleteSavedOpportunity(item.id);
                      setRows((p) => p.filter((r) => r.id !== item.id));
                    } catch {}
                  }}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default SavedScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18 },
  title: { fontSize: 26, fontWeight: '800' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginTop: 24 },
  card: { margin: 16, padding: 20, borderRadius: 16, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: '800', flex: 1, marginRight: 12 },
  scoreBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  scoreText: { color: '#FFF', fontWeight: '800' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  categoryPill: { backgroundColor: '#E8E4FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  categoryText: { fontSize: 12, color: SCOUTA.primary, fontWeight: '800', textTransform: 'capitalize' },
  rowActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gButtonSm: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, flexDirection: 'row', alignItems: 'center' },
  gButtonTextSm: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  deleteBtn: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#FF3B30' }, gChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
 
});
