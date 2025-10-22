// App.js — Scouta 🐶 (Expo Go ready)
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, useIsFocused } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { generateActionPlan, generateOpportunities } from './src/aiService';
import {
  deleteSavedOpportunity,
  getSavedOpportunities,
  getUserProfile,
  saveOpportunity,
  saveUserProfile,
  supabase,
} from './src/supabase';


const { width } = Dimensions.get('window');
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();

// ───────────────── Scouta brand tokens ─────────────────
const SCOUTA = {
  grad: ['#7C5CFF', '#00E5FF', '#FF5CA8'], // violet → cyan → pink
  primary: '#7C5CFF',
  cyan: '#00E5FF',
  pink: '#FF5CA8',
  success: '#00D084',
  success2: '#4ECDC4',
  warn: '#FFA726',
  glowShadow: 'rgba(124,92,255,0.35)',
};

// ───────────────── Contexts ─────────────────
const SavedContext = React.createContext();
const ThemeContext = React.createContext();

export const useSavedRefresh = () => {
  const ctx = React.useContext(SavedContext);
  if (!ctx) throw new Error('useSavedRefresh must be used within SavedProvider');
  return ctx;
};
export const useTheme = () => {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

// ───────────────── Gradient UI primitives ─────────────────
function normalizeChildren(children, textStyle) {
  return React.Children.map(children, (child) => {
    if (typeof child === 'string') {
      if (child.trim() === '') return null; // ignore whitespace-only
      return <Text style={textStyle}>{child}</Text>;
    }
    return child;
  });
}

function GradientButton({ children, style, disabled, ...props }) {
  return (
    <TouchableOpacity activeOpacity={0.9} disabled={disabled} {...props}>
      <LinearGradient
        colors={SCOUTA.grad}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.gButton, disabled && { opacity: 0.6 }, style]}
      >
        {normalizeChildren(children, styles.gButtonText)}
      </LinearGradient>
    </TouchableOpacity>
  );
}

function GradientButtonSm({ children, style, ...props }) {
  return (
    <TouchableOpacity activeOpacity={0.9} {...props}>
      <LinearGradient
        colors={SCOUTA.grad}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.gButtonSm, style]}
      >
        {normalizeChildren(children, styles.gButtonTextSm)}
      </LinearGradient>
    </TouchableOpacity>
  );
}

function GradientChip({ children, style }) {
  return (
    <LinearGradient
      colors={SCOUTA.grad}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.gChip, style]}
    >
      {normalizeChildren(children, styles.categoryChipTextActive)}
    </LinearGradient>
  );
}
function TopSafeGradient() {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={SCOUTA.grad}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{ height: insets.top, width: '100%' }}
    />
  );
}


// ============================================
// ONBOARDING SCREENS
// ============================================
function WelcomeScreen({ onNext }) {
  const { colors, isDark } = useTheme();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.welcomeContainer}>
        {/* Scouta emoji badge */}
        <LinearGradient colors={SCOUTA.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.logoBadge}>
          <Text style={{ fontSize: 40 }}>🐶</Text>
        </LinearGradient>

        {/* Title + brand underline */}
        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.welcomeTitle, { color: colors.text }]}>Scouta 🐶</Text>
          <LinearGradient
            colors={SCOUTA.grad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: 4, borderRadius: 2, width: 120, marginTop: 6 }}
          />
        </View>

        <Text style={[styles.welcomeSubtitle, { color: SCOUTA.primary }]}>
          Discover what’s next — faster
        </Text>
        <Text style={[styles.welcomeDescription, { color: colors.secondaryText }]}>
          AI-powered trend intelligence across social media, hobbies, business, and stocks — personalized for you.
        </Text>

        <View style={styles.featureList}>
          {['Spot trends early', 'Personalized matches', 'Actionable insights'].map((line) => (
            <View key={line} style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={24} color={SCOUTA.success} />
              <Text style={[styles.featureText, { color: colors.text }]}>{line}</Text>
            </View>
          ))}
        </View>

        <GradientButton onPress={onNext} style={{ marginTop: 28 }}>
          Get Started
        </GradientButton>
      </View>
    </SafeAreaView>
  );
}

function InterestSelectionScreen({ onNext }) {
  const [selectedInterests, setSelectedInterests] = useState([]);
  const { colors, isDark } = useTheme();

  const interests = [
    { id: 'social', name: 'Social Media', icon: 'logo-instagram', color: '#E1306C' },
    { id: 'hobbies', name: 'Hobbies', icon: 'fitness', color: '#FF6B6B' },
    { id: 'business', name: 'Side Hustles', icon: 'briefcase', color: '#4ECDC4' },
    { id: 'stocks', name: 'Stocks & Crypto', icon: 'trending-up', color: '#95E1D3' },
  ];

  const toggleInterest = (id) =>
    setSelectedInterests((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.onboardingContent}>
        <Text style={[styles.onboardingTitle, { color: colors.text }]}>What interests you?</Text>
        <Text style={[styles.onboardingSubtitle, { color: colors.secondaryText }]}>
          Select all that apply — we’ll personalize your feed
        </Text>

        <View style={styles.interestGrid}>
          {interests.map((interest) => {
            const isSelected = selectedInterests.includes(interest.id);
            return (
              <TouchableOpacity
                key={interest.id}
                style={[
                  styles.interestCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  isSelected && { backgroundColor: interest.color, borderColor: interest.color },
                ]}
                onPress={() => toggleInterest(interest.id)}
                activeOpacity={0.9}
              >
                <Ionicons name={interest.icon} size={40} color={isSelected ? '#FFF' : interest.color} />
                <Text
                  style={[
                    styles.interestText,
                    { color: isSelected ? '#FFF' : colors.text },
                  ]}
                >
                  {interest.name}
                </Text>
                {isSelected && <Ionicons name="checkmark-circle" size={24} color="#FFF" style={styles.checkmark} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <GradientButton onPress={() => onNext(selectedInterests)} disabled={selectedInterests.length === 0}>
          Continue
        </GradientButton>
      </ScrollView>
    </SafeAreaView>
  );
}

function SkillLevelScreen({ onNext, userProfile }) {
  const [skillLevel, setSkillLevel] = useState(null);
  const [timeAvailable, setTimeAvailable] = useState(null);
  const [saving, setSaving] = useState(false);
  const { colors, isDark } = useTheme();

  const skillLevels = [
    { id: 'beginner', label: 'Beginner', desc: 'Just starting out' },
    { id: 'intermediate', label: 'Intermediate', desc: 'Some experience' },
    { id: 'expert', label: 'Expert', desc: 'Experienced pro' },
  ];

  const timeOptions = [
    { id: 'casual', label: '1-5 hrs/week', desc: 'Casual explorer' },
    { id: 'serious', label: '5-15 hrs/week', desc: 'Serious pursuer' },
    { id: 'fulltime', label: '15+ hrs/week', desc: 'All-in commitment' },
  ];

  const handleComplete = async () => {
    setSaving(true);
    try {
      const profileData = {
        interests: userProfile.interests,
        skill_level: skillLevel,
        time_available: timeAvailable,
      };
      await saveUserProfile(profileData);
      Alert.alert('Success', 'Profile saved successfully!');
      onNext({ skillLevel, timeAvailable });
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.onboardingContent}>
        <Text style={[styles.onboardingTitle, { color: colors.text }]}>Tell us about yourself</Text>
        <Text style={[styles.onboardingSubtitle, { color: colors.secondaryText }]}>
          This helps us match opportunities to your level
        </Text>

        <Text style={[styles.sectionLabel, { color: colors.text }]}>Your skill level</Text>
        {skillLevels.map((level) => (
          <TouchableOpacity
            key={level.id}
            style={[
              styles.optionCard,
              { backgroundColor: colors.card, borderColor: colors.border },
              skillLevel === level.id && { borderColor: SCOUTA.primary, backgroundColor: '#F5F3FF' },
            ]}
            onPress={() => setSkillLevel(level.id)}
          >
            <View style={styles.optionContent}>
              <Text
                style={[
                  styles.optionLabel,
                  { color: colors.text },
                  skillLevel === level.id && { color: SCOUTA.primary },
                ]}
              >
                {level.label}
              </Text>
              <Text style={[styles.optionDesc, { color: colors.secondaryText }]}>{level.desc}</Text>
            </View>
            {skillLevel === level.id && <Ionicons name="checkmark-circle" size={24} color={SCOUTA.primary} />}
          </TouchableOpacity>
        ))}

        <Text style={[styles.sectionLabel, { marginTop: 24, color: colors.text }]}>Time you can commit</Text>
        {timeOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionCard,
              { backgroundColor: colors.card, borderColor: colors.border },
              timeAvailable === option.id && { borderColor: SCOUTA.primary, backgroundColor: '#F5F3FF' },
            ]}
            onPress={() => setTimeAvailable(option.id)}
          >
            <View style={styles.optionContent}>
              <Text
                style={[
                  styles.optionLabel,
                  { color: colors.text },
                  timeAvailable === option.id && { color: SCOUTA.primary },
                ]}
              >
                {option.label}
              </Text>
              <Text style={[styles.optionDesc, { color: colors.secondaryText }]}>{option.desc}</Text>
            </View>
            {timeAvailable === option.id && <Ionicons name="checkmark-circle" size={24} color={SCOUTA.primary} />}
          </TouchableOpacity>
        ))}

        <GradientButton onPress={handleComplete} disabled={!skillLevel || !timeAvailable || saving}>
          {saving ? 'Saving…' : 'Complete Setup'}
        </GradientButton>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================
// OPPORTUNITY DETAIL SCREEN
// ============================================
function OpportunityDetailScreen({ route, navigation }) {
  const { opportunity, userProfile } = route.params;
  const [actionPlan, setActionPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const { colors, isDark } = useTheme();

  useEffect(() => {
    (async () => {
      try {
        const plan = await generateActionPlan(opportunity, userProfile);
        setActionPlan(plan);
      } catch (_e) {
        setActionPlan({
          whyMatch:
            'This opportunity aligns with your interests and skill level, making it an excellent fit for your goals.',
          actionSteps: [
            'Research the market and identify your unique angle',
            'Create a content calendar or project timeline',
            'Set up necessary accounts and tools',
            'Start with a small test project',
            'Gather feedback and iterate',
          ],
          resources: ['Time commitment', 'Learning resources', 'Platform accounts'],
          metrics: ['Track engagement', 'Monitor growth', 'Measure success'],
          challenges: [
            { challenge: 'Getting started can be overwhelming', solution: 'Break it into small, manageable steps' },
          ],
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [opportunity, userProfile]);

  const getScoreColor = (score) => (score >= 90 ? SCOUTA.success : score >= 75 ? SCOUTA.success2 : SCOUTA.warn);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <ActivityIndicator size="large" color={SCOUTA.primary} />
        <Text style={[styles.loadingText, { color: colors.secondaryText }]}>Generating action plan...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={[styles.detailHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(opportunity.score) }]}>
          <Text style={styles.scoreBadgeText}>{opportunity.score}</Text>
        </View>
      </View>

      <ScrollView style={styles.detailScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.detailContent}>
          <Text style={[styles.detailTitle, { color: colors.text }]}>{opportunity.title}</Text>

          <View style={styles.detailMetaRow}>
            <View style={styles.trendBadge}>
              <Ionicons name="trending-up" size={16} color={SCOUTA.primary} />
              <Text style={[styles.trendText, { color: SCOUTA.primary }]}>{opportunity.trend}</Text>
            </View>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{opportunity.category}</Text>
            </View>
          </View>

          <Text style={[styles.detailDescription, { color: colors.secondaryText }]}>{opportunity.description}</Text>

          <View style={[styles.detailMetrics, { backgroundColor: colors.card }]}>
            {[
              ['Competition', opportunity.competition],
              ['Potential', opportunity.potential],
              ['Timeframe', opportunity.timeframe],
            ].map(([label, value]) => (
              <View key={label} style={styles.detailMetric}>
                <Text style={styles.detailMetricLabel}>{label}</Text>
                <Text style={[styles.detailMetricValue, { color: colors.text }]}>{value}</Text>
              </View>
            ))}
          </View>

          {actionPlan && (
            <>
              <View style={styles.detailSection}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="checkmark-circle" size={24} color={SCOUTA.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Why This Matches You</Text>
                </View>
                <Text style={[styles.sectionText, { color: colors.secondaryText }]}>{actionPlan.whyMatch}</Text>
              </View>

              <View style={styles.detailSection}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="list" size={24} color={SCOUTA.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Action Steps</Text>
                </View>
                {actionPlan.actionSteps?.map((step, i) => (
                  <View key={i} style={styles.stepItem}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{i + 1}</Text>
                    </View>
                    <Text style={[styles.stepText, { color: colors.text }]}>{step}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================
// SAVED OPPORTUNITIES SCREEN
// ============================================
function SavedScreen({ navigation }) {
  const [savedOpportunities, setSavedOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();
  const { refreshTrigger, triggerRefresh } = useSavedRefresh();
  const { colors, isDark } = useTheme();

  useEffect(() => {
    if (isFocused) loadSaved();
     
  }, [isFocused, refreshTrigger]);

  const loadSaved = async () => {
    try {
      const saved = await getSavedOpportunities();
      setSavedOpportunities(saved);
    } catch (error) {
      console.error('Error loading saved opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (opportunityId) => {
    try {
      await deleteSavedOpportunity(opportunityId);
      setSavedOpportunities((prev) => prev.filter((s) => s.id !== opportunityId));
      triggerRefresh();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const getScoreColor = (score) => (score >= 90 ? SCOUTA.success : score >= 75 ? SCOUTA.success2 : SCOUTA.warn);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <ActivityIndicator size="large" color={SCOUTA.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={[styles.feedHeader, { backgroundColor: colors.card }]}>
        <Text style={[styles.feedTitle, { color: colors.text }]}>Saved</Text>
        <Text style={[styles.savedCount, { color: colors.secondaryText }]}>{savedOpportunities.length} saved</Text>
      </View>

      {savedOpportunities.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="bookmark-outline" size={80} color="#B2BEC3" />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No saved opportunities</Text>
          <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
            Start saving opportunities from the feed to track them here
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.feedScroll}>
          {savedOpportunities.map((item) => (
            <View key={item.id} style={[styles.savedCard, { backgroundColor: colors.card }]}>
              <View style={styles.savedCardHeader}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
                <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(item.score) }]}>
                  <Text style={styles.scoreBadgeText}>{item.score}</Text>
                </View>
              </View>

              <View style={styles.savedCardMeta}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{item.category}</Text>
                </View>
                <Text style={styles.savedDate}>Saved {new Date(item.saved_at).toLocaleDateString()}</Text>
              </View>

              <View style={styles.savedCardActions}>
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

                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ============================================
// OPPORTUNITIES FEED
// ============================================
function OpportunitiesFeed({ userProfile, navigation }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [savedOpportunityIds, setSavedOpportunityIds] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatingCategory, setGeneratingCategory] = useState(null);
  const { triggerRefresh, refreshTrigger } = useSavedRefresh();
  const { colors, isDark } = useTheme();

  useEffect(() => {
    loadSavedOpportunities();
     
  }, [refreshTrigger]);

  useEffect(() => {
    loadInitialOpportunities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadInitialOpportunities = async () => {
    setLoading(true);
    try {
      const firstInterest = userProfile?.interests?.[0] || 'social';
      const aiOpportunities = await generateOpportunities(firstInterest, userProfile);
      setOpportunities(aiOpportunities);
    } catch (error) {
      console.error('Error loading initial opportunities:', error);
      setOpportunities(getMockOpportunities());
    } finally {
      setLoading(false);
    }
  };

  const loadOpportunitiesForCategory = async (category) => {
    if (category === 'all') return;
    setGeneratingCategory(category);
    try {
      const aiOpps = await generateOpportunities(category, userProfile);
      setOpportunities((prev) => [...prev.filter((o) => o.category !== category), ...aiOpps]);
    } catch (error) {
      console.error('Error generating opportunities:', error);
      Alert.alert('Error', 'Failed to generate opportunities. Please try again.');
    } finally {
      setGeneratingCategory(null);
    }
  };

  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
    if (categoryId !== 'all') {
      const has = opportunities.some((o) => o.category === categoryId);
      if (!has) loadOpportunitiesForCategory(categoryId);
    }
  };

  const loadSavedOpportunities = async () => {
    try {
      const saved = await getSavedOpportunities();
      const ids = saved.map((s) => s.opportunity_id);
      setSavedOpportunityIds(ids);
    } catch (error) {
      console.error('Error loading saved opportunities:', error);
    }
  };

  const handleSaveOpportunity = async (opportunity) => {
    try {
      await saveOpportunity(opportunity);
      setSavedOpportunityIds((prev) => [...prev, opportunity.id.toString()]);
      triggerRefresh();
    } catch (error) {
      console.error('Error saving opportunity:', error);
    }
  };

  const isOpportunitySaved = (opportunityId) => savedOpportunityIds.includes(opportunityId.toString());

  const getMockOpportunities = () => [
    {
      id: 1,
      category: 'social',
      title: 'AI Art Generation Content',
      trend: 'Rising Fast',
      score: 92,
      competition: 'Low',
      potential: 'High',
      timeframe: '2-4 weeks',
      description: 'Create tutorials and showcases for AI art tools like Midjourney and DALL-E',
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
      description: 'Growing community interested in rare plants and care tips',
      tags: ['Instagram', 'YouTube', 'Community'],
    },
  ];

  const categories = [
    { id: 'all', name: 'All', icon: 'apps' },
    { id: 'social', name: 'Social', icon: 'logo-instagram' },
    { id: 'hobbies', name: 'Hobbies', icon: 'fitness' },
    { id: 'business', name: 'Business', icon: 'briefcase' },
    { id: 'stocks', name: 'Stocks', icon: 'trending-up' },
  ];

  const filteredOpportunities = activeCategory === 'all' ? opportunities : opportunities.filter((o) => o.category === activeCategory);
  const getScoreColor = (score) => (score >= 90 ? SCOUTA.success : score >= 75 ? SCOUTA.success2 : SCOUTA.warn);

  if (loading && opportunities.length === 0) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <ActivityIndicator size="large" color={SCOUTA.primary} />
        <Text style={[styles.loadingText, { color: colors.secondaryText }]}>Generating personalized opportunities...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      {/* Header with Scouta badge mini */}
      <View style={[styles.feedHeader, { backgroundColor: colors.card }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <LinearGradient colors={SCOUTA.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.miniBadge}>
            <Text style={{ fontSize: 14 }}>🐶</Text>
          </LinearGradient>
          <Text style={[styles.feedTitle, { color: colors.text, marginLeft: 8 }]}>Opportunities</Text>
        </View>
        <Ionicons name="search" size={24} color={colors.text} />
      </View>

      {/* Categories with gradient active chip */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.categoryScroll, { backgroundColor: colors.card }]}>
        {categories.map((cat) => {
          const active = activeCategory === cat.id;
          return (
            <TouchableOpacity key={cat.id} onPress={() => handleCategoryChange(cat.id)} activeOpacity={0.9}>
              {active ? (
                <GradientChip>
                  <Ionicons name={cat.icon} size={18} color="#FFF" />
                  <Text style={[styles.categoryChipText, styles.categoryChipTextActive]}> {cat.name}</Text>
                </GradientChip>
              ) : (
                <View style={[styles.categoryChip, { backgroundColor: colors.background }]}>
                  <Ionicons name={cat.icon} size={18} color={'#666'} />
                  <Text style={[styles.categoryChipText, { color: colors.secondaryText }]}> {cat.name}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Main feed */}
      <ScrollView style={styles.feedScroll}>
        {filteredOpportunities.length === 0 && !loading ? (
          <View style={styles.emptyState}>
            <Ionicons name="search" size={80} color="#B2BEC3" />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No opportunities yet</Text>
            <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
              Tap a category above to generate AI-powered opportunities
            </Text>
          </View>
        ) : (
          filteredOpportunities.map((opp) => (
            <View
              key={opp.id}
              style={[
                styles.opportunityCard,
                { backgroundColor: colors.card },
                isDark && { shadowColor: SCOUTA.glowShadow },
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{opp.title}</Text>
                  <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(opp.score) }]}>
                    <Text style={styles.scoreBadgeText}>{opp.score}</Text>
                  </View>
                </View>

                <View style={styles.trendBadge}>
                  <Ionicons name="trending-up" size={14} color={SCOUTA.primary} />
                  <Text style={[styles.trendText, { color: SCOUTA.primary }]}>{opp.trend}</Text>
                </View>
              </View>

              <Text style={[styles.cardDescription, { color: colors.secondaryText }]}>{opp.description}</Text>

              <View style={[styles.cardMetrics, { backgroundColor: colors.background }]}>
                {[
                  ['Competition', opp.competition],
                  ['Potential', opp.potential],
                  ['Timeframe', opp.timeframe],
                ].map(([label, value]) => (
                  <View key={label} style={styles.metric}>
                    <Text style={styles.metricLabel}>{label}</Text>
                    <Text style={[styles.metricValue, { color: colors.text }]}>{value}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.cardTags}>
                {opp.tags.map((tag, idx) => (
                  <View key={idx} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={[styles.secondaryButton, isOpportunitySaved(opp.id) && styles.savedButton]}
                  onPress={() => handleSaveOpportunity(opp)}
                  disabled={isOpportunitySaved(opp.id)}
                >
                  <Ionicons
                    name={isOpportunitySaved(opp.id) ? 'bookmark' : 'bookmark-outline'}
                    size={20}
                    color={isOpportunitySaved(opp.id) ? '#FFF' : SCOUTA.primary}
                  />
                  <Text style={[styles.secondaryButtonText, isOpportunitySaved(opp.id) && styles.savedButtonText]}>
                    {isOpportunitySaved(opp.id) ? 'Saved' : 'Save'}
                  </Text>
                </TouchableOpacity>

                <GradientButtonSm onPress={() => navigation.navigate('OpportunityDetail', { opportunity: opp, userProfile })}>
  <Text style={styles.gButtonTextSm}>View Details</Text>
  <Ionicons name="arrow-forward" size={14} color="#FFF" /> {/* was 16 */}
</GradientButtonSm>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================
// PROFILE SCREEN (+ dark mode toggle / persisted)
// ============================================
function ProfileScreen() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isDark, toggleTheme, colors } = useTheme();

  useEffect(() => {
    (async () => {
      try {
        const userProfile = await getUserProfile();
        setProfile(userProfile);
      } catch (e) {
        console.error('Error loading profile:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleThemeToggle = async () => {
    const next = !isDark;
    toggleTheme();
    try {
      await AsyncStorage.setItem('scouta_theme', next ? 'dark' : 'light');
    } catch {}
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      if (Platform.OS === 'web') window.location.reload();
    } catch (e) {
      console.error('Error signing out:', e);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <ActivityIndicator size="large" color={SCOUTA.primary} />
      </SafeAreaView>
    );
  }

  const interestLabels = { social: 'Social Media', hobbies: 'Hobbies', business: 'Side Hustles', stocks: 'Stocks & Crypto' };
  const skillLabels = { beginner: 'Beginner', intermediate: 'Intermediate', expert: 'Expert' };
  const timeLabels = { casual: '1-5 hrs/week', serious: '5-15 hrs/week', fulltime: '15+ hrs/week' };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.profileContent}>
        <View style={styles.profileHeader}>
          <LinearGradient colors={SCOUTA.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.profileAvatar}>
            <Text style={{ fontSize: 34 }}>🐶</Text>
          </LinearGradient>
          <Text style={[styles.profileEmail, { color: colors.secondaryText }]}>{profile?.email || 'Anonymous User'}</Text>
        </View>

        <View style={styles.profileSection}>
          <Text style={[styles.profileSectionTitle, { color: '#B2BEC3' }]}>Interests</Text>
          <View style={styles.profileTags}>
            {profile?.interests?.map((interest) => (
              <View key={interest} style={[styles.profileTag, { backgroundColor: SCOUTA.primary }]}>
                <Text style={styles.profileTagText}>{interestLabels[interest]}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.profileSection}>
          <Text style={[styles.profileSectionTitle, { color: '#B2BEC3' }]}>Experience Level</Text>
          <Text style={[styles.profileValue, { color: colors.text }]}>{skillLabels[profile?.skill_level]}</Text>
        </View>

        <View style={styles.profileSection}>
          <Text style={[styles.profileSectionTitle, { color: '#B2BEC3' }]}>Time Commitment</Text>
          <Text style={[styles.profileValue, { color: colors.text }]}>{timeLabels[profile?.time_available]}</Text>
        </View>

        <View style={styles.profileSection}>
          {/* Dark mode toggle row */}
          <TouchableOpacity style={[styles.settingItem, { backgroundColor: colors.card }]} onPress={handleThemeToggle}>
            <Ionicons name={isDark ? 'sunny' : 'moon'} size={24} color={colors.text} />
            <Text style={[styles.settingText, { color: colors.text }]}>{isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</Text>
            <Ionicons name="chevron-forward" size={24} color="#B2BEC3" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingItem, { backgroundColor: colors.card }]}>
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
            <Text style={[styles.settingText, { color: colors.text }]}>Notifications</Text>
            <Ionicons name="chevron-forward" size={24} color="#B2BEC3" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingItem, { backgroundColor: colors.card }]}>
            <Ionicons name="settings-outline" size={24} color={colors.text} />
            <Text style={[styles.settingText, { color: colors.text }]}>Preferences</Text>
            <Ionicons name="chevron-forward" size={24} color="#B2BEC3" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingItem, { backgroundColor: colors.card }]}>
            <Ionicons name="help-circle-outline" size={24} color={colors.text} />
            <Text style={[styles.settingText, { color: colors.text }]}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={24} color="#B2BEC3" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Reset App</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================
// NAVIGATION
// ============================================
function FeedStack({ userProfile }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FeedMain">{(props) => <OpportunitiesFeed {...props} userProfile={userProfile} />}</Stack.Screen>
      <Stack.Screen name="OpportunityDetail" component={OpportunityDetailScreen} />
    </Stack.Navigator>
  );
}

function MainTabs({ userProfile }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { colors } = useTheme();
  const triggerRefresh = () => setRefreshTrigger((p) => p + 1);

  return (
    <SavedContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
         tabBarIcon: ({ focused, color, size }) => {
   let iconName = 'home-outline';
  if (route.name === 'Feed 🐶') iconName = focused ? 'home' : 'home-outline';
  else if (route.name === 'Saved') iconName = focused ? 'bookmark' : 'bookmark-outline';
  else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
  return <Ionicons name={iconName} size={size} color={color} />;
 },
          tabBarActiveTintColor: SCOUTA.primary,
          tabBarInactiveTintColor: '#8E8E93',
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingTop: 6,
            paddingBottom: 8,
            height: 60,
          },
        })}
      >
        <Tab.Screen name="Feed 🐶">{(props) => <FeedStack {...props} userProfile={userProfile} />}</Tab.Screen>
        <Tab.Screen name="Saved" component={SavedScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </SavedContext.Provider>
  );
}

// ============================================
// MAIN APP
// ============================================
export default function App() {
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);

  const lightColors = {
    background: '#F8F9FA',
    card: '#FFFFFF',
    text: '#2D3436',
    secondaryText: '#636E72',
    border: '#E0E0E0',
  };
  const darkColors = {
    background: '#0F111A',
    card: '#1A1C28',
    text: '#FFFFFF',
    secondaryText: '#B2BEC3',
    border: '#2A2E3C',
  };
  const colors = isDark ? darkColors : lightColors;
  const toggleTheme = () => setIsDark((p) => !p);

  // Load theme + user
  useEffect(() => {
    (async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('scouta_theme');
        if (savedTheme === 'dark') setIsDark(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) await supabase.auth.signInAnonymously();

        try {
          const profile = await getUserProfile();
          if (profile && profile.interests) {
            setUserProfile(profile);
            setOnboardingStep(3); // go straight to app
          }
        } catch {}
      } catch (e) {
        console.error('Init error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleWelcomeNext = () => setOnboardingStep(1);
  const handleInterestsNext = (interests) => {
    setUserProfile({ ...userProfile, interests });
    setOnboardingStep(2);
  };
  const handleSkillNext = (data) => {
    setUserProfile({ ...userProfile, ...data });
    setOnboardingStep(3);
  };



 return (
  <SafeAreaProvider>
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {loading ? (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          <TopSafeGradient />
          <ActivityIndicator size="large" color={SCOUTA.primary} />
          <Text style={[styles.loadingText, { color: colors.secondaryText }]}>Loading...</Text>
        </SafeAreaView>
      ) : onboardingStep === 0 ? (
        <WelcomeScreen onNext={handleWelcomeNext} />
      ) : onboardingStep === 1 ? (
        <InterestSelectionScreen onNext={handleInterestsNext} />
      ) : onboardingStep === 2 ? (
        <SkillLevelScreen onNext={handleSkillNext} userProfile={userProfile} />
      ) : (
        <NavigationContainer>
          <RootStack.Navigator screenOptions={{ headerShown: false }}>
     <RootStack.Screen name="MainTabs">
       {() => <MainTabs userProfile={userProfile} />}
 </RootStack.Screen>
       <RootStack.Screen name="OpportunityDetail" component={OpportunityDetailScreen} />
   </RootStack.Navigator>
 </NavigationContainer>
      )}
    </ThemeContext.Provider>
  </SafeAreaProvider>
 )}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },

  // Brand / hero
  logoBadge: {
    width: 88,
    height: 88,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: SCOUTA.glowShadow,
    shadowOpacity: 0.7,
    shadowRadius: 16,
    marginBottom: 8,
  },
  miniBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Welcome
  welcomeContainer: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  welcomeTitle: { fontSize: 34, fontWeight: '800', marginTop: 16 },
  welcomeSubtitle: { fontSize: 18, marginTop: 10, textAlign: 'center', fontWeight: '700' },
  welcomeDescription: { fontSize: 16, marginTop: 14, textAlign: 'center', lineHeight: 24, maxWidth: 420 },
  featureList: { marginTop: 36, width: '100%' },
  featureItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  featureText: { fontSize: 16, marginLeft: 12 },

  // Onboarding shared
  onboardingContent: { padding: 24 },
  onboardingTitle: { fontSize: 28, fontWeight: '800', marginBottom: 8 },
  onboardingSubtitle: { fontSize: 16, marginBottom: 28 },

  interestGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  interestCard: {
    width: (width - 64) / 2,
    aspectRatio: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  interestText: { fontSize: 14, fontWeight: '700', marginTop: 12, textAlign: 'center' },
  checkmark: { position: 'absolute', top: 12, right: 12 },

  sectionLabel: { fontSize: 18, fontWeight: '800', marginBottom: 14 },
  optionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
  },
  optionContent: { flex: 1 },
  optionLabel: { fontSize: 16, fontWeight: '800' },
  optionDesc: { fontSize: 14, marginTop: 4 },

  // Feed
  feedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18 },
  feedTitle: { fontSize: 26, fontWeight: '800' },

  categoryScroll: { paddingHorizontal: 16, paddingBottom: 12 },
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

  feedScroll: { flex: 1 },

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
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: '800', flex: 1, marginRight: 12 },

  scoreBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  scoreBadgeText: { color: '#FFF', fontSize: 15, fontWeight: '800' },

  trendBadge: { flexDirection: 'row', alignItems: 'center' },
  trendText: { fontSize: 14, fontWeight: '800', marginLeft: 4 },

  cardDescription: { fontSize: 14, marginBottom: 16, lineHeight: 20 },
  cardMetrics: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16, paddingVertical: 12, borderRadius: 8 },
  metric: { alignItems: 'center' },
  metricLabel: { fontSize: 12, color: '#B2BEC3', marginBottom: 4 },
  metricValue: { fontSize: 14, fontWeight: '800' },

  cardTags: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  tag: { backgroundColor: '#E8E4FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginRight: 8, marginBottom: 8 },
  tagText: { fontSize: 12, color: SCOUTA.primary, fontWeight: '800' },

  cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  // Saved
  savedCount: { fontSize: 14 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginTop: 24 },
  emptyText: { fontSize: 14, textAlign: 'center', marginTop: 12, lineHeight: 20 },

  savedCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  savedCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  savedCardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  categoryBadge: { backgroundColor: '#E8E4FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  categoryBadgeText: { fontSize: 12, color: SCOUTA.primary, fontWeight: '800', textTransform: 'capitalize' },
  savedDate: { fontSize: 12, color: '#B2BEC3' },
  savedCardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  deleteButton: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#FF3B30' },

  // Profile
  profileContent: { padding: 24 },
  profileHeader: { alignItems: 'center', marginBottom: 28 },
  profileAvatar: { width: 84, height: 84, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  profileEmail: { fontSize: 16 },
  profileSection: { marginBottom: 24 },
  profileSectionTitle: { fontSize: 14, fontWeight: '800', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  profileTags: { flexDirection: 'row', flexWrap: 'wrap' },
  profileTag: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, marginBottom: 8 },
  profileTagText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  profileValue: { fontSize: 16, fontWeight: '700' },
  settingItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 8 },
  settingText: { flex: 1, fontSize: 16, marginLeft: 12 },
  signOutButton: { backgroundColor: '#FF3B30', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  signOutText: { color: '#FFF', fontSize: 16, fontWeight: '800' },

  // Detail
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  backButton: { padding: 8 },
  detailScroll: { flex: 1 },
  detailContent: { padding: 20 },
  detailTitle: { fontSize: 28, fontWeight: '800', marginBottom: 16 },
  detailMetaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  detailDescription: { fontSize: 16, lineHeight: 24, marginBottom: 24 },
  detailMetrics: { flexDirection: 'row', justifyContent: 'space-around', borderRadius: 12, padding: 16, marginBottom: 24 },
  detailMetric: { alignItems: 'center' },
  detailMetricLabel: { fontSize: 12, color: '#B2BEC3', marginBottom: 4 },
  detailMetricValue: { fontSize: 16, fontWeight: '800' },
  detailSection: { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 20, fontWeight: '800', marginLeft: 12 },
  sectionText: { fontSize: 16, lineHeight: 24 },
  stepItem: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-start' },
  stepNumber: { width: 32, height: 32, borderRadius: 16, backgroundColor: SCOUTA.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  stepNumberText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  stepText: { flex: 1, fontSize: 16, lineHeight: 24 },

  // Gradient primitives
  gButton: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8, paddingHorizontal: 18 },
  gButtonText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  gButtonSm: {
  paddingHorizontal: 14,   // was 20
  paddingVertical: 9,      // was 12
  borderRadius: 10,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
},
gButtonTextSm: {
  color: '#FFF',
  fontSize: 13,            // was 14
  fontWeight: '800',
},
secondaryButton: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 14,   // was 20
  paddingVertical: 9,      // was 12
  borderRadius: 8,
  borderWidth: 1.5,        // was 2
  borderColor: SCOUTA.primary,
},
secondaryButtonText: {
  color: SCOUTA.primary,
  fontSize: 13,            // was 14
  fontWeight: '700',
  marginLeft: 6,
},


  gChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8 },

  // Misc
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16 },
});

