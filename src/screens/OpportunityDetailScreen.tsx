import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
// wherever used
import { generateActionPlan } from '../services/aiService';
import { useTheme } from '../theme';
import { SCOUTA } from '../theme/tokens';

type Props = { route: any; navigation: any };

export default function OpportunityDetailScreen({ route, navigation }: Props) {
  const { colors, isDark } = useTheme();
  const { opportunity, userProfile } = route.params;
  const [actionPlan, setActionPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const plan = await generateActionPlan(opportunity, userProfile);
        setActionPlan(plan);
      } catch {
        setActionPlan({
          whyMatch:
            "This opportunity aligns with your interests and time commitment, making it a strong match.",
          actionSteps: [
            'Research the space and define a niche',
            'Draft a 2-week content/launch plan',
            'Set up tools & accounts',
            'Ship MVP / first deliverable',
            'Collect feedback and iterate',
          ],
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [opportunity, userProfile]);

  const getScoreColor = (s: number) => (s >= 90 ? SCOUTA.success : s >= 75 ? SCOUTA.success2 : SCOUTA.warn);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <ActivityIndicator size="large" color={SCOUTA.primary} />
        <Text style={{ marginTop: 12, color: colors.secondaryText }}>Generating action plan…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(opportunity.score) }]}>
          <Text style={styles.scoreBadgeText}>{opportunity.score}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.body}>
          <Text style={[styles.title, { color: colors.text }]}>{opportunity.title}</Text>

          <View style={styles.row}>
            <View style={styles.trendBadge}>
              <Ionicons name="trending-up" size={16} color={SCOUTA.primary} />
              <Text style={[styles.trendText, { color: SCOUTA.primary }]}>{opportunity.trend}</Text>
            </View>
            <View style={[styles.catPill, { backgroundColor: isDark ? 'rgba(124,92,255,0.18)' : '#E8E4FF' }]}>
              <Text style={[styles.catPillText, { color: SCOUTA.primary }]}>{opportunity.category}</Text>
            </View>
          </View>

          <Text style={[styles.desc, { color: colors.secondaryText }]}>{opportunity.description}</Text>

          <View style={[styles.metrics, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            {[
              ['Competition', opportunity.competition],
              ['Potential', opportunity.potential],
              ['Timeframe', opportunity.timeframe],
            ].map(([label, value]) => (
              <View key={label} style={styles.metric}>
                <Text style={[styles.metricLabel, { color: colors.secondaryText }]}>{label}</Text>
                <Text style={[styles.metricValue, { color: colors.text }]}>{value}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="checkmark-circle" size={22} color={SCOUTA.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Why This Matches You</Text>
            </View>
            <Text style={{ color: colors.secondaryText, lineHeight: 22 }}>{actionPlan?.whyMatch}</Text>
          </View>

          {!!actionPlan?.actionSteps?.length && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="list" size={22} color={SCOUTA.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Action Steps</Text>
              </View>
              {actionPlan.actionSteps.map((step: string, i: number) => (
                <View key={i} style={styles.step}>
                  <View style={[styles.stepNum, { backgroundColor: SCOUTA.primary }]}>
                    <Text style={styles.stepNumText}>{i + 1}</Text>
                  </View>
                  <Text style={[styles.stepText, { color: colors.text }]}>{step}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  backButton: { padding: 8 },
  body: { padding: 20 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, columnGap: 12 },
  trendBadge: { flexDirection: 'row', alignItems: 'center' },
  trendText: { fontSize: 14, fontWeight: '800', marginLeft: 4 },
  catPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  catPillText: { fontSize: 12, fontWeight: '800', textTransform: 'capitalize' },
  desc: { fontSize: 16, lineHeight: 24, marginBottom: 24 },

  metrics: { flexDirection: 'row', justifyContent: 'space-around', borderRadius: 12, padding: 16, marginBottom: 24 },
  metric: { alignItems: 'center' },
  metricLabel: { fontSize: 12, marginBottom: 4 },
  metricValue: { fontSize: 16, fontWeight: '800' },

  section: { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, columnGap: 10 },
  sectionTitle: { fontSize: 20, fontWeight: '800' },

  step: { flexDirection: 'row', marginBottom: 14, alignItems: 'flex-start' },
  stepNum: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  stepNumText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  stepText: { flex: 1, fontSize: 16, lineHeight: 24 },

  scoreBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  scoreBadgeText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
});
