import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, useIsFocused } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { generateActionPlan, generateOpportunities } from './src/aiService';
import { deleteSavedOpportunity, getSavedOpportunities, getUserProfile, saveOpportunity, saveUserProfile, supabase } from './src/supabase';

const { width } = Dimensions.get('window');
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Create a context to share refresh trigger across tabs
const SavedContext = React.createContext();

export const useSavedRefresh = () => {
  const context = React.useContext(SavedContext);
  if (!context) {
    throw new Error('useSavedRefresh must be used within SavedProvider');
  }
  return context;
};

// ============================================
// ONBOARDING SCREENS
// ============================================
function WelcomeScreen({ onNext }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.welcomeContainer}>
        <Ionicons name="trending-up" size={80} color="#6C5CE7" />
        <Text style={styles.welcomeTitle}>OpportunityScout</Text>
        <Text style={styles.welcomeSubtitle}>
          Find emerging opportunities before they peak
        </Text>
        <Text style={styles.welcomeDescription}>
          AI-powered trend intelligence across social media, hobbies, business, and stocks - personalized just for you.
        </Text>

        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color="#00D084" />
            <Text style={styles.featureText}>Spot trends early</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color="#00D084" />
            <Text style={styles.featureText}>Personalized matches</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color="#00D084" />
            <Text style={styles.featureText}>Actionable insights</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={onNext}>
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
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

  useEffect(() => {
    loadActionPlan();
  }, []);

  const loadActionPlan = async () => {
    try {
      const plan = await generateActionPlan(opportunity, userProfile);
      setActionPlan(plan);
    } catch (error) {
      console.error('Error loading action plan:', error);
      // Fallback plan
      setActionPlan({
        whyMatch: "This opportunity aligns with your interests and skill level, making it an excellent fit for your goals.",
        actionSteps: [
          "Research the market and identify your unique angle",
          "Create a content calendar or project timeline",
          "Set up necessary accounts and tools",
          "Start with a small test project",
          "Gather feedback and iterate"
        ],
        resources: ["Time commitment", "Learning resources", "Platform accounts"],
        metrics: ["Track engagement", "Monitor growth", "Measure success"],
        challenges: [{
          challenge: "Getting started can be overwhelming",
          solution: "Break it into small, manageable steps"
        }]
      });
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return '#00D084';
    if (score >= 75) return '#4ECDC4';
    return '#FFA726';
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#6C5CE7" />
        <Text style={styles.loadingText}>Generating action plan...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.detailHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#2D3436" />
        </TouchableOpacity>
        <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(opportunity.score) }]}>
          <Text style={styles.scoreBadgeText}>{opportunity.score}</Text>
        </View>
      </View>

      <ScrollView style={styles.detailScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.detailContent}>
          <Text style={styles.detailTitle}>{opportunity.title}</Text>
          
          <View style={styles.detailMetaRow}>
            <View style={styles.trendBadge}>
              <Ionicons name="trending-up" size={16} color="#6C5CE7" />
              <Text style={styles.trendText}>{opportunity.trend}</Text>
            </View>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{opportunity.category}</Text>
            </View>
          </View>

          <Text style={styles.detailDescription}>{opportunity.description}</Text>

          <View style={styles.detailMetrics}>
            <View style={styles.detailMetric}>
              <Text style={styles.detailMetricLabel}>Competition</Text>
              <Text style={styles.detailMetricValue}>{opportunity.competition}</Text>
            </View>
            <View style={styles.detailMetric}>
              <Text style={styles.detailMetricLabel}>Potential</Text>
              <Text style={styles.detailMetricValue}>{opportunity.potential}</Text>
            </View>
            <View style={styles.detailMetric}>
              <Text style={styles.detailMetricLabel}>Timeframe</Text>
              <Text style={styles.detailMetricValue}>{opportunity.timeframe}</Text>
            </View>
          </View>

          <View style={styles.detailSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="checkmark-circle" size={24} color="#6C5CE7" />
              <Text style={styles.sectionTitle}>Why This Matches You</Text>
            </View>
            <Text style={styles.sectionText}>{actionPlan.whyMatch}</Text>
          </View>

          <View style={styles.detailSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="list" size={24} color="#6C5CE7" />
              <Text style={styles.sectionTitle}>Action Steps</Text>
            </View>
            {actionPlan.actionSteps?.map((step, index) => (
              <View key={index} style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>

          <View style={styles.detailSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="construct" size={24} color="#6C5CE7" />
              <Text style={styles.sectionTitle}>Resources Needed</Text>
            </View>
            <View style={styles.resourceList}>
              {actionPlan.resources?.map((resource, index) => (
                <View key={index} style={styles.resourceItem}>
                  <Ionicons name="ellipse" size={8} color="#6C5CE7" />
                  <Text style={styles.resourceText}>{resource}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.detailSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="analytics" size={24} color="#6C5CE7" />
              <Text style={styles.sectionTitle}>Success Metrics</Text>
            </View>
            <View style={styles.resourceList}>
              {actionPlan.metrics?.map((metric, index) => (
                <View key={index} style={styles.resourceItem}>
                  <Ionicons name="ellipse" size={8} color="#00D084" />
                  <Text style={styles.resourceText}>{metric}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.detailSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="alert-circle" size={24} color="#FFA726" />
              <Text style={styles.sectionTitle}>Potential Challenges</Text>
            </View>
            {actionPlan.challenges?.map((item, index) => (
              <View key={index} style={styles.challengeItem}>
                <Text style={styles.challengeTitle}>• {item.challenge || item}</Text>
                {item.solution && (
                  <Text style={styles.challengeSolution}>→ {item.solution}</Text>
                )}
              </View>
            ))}
          </View>
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

  useEffect(() => {
    if (isFocused) {
      loadSaved();
    }
  }, [isFocused, refreshTrigger]);

  const loadSaved = async () => {
    try {
      console.log('Loading saved opportunities...');
      const saved = await getSavedOpportunities();
      console.log('Saved opportunities:', saved);
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
      setSavedOpportunities(savedOpportunities.filter(s => s.id !== opportunityId));
      triggerRefresh(); // Notify Feed tab to refresh
      console.log('Deleted successfully');
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return '#00D084';
    if (score >= 75) return '#4ECDC4';
    return '#FFA726';
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#6C5CE7" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.feedHeader}>
        <Text style={styles.feedTitle}>Saved Opportunities</Text>
        <Text style={styles.savedCount}>{savedOpportunities.length} saved</Text>
      </View>

      {savedOpportunities.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="bookmark-outline" size={80} color="#B2BEC3" />
          <Text style={styles.emptyTitle}>No saved opportunities</Text>
          <Text style={styles.emptyText}>
            Start saving opportunities from the feed to track them here
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.feedScroll}>
          {savedOpportunities.map((item) => (
            <View key={item.id} style={styles.savedCard}>
              <View style={styles.savedCardHeader}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(item.score) }]}>
                  <Text style={styles.scoreBadgeText}>{item.score}</Text>
                </View>
              </View>

              <View style={styles.savedCardMeta}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{item.category}</Text>
                </View>
                <Text style={styles.savedDate}>
                  Saved {new Date(item.saved_at).toLocaleDateString()}
                </Text>
              </View>

              <View style={styles.savedCardActions}>
                <TouchableOpacity style={styles.primaryButtonSmall}>
                  <Text style={styles.primaryButtonTextSmall}>View Details</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => handleDelete(item.id)}
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
}

// ============================================
// PROFILE SCREEN
// ============================================
function ProfileScreen() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const userProfile = await getUserProfile();
      setProfile(userProfile);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.reload(); // Reload to restart app
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#6C5CE7" />
      </SafeAreaView>
    );
  }

  const interestLabels = {
    social: 'Social Media',
    hobbies: 'Hobbies',
    business: 'Side Hustles',
    stocks: 'Stocks & Crypto',
  };

  const skillLabels = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    expert: 'Expert',
  };

  const timeLabels = {
    casual: '1-5 hrs/week',
    serious: '5-15 hrs/week',
    fulltime: '15+ hrs/week',
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.profileContent}>
        <View style={styles.profileHeader}>
          <View style={styles.profileAvatar}>
            <Ionicons name="person" size={40} color="#FFF" />
          </View>
          <Text style={styles.profileEmail}>{profile?.email || 'Anonymous User'}</Text>
        </View>

        <View style={styles.profileSection}>
          <Text style={styles.profileSectionTitle}>Interests</Text>
          <View style={styles.profileTags}>
            {profile?.interests?.map((interest) => (
              <View key={interest} style={styles.profileTag}>
                <Text style={styles.profileTagText}>{interestLabels[interest]}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.profileSection}>
          <Text style={styles.profileSectionTitle}>Experience Level</Text>
          <Text style={styles.profileValue}>{skillLabels[profile?.skill_level]}</Text>
        </View>

        <View style={styles.profileSection}>
          <Text style={styles.profileSectionTitle}>Time Commitment</Text>
          <Text style={styles.profileValue}>{timeLabels[profile?.time_available]}</Text>
        </View>

        <View style={styles.profileSection}>
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="notifications-outline" size={24} color="#2D3436" />
            <Text style={styles.settingText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={24} color="#B2BEC3" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="settings-outline" size={24} color="#2D3436" />
            <Text style={styles.settingText}>Preferences</Text>
            <Ionicons name="chevron-forward" size={24} color="#B2BEC3" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="help-circle-outline" size={24} color="#2D3436" />
            <Text style={styles.settingText}>Help & Support</Text>
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
// MAIN TAB NAVIGATOR
// ============================================
function FeedStack({ userProfile }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FeedMain">
        {(props) => <OpportunitiesFeed {...props} userProfile={userProfile} />}
      </Stack.Screen>
      <Stack.Screen name="OpportunityDetail" component={OpportunityDetailScreen} />
    </Stack.Navigator>
  );
}

function MainTabs({ userProfile }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <SavedContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'Feed') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Saved') {
              iconName = focused ? 'bookmark' : 'bookmark-outline';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person' : 'person-outline';
            }
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#6C5CE7',
          tabBarInactiveTintColor: '#8E8E93',
          headerShown: false,
          tabBarStyle: {
            borderTopWidth: 1,
            borderTopColor: '#E0E0E0',
            paddingTop: 8,
            paddingBottom: 8,
            height: 60,
          },
        })}
      >
        <Tab.Screen name="Feed">
          {(props) => <FeedStack {...props} userProfile={userProfile} />}
        </Tab.Screen>
        <Tab.Screen name="Saved" component={SavedScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </SavedContext.Provider>
  );
}

function InterestSelectionScreen({ onNext }) {
  const [selectedInterests, setSelectedInterests] = useState([]);

  const interests = [
    { id: 'social', name: 'Social Media', icon: 'logo-instagram', color: '#E1306C' },
    { id: 'hobbies', name: 'Hobbies', icon: 'fitness', color: '#FF6B6B' },
    { id: 'business', name: 'Side Hustles', icon: 'briefcase', color: '#4ECDC4' },
    { id: 'stocks', name: 'Stocks & Crypto', icon: 'trending-up', color: '#95E1D3' },
  ];

  const toggleInterest = (id) => {
    if (selectedInterests.includes(id)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== id));
    } else {
      setSelectedInterests([...selectedInterests, id]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.onboardingContent}>
        <Text style={styles.onboardingTitle}>What interests you?</Text>
        <Text style={styles.onboardingSubtitle}>
          Select all that apply - we will personalize your feed
        </Text>

        <View style={styles.interestGrid}>
          {interests.map((interest) => {
            const isSelected = selectedInterests.includes(interest.id);
            return (
              <TouchableOpacity
                key={interest.id}
                style={[
                  styles.interestCard,
                  isSelected && { backgroundColor: interest.color, borderColor: interest.color },
                ]}
                onPress={() => toggleInterest(interest.id)}
              >
                <Ionicons
                  name={interest.icon}
                  size={40}
                  color={isSelected ? '#FFF' : interest.color}
                />
                <Text style={[styles.interestText, isSelected && styles.interestTextSelected]}>
                  {interest.name}
                </Text>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={24} color="#FFF" style={styles.checkmark} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, selectedInterests.length === 0 && styles.buttonDisabled]}
          onPress={() => onNext(selectedInterests)}
          disabled={selectedInterests.length === 0}
        >
          <Text style={styles.primaryButtonText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function SkillLevelScreen({ onNext, userProfile }) {
  const [skillLevel, setSkillLevel] = useState(null);
  const [timeAvailable, setTimeAvailable] = useState(null);
  const [saving, setSaving] = useState(false);

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
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.onboardingContent}>
        <Text style={styles.onboardingTitle}>Tell us about yourself</Text>
        <Text style={styles.onboardingSubtitle}>
          This helps us match opportunities to your level
        </Text>

        <Text style={styles.sectionLabel}>Your skill level</Text>
        {skillLevels.map((level) => (
          <TouchableOpacity
            key={level.id}
            style={[styles.optionCard, skillLevel === level.id && styles.optionCardSelected]}
            onPress={() => setSkillLevel(level.id)}
          >
            <View style={styles.optionContent}>
              <Text style={[styles.optionLabel, skillLevel === level.id && styles.optionLabelSelected]}>
                {level.label}
              </Text>
              <Text style={styles.optionDesc}>{level.desc}</Text>
            </View>
            {skillLevel === level.id && <Ionicons name="checkmark-circle" size={24} color="#6C5CE7" />}
          </TouchableOpacity>
        ))}

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Time you can commit</Text>
        {timeOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[styles.optionCard, timeAvailable === option.id && styles.optionCardSelected]}
            onPress={() => setTimeAvailable(option.id)}
          >
            <View style={styles.optionContent}>
              <Text style={[styles.optionLabel, timeAvailable === option.id && styles.optionLabelSelected]}>
                {option.label}
              </Text>
              <Text style={styles.optionDesc}>{option.desc}</Text>
            </View>
            {timeAvailable === option.id && <Ionicons name="checkmark-circle" size={24} color="#6C5CE7" />}
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.primaryButton, (!skillLevel || !timeAvailable) && styles.buttonDisabled]}
          onPress={handleComplete}
          disabled={!skillLevel || !timeAvailable || saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Complete Setup</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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

  useEffect(() => {
    loadSavedOpportunities();
  }, [refreshTrigger]);

  useEffect(() => {
    // Load initial opportunities
    loadInitialOpportunities();
  }, []);

  const loadInitialOpportunities = async () => {
    setLoading(true);
    try {
      // Generate opportunities for first interest category
      const firstInterest = userProfile?.interests?.[0] || 'social';
      const aiOpportunities = await generateOpportunities(firstInterest, userProfile);
      setOpportunities(aiOpportunities);
    } catch (error) {
      console.error('Error loading initial opportunities:', error);
      // Fallback to mock data if AI fails
      setOpportunities(getMockOpportunities());
    } finally {
      setLoading(false);
    }
  };

  const loadOpportunitiesForCategory = async (category) => {
    if (category === 'all') return;
    
    setGeneratingCategory(category);
    try {
      // Check if we have cached opportunities first
      const { data: cached, error } = await supabase
        .from('opportunities_cache')
        .select('*')
        .eq('category', category)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(3);

      if (cached && cached.length > 0 && !error) {
        console.log('Using cached opportunities for', category);
        // Use cached opportunities
        const cachedOpps = cached.map(c => ({
          id: c.id,
          category: c.category,
          title: c.title,
          description: c.description,
          trend: c.trend,
          competition: c.competition,
          potential: c.potential,
          timeframe: c.timeframe,
          tags: c.tags,
          score: c.score,
        }));
        setOpportunities(prev => [
          ...prev.filter(o => o.category !== category),
          ...cachedOpps
        ]);
      } else {
        // Generate new opportunities with AI
        console.log('Generating new opportunities for', category);
        const aiOpportunities = await generateOpportunities(category, userProfile);
        
        // Cache them in Supabase (expires in 24 hours)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);
        
        for (const opp of aiOpportunities) {
          await supabase.from('opportunities_cache').insert({
            category: opp.category,
            title: opp.title,
            description: opp.description,
            trend: opp.trend,
            competition: opp.competition,
            potential: opp.potential,
            timeframe: opp.timeframe,
            tags: opp.tags,
            score: opp.score,
            expires_at: expiresAt.toISOString(),
          });
        }
        
        setOpportunities(prev => [
          ...prev.filter(o => o.category !== category),
          ...aiOpportunities
        ]);
      }
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
      // Check if we already have opportunities for this category
      const hasOpportunities = opportunities.some(o => o.category === categoryId);
      if (!hasOpportunities) {
        loadOpportunitiesForCategory(categoryId);
      }
    }
  };

  const loadSavedOpportunities = async () => {
    try {
      const saved = await getSavedOpportunities();
      const ids = saved.map(s => s.opportunity_id);
      setSavedOpportunityIds(ids);
    } catch (error) {
      console.error('Error loading saved opportunities:', error);
    }
  };

  const handleSaveOpportunity = async (opportunity) => {
    try {
      await saveOpportunity(opportunity);
      setSavedOpportunityIds([...savedOpportunityIds, opportunity.id.toString()]);
      triggerRefresh(); // Notify Saved tab to refresh
      console.log('Saved! Opportunity saved to your collection');
    } catch (error) {
      console.error('Error saving opportunity:', error);
      console.log('Error: Failed to save opportunity');
    }
  };

  const isOpportunitySaved = (opportunityId) => {
    return savedOpportunityIds.includes(opportunityId.toString());
  };

  // Fallback mock data
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

  const filteredOpportunities =
    activeCategory === 'all'
      ? opportunities
      : opportunities.filter((opp) => opp.category === activeCategory);

  const getScoreColor = (score) => {
    if (score >= 90) return '#00D084';
    if (score >= 75) return '#4ECDC4';
    return '#FFA726';
  };

  if (loading && opportunities.length === 0) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#6C5CE7" />
        <Text style={styles.loadingText}>Generating personalized opportunities...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.feedHeader}>
        <Text style={styles.feedTitle}>Opportunities</Text>
        <TouchableOpacity>
          <Ionicons name="search" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.categoryChip, activeCategory === cat.id && styles.categoryChipActive]}
            onPress={() => handleCategoryChange(cat.id)}
          >
            {generatingCategory === cat.id ? (
              <ActivityIndicator size="small" color={activeCategory === cat.id ? '#FFF' : '#6C5CE7'} />
            ) : (
              <Ionicons
                name={cat.icon}
                size={18}
                color={activeCategory === cat.id ? '#FFF' : '#666'}
              />
            )}
            <Text
              style={[styles.categoryChipText, activeCategory === cat.id && styles.categoryChipTextActive]}
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.feedScroll}>
        {filteredOpportunities.length === 0 && !loading ? (
          <View style={styles.emptyState}>
            <Ionicons name="search" size={80} color="#B2BEC3" />
            <Text style={styles.emptyTitle}>No opportunities yet</Text>
            <Text style={styles.emptyText}>
              Tap a category above to generate AI-powered opportunities
            </Text>
          </View>
        ) : (
          filteredOpportunities.map((opp) => (
          <View key={opp.id} style={styles.opportunityCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardTitle}>{opp.title}</Text>
                <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(opp.score) }]}>
                  <Text style={styles.scoreBadgeText}>{opp.score}</Text>
                </View>
              </View>
              <View style={styles.trendBadge}>
                <Ionicons name="trending-up" size={14} color="#6C5CE7" />
                <Text style={styles.trendText}>{opp.trend}</Text>
              </View>
            </View>

            <Text style={styles.cardDescription}>{opp.description}</Text>

            <View style={styles.cardMetrics}>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Competition</Text>
                <Text style={styles.metricValue}>{opp.competition}</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Potential</Text>
                <Text style={styles.metricValue}>{opp.potential}</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Timeframe</Text>
                <Text style={styles.metricValue}>{opp.timeframe}</Text>
              </View>
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
                style={[
                  styles.secondaryButton,
                  isOpportunitySaved(opp.id) && styles.savedButton
                ]}
                onPress={() => handleSaveOpportunity(opp)}
                disabled={isOpportunitySaved(opp.id)}
              >
                <Ionicons 
                  name={isOpportunitySaved(opp.id) ? 'bookmark' : 'bookmark-outline'} 
                  size={20} 
                  color={isOpportunitySaved(opp.id) ? '#FFF' : '#6C5CE7'} 
                />
                <Text style={[
                  styles.secondaryButtonText,
                  isOpportunitySaved(opp.id) && styles.savedButtonText
                ]}>
                  {isOpportunitySaved(opp.id) ? 'Saved' : 'Save'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.primaryButtonSmall}
                onPress={() => navigation.navigate('OpportunityDetail', { opportunity: opp, userProfile })}
              >
                <Text style={styles.primaryButtonTextSmall}>View Details</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================
// MAIN APP NAVIGATION
// ============================================
export default function App() {
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      // Sign in anonymously for demo purposes
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        await supabase.auth.signInAnonymously();
      }

      // Check if user has completed onboarding
      try {
        const profile = await getUserProfile();
        if (profile && profile.interests) {
          setUserProfile(profile);
          setOnboardingStep(3); // Skip to feed
        }
      } catch (error) {
        // No profile yet, show onboarding
        console.log('No profile found, starting onboarding');
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWelcomeNext = () => setOnboardingStep(1);
  
  const handleInterestsNext = (interests) => {
    setUserProfile({ ...userProfile, interests });
    setOnboardingStep(2);
  };
  
  const handleSkillNext = (data) => {
    setUserProfile({ ...userProfile, ...data });
    setOnboardingStep(3);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#6C5CE7" />
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (onboardingStep === 0) {
    return <WelcomeScreen onNext={handleWelcomeNext} />;
  }

  if (onboardingStep === 1) {
    return <InterestSelectionScreen onNext={handleInterestsNext} />;
  }

  if (onboardingStep === 2) {
    return <SkillLevelScreen onNext={handleSkillNext} userProfile={userProfile} />;
  }

  return (
    <NavigationContainer>
      <MainTabs userProfile={userProfile} />
    </NavigationContainer>
  );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  // Welcome Screen
  welcomeContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 24,
    color: '#2D3436',
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: '#6C5CE7',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  welcomeDescription: {
    fontSize: 16,
    color: '#636E72',
    marginTop: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  featureList: {
    marginTop: 40,
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureText: {
    fontSize: 16,
    marginLeft: 12,
    color: '#2D3436',
  },
  // Onboarding
  onboardingContent: {
    padding: 24,
  },
  onboardingTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 8,
  },
  onboardingSubtitle: {
    fontSize: 16,
    color: '#636E72',
    marginBottom: 32,
  },
  interestGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  interestCard: {
    width: (width - 64) / 2,
    aspectRatio: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  interestText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
    color: '#2D3436',
  },
  interestTextSelected: {
    color: '#FFF',
  },
  checkmark: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 16,
  },
  optionCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  optionCardSelected: {
    borderColor: '#6C5CE7',
    backgroundColor: '#F5F3FF',
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
  },
  optionLabelSelected: {
    color: '#6C5CE7',
  },
  optionDesc: {
    fontSize: 14,
    color: '#636E72',
    marginTop: 4,
  },
  // Feed
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFF',
  },
  feedTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D3436',
  },
  categoryScroll: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#6C5CE7',
  },
  categoryChipText: {
    fontSize: 14,
    marginLeft: 6,
    color: '#666',
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: '#FFF',
  },
  feedScroll: {
    flex: 1,
  },
  opportunityCard: {
    backgroundColor: '#FFF',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3436',
    flex: 1,
    marginRight: 12,
  },
  scoreBBadge: {
    backgroundColor: '#00D084',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  scoreBadgeText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 14,
    color: '#6C5CE7',
    fontWeight: '600',
    marginLeft: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#636E72',
    marginBottom: 16,
    lineHeight: 20,
  },
  cardMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  metric: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#B2BEC3',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3436',
  },
  cardTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#E8E4FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#6C5CE7',
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  // Buttons
  primaryButton: {
    backgroundColor: '#6C5CE7',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButtonSmall: {
    backgroundColor: '#6C5CE7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryButtonTextSmall: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#6C5CE7',
  },
  secondaryButtonText: {
    color: '#6C5CE7',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  savedButton: {
    backgroundColor: '#6C5CE7',
    borderColor: '#6C5CE7',
  },
  savedButtonText: {
    color: '#FFF',
  },
  buttonDisabled: {
    backgroundColor: '#B2BEC3',
    opacity: 0.6,
  },
  scoreBadge: {
    backgroundColor: '#00D084',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
 
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#636E72',
  },
  // Saved screen styles
  savedCount: {
    fontSize: 14,
    color: '#636E72',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3436',
    marginTop: 24,
  },
  emptyText: {
    fontSize: 14,
    color: '#636E72',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  savedCard: {
    backgroundColor: '#FFF',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  savedCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  savedCardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryBadge: {
    backgroundColor: '#E8E4FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 12,
    color: '#6C5CE7',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  savedDate: {
    fontSize: 12,
    color: '#B2BEC3',
  },
  savedCardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  // Profile screen styles
  profileContent: {
    padding: 24,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6C5CE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileEmail: {
    fontSize: 16,
    color: '#636E72',
  },
  profileSection: {
    marginBottom: 24,
  },
  profileSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B2BEC3',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  profileTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  profileTag: {
    backgroundColor: '#6C5CE7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  profileTagText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  profileValue: {
    fontSize: 16,
    color: '#2D3436',
    fontWeight: '500',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: '#2D3436',
    marginLeft: 12,
  },
  signOutButton: {
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  signOutText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Detail screen styles
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  detailScroll: {
    flex: 1,
  },
  detailContent: {
    padding: 20,
  },
  detailTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 16,
  },
  detailMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  detailDescription: {
    fontSize: 16,
    color: '#636E72',
    lineHeight: 24,
    marginBottom: 24,
  },
  detailMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  detailMetric: {
    alignItems: 'center',
  },
  detailMetricLabel: {
    fontSize: 12,
    color: '#B2BEC3',
    marginBottom: 4,
  },
  detailMetricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
  },
  detailSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3436',
    marginLeft: 12,
  },
  sectionText: {
    fontSize: 16,
    color: '#636E72',
    lineHeight: 24,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6C5CE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    color: '#2D3436',
    lineHeight: 24,
  },
  resourceList: {
    marginTop: 8,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  resourceText: {
    fontSize: 16,
    color: '#2D3436',
    marginLeft: 12,
  },
  challengeItem: {
    marginBottom: 16,
  },
  challengeTitle: {
    fontSize: 16,
    color: '#2D3436',
    fontWeight: '600',
    marginBottom: 4,
  },
  challengeSolution: {
    fontSize: 14,
    color: '#636E72',
    marginLeft: 16,
    lineHeight: 20,
  },
});