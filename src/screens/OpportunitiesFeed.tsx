// src/screens/OpportunitiesFeed.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import type { Category, Opportunity } from '../services/aiService';
import { generateOpportunities } from '../services/aiService';
import { getSavedOpportunities, saveOpportunity } from '../services/supabase';
import { useTheme } from '../theme';
import { SCOUTA } from '../theme/tokens';

const { width } = Dimensions.get('window');

// ---------- helpers ----------
const normalizeChildren = (children: React.ReactNode, textStyle: any) =>
  React.Children.map(children, (child) =>
    typeof child === 'string' ? <Text style={textStyle}>{child}</Text> : child
  );

const GradientButtonSm: React.FC<React.ComponentProps<typeof TouchableOpacity>> = ({
  children,
  style,
  ...props
}) => (
  <TouchableOpacity activeOpacity={0.9} {...props}>
    <LinearGradient
      colors={SCOUTA.grad as any}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.gButtonSm, style]}
    >
      {normalizeChildren(children, styles.gButtonTextSm)}
    </LinearGradient>
  </TouchableOpacity>
);

const GradientChip: React.FC<{ children: React.ReactNode; style?: any }> = ({
  children,
  style,
}) => (
  <LinearGradient
    colors={SCOUTA.grad as any}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={[styles.gChip, style]}
  >
    {normalizeChildren(children, styles.categoryChipTextActive)}
  </LinearGradient>
);

// ---------- category guards ----------
const SYNONYMS: Record<string, Category> = {
  'social media': 'social',
  'side hustles': 'business',
  'stocks & crypto': 'stocks',
};
function isCategory(x: unknown): x is Category {
  return x === 'social' || x === 'hobbies' || x === 'business' || x === 'stocks';
}
function normalizeCategory(input?: string | null): Category {
  if (!input) return 'social';
  const key = input.toLowerCase().trim();
  if (isCategory(key)) return key;
  if (SYNONYMS[key]) return SYNONYMS[key];
  return 'social';
}

// ---------- props ----------
type UserProfile = {
  interests?: string[];
  skill_level?: 'beginner' | 'intermediate' | 'expert';
  time_available?: 'casual' | 'serious' | 'fulltime';
};
type Props = { navigation: any; userProfile: UserProfile };

// ---------- component ----------
const OpportunitiesFeed: React.FC<Props> = ({ navigation, userProfile }) => {
  const { isDark, colors } = useTheme();
  const [activeCategory, setActiveCategory] = useState<'all' | Category>('all');
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingCategory, setGeneratingCategory] = useState<Category | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const saved = await getSavedOpportunities();
        setSavedIds(saved.map((s: any) => String(s.opportunity_id)));
      } catch {
        // non-blocking
      }
    })();
  }, []);

  useEffect(() => {
    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadInitial = async () => {
    setLoading(true);
    try {
      const firstInterest = normalizeCategory(userProfile?.interests?.[0]);
      const ai = await generateOpportunities(firstInterest, userProfile);
      setOpportunities(ai);
    } catch {
      setOpportunities(getMock());
    } finally {
      setLoading(false);
    }
  };

  const loadForCategory = async (category: Category) => {
    setGeneratingCategory(category);
    try {
      const ai = await generateOpportunities(category, userProfile);
      setOpportunities((prev) => [
        ...prev.filter((o) => o.category !== category),
        ...ai,
      ]);
    } catch {
      Alert.alert('Error', 'Failed to generate opportunities. Please try again.');
    } finally {
      setGeneratingCategory(null);
    }
  };

  const handleCategoryChange = (id: 'all' | Category) => {
    setActiveCategory(id);
    if (id !== 'all' && !opportunities.some((o) => o.category === id)) {
      loadForCategory(id);
    }
  };

  const handleSave = async (opp: Opportunity) => {
    try {
      await saveOpportunity(opp as any);
      setSavedIds((p) => [...p, String(opp.id)]);
    } catch {
      // optional toast
    }
  };

  const filtered = useMemo(
    () =>
      activeCategory === 'all'
        ? opportunities
        : opportunities.filter((o) => o.category === activeCategory),
    [opportunities, activeCategory]
  );

  const getScoreColor = (score: number) =>
    score >= 90 ? SCOUTA.success : score >= 75 ? SCOUTA.success2 : SCOUTA.warn;

  const categories: {
    id: 'all' | Category;
    name: string;
    icon: keyof typeof Ionicons.glyphMap;
  }[] = [
    { id: 'all', name: 'All', icon: 'apps' },
    { id: 'social', name: 'Social', icon: 'logo-instagram' },
    { id: 'hobbies', name: 'Hobbies', icon: 'fitness' },
    { id: 'business', name: 'Business', icon: 'briefcase' },
    { id: 'stocks', name: 'Stocks', icon: 'trending-up' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* header */}
      <View
        style={[
          styles.feedHeader,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <LinearGradient
            colors={SCOUTA.grad as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.miniBadge}
          >
            <Text style={{ fontSize: 14 }}>🐶</Text>
          </LinearGradient>
          <Text style={[styles.feedTitle, { color: colors.text, marginLeft: 8 }]}>
            Opportunities
          </Text>
        </View>
        <Ionicons name="search" size={24} color={colors.text} />
      </View>

      {/* categories (trim height + spacing) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[
          styles.categoryScroll,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
        contentContainerStyle={styles.categoryRowContent}
      >
        {categories.map((cat) => {
          const active = activeCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => handleCategoryChange(cat.id)}
              activeOpacity={0.9}
            >
              {active ? (
                <GradientChip>
                  <Ionicons name={cat.icon} size={18} color="#FFF" />
                  <Text style={[styles.categoryChipText, styles.categoryChipTextActive]}>
                    {' '}
                    {cat.name}
                  </Text>
                </GradientChip>
              ) : (
                <View
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      borderWidth: 1,
                    },
                  ]}
                >
                  <Ionicons name={cat.icon} size={18} color={isDark ? '#AAA' : '#666'} />
                  <Text style={[styles.categoryChipText, { color: colors.secondaryText }]}>
                    {' '}
                    {cat.name}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* list */}
      {loading && opportunities.length === 0 ? (
        <View style={[styles.centerContent, { flex: 1 }]}>
          <ActivityIndicator size="large" color={SCOUTA.primary} />
          <Text style={[styles.loadingText, { color: colors.secondaryText }]}>
            Generating personalized opportunities...
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.feedScroll}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 24 }} // trimmed extra space here
        >
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search" size={80} color={isDark ? '#586071' : '#B2BEC3'} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No opportunities yet
              </Text>
              <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
                Tap a category above to generate AI-powered opportunities
              </Text>
            </View>
          ) : (
            filtered.map((opp) => {
              const saved = savedIds.includes(String(opp.id));
              return (
                <View
                  key={String(opp.id)}
                  style={[
                    styles.opportunityCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      borderWidth: 1,
                    },
                    isDark && { shadowColor: SCOUTA.glowShadow },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.cardTitleRow}>
                      <Text style={[styles.cardTitle, { color: colors.text }]}>
                        {opp.title}
                      </Text>
                      <View
                        style={[
                          styles.scoreBadge,
                          { backgroundColor: getScoreColor(opp.score) },
                        ]}
                      >
                        <Text style={styles.scoreBadgeText}>{opp.score}</Text>
                      </View>
                    </View>
                    <View style={styles.trendBadge}>
                      <Ionicons name="trending-up" size={14} color={SCOUTA.primary} />
                      <Text style={[styles.trendText, { color: SCOUTA.primary }]}>
                        {opp.trend}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.cardDescription, { color: colors.secondaryText }]}>
                    {opp.description}
                  </Text>

                  <View
                    style={[
                      styles.cardMetrics,
                      {
                        backgroundColor: isDark ? '#141726' : '#F6F7FB',
                        borderColor: colors.border,
                        borderWidth: 1,
                      },
                    ]}
                  >
                    {[
                      ['Competition', opp.competition],
                      ['Potential', opp.potential],
                      ['Timeframe', opp.timeframe],
                    ].map(([label, value]) => (
                      <View key={label} style={styles.metric}>
                        <Text style={[styles.metricLabel, { color: colors.secondaryText }]}>
                          {label}
                        </Text>
                        <Text style={[styles.metricValue, { color: colors.text }]}>{value}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.cardTags}>
                    {opp.tags.map((tag, i) => (
                      <View
                        key={i}
                        style={[
                          styles.tag,
                          {
                            backgroundColor: isDark
                              ? 'rgba(124,92,255,0.18)'
                              : '#E8E4FF',
                          },
                        ]}
                      >
                        <Text style={[styles.tagText, { color: SCOUTA.primary }]}>{tag}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={[
                        styles.secondaryButton,
                        { borderColor: SCOUTA.primary },
                        saved && { backgroundColor: SCOUTA.primary },
                      ]}
                      onPress={() => handleSave(opp)}
                      disabled={saved}
                    >
                      <Ionicons
                        name={saved ? 'bookmark' : 'bookmark-outline'}
                        size={20}
                        color={saved ? '#FFF' : SCOUTA.primary}
                      />
                      <Text
                        style={[
                          styles.secondaryButtonText,
                          saved && { color: '#FFF' },
                        ]}
                      >
                        {saved ? 'Saved' : 'Save'}
                      </Text>
                    </TouchableOpacity>

                    <GradientButtonSm
                      onPress={() =>
                        navigation.navigate('OpportunityDetail', {
                          opportunity: opp,
                          userProfile,
                        })
                      }
                    >
                      <Text style={styles.gButtonTextSm}>View Details</Text>
                      <Ionicons name="arrow-forward" size={14} color="#FFF" />
                    </GradientButtonSm>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );

  // local mock if signals are empty
  function getMock(): Opportunity[] {
    return [
      {
        id: 1,
        category: 'social',
        title: 'AI Art Generation Content',
        trend: 'Rising Fast',
        score: 92,
        competition: 'Low',
        potential: 'High',
        timeframe: '2-4 weeks',
        description:
          'Create tutorials and showcases for AI art tools like Midjourney and DALL·E.',
        tags: ['TikTok', 'Instagram', 'AI'],
      },
      {
        id: 2,
        category: 'hobbies',
        title: 'Indoor Plant Care Niche',
        trend: 'Steady Growth',
        score: 85,
        competition: 'Medium',
        potential: 'Medium',
        timeframe: '4-8 weeks',
        description:
          'Content and small products for rare houseplant enthusiasts.',
        tags: ['YouTube', 'Newsletter', 'Community'],
      },
    ];
  }
};

export default OpportunitiesFeed;

// ---------- styles ----------
const styles = StyleSheet.create({
  container: { flex: 1 },

  miniBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  feedTitle: { fontSize: 26, fontWeight: '800' },

  categoryScroll: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    maxHeight: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  categoryRowContent: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: 'center',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryChipText: { fontSize: 14, marginLeft: 6, fontWeight: '800' },
  categoryChipTextActive: { color: '#FFF' },
  gChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },

  feedScroll: {
    // no flex here; we control bottom space via contentContainerStyle
  },

  opportunityCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },

  cardHeader: { marginBottom: 12 },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: { fontSize: 18, fontWeight: '800', flex: 1, marginRight: 12 },

  scoreBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  scoreBadgeText: { color: '#FFF', fontSize: 15, fontWeight: '800' },

  trendBadge: { flexDirection: 'row', alignItems: 'center' },
  trendText: { fontSize: 14, fontWeight: '800', marginLeft: 4 },

  cardDescription: { fontSize: 14, marginBottom: 16, lineHeight: 20 },

  cardMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  metric: { alignItems: 'center' },
  metricLabel: { fontSize: 12, marginBottom: 4 },
  metricValue: { fontSize: 14, fontWeight: '800' },

  cardTags: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: { fontSize: 12, fontWeight: '800' },

  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  gButtonSm: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gButtonTextSm: { color: '#FFF', fontSize: 13, fontWeight: '800' },

  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  secondaryButtonText: { fontSize: 13, fontWeight: '700', marginLeft: 6 },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginTop: 24 },
  emptyText: { fontSize: 14, textAlign: 'center', marginTop: 12, lineHeight: 20 },

  centerContent: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16 },
});
