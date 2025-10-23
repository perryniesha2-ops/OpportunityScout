// src/navigation/AppNavigator.tsx
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';

import AuthScreen from '../screens/AuthScreen';
import InterestSelectionScreen from '../screens/InterestSelectionScreen';
import OpportunitiesFeed from '../screens/OpportunitiesFeed';
import OpportunityDetailScreen from '../screens/OpportunityDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SavedScreen from '../screens/SavedScreen';
import SkillLevelScreen from '../screens/SkillLevelScreen';
import WelcomeScreen from '../screens/WelcomeScreen';

import { getUserProfile } from '../services/supabase';
import { useTheme } from '../theme';
import { SCOUTA } from '../theme/tokens';
import type { FeedStackParamList, SavedStackParamList } from '../types/navigation';

const Root = createNativeStackNavigator();
const FeedStackNav = createNativeStackNavigator<FeedStackParamList>();
const SavedStackNav = createNativeStackNavigator<SavedStackParamList>();
const Tab = createBottomTabNavigator();

function FeedStack({ userProfile }: { userProfile: any }) {
  return (
    <FeedStackNav.Navigator screenOptions={{ headerShown: false }}>
      <FeedStackNav.Screen name="FeedMain">
        {screenProps => (
          <OpportunitiesFeed
            {...screenProps}          // navigation, route, etc.
            userProfile={userProfile}  // extra prop
          />
        )}
      </FeedStackNav.Screen>
      <FeedStackNav.Screen name="OpportunityDetail" component={OpportunityDetailScreen} />
    </FeedStackNav.Navigator>
  );
}

// 👇 Saved gets its OWN stack that ALSO contains OpportunityDetail
function SavedStack() {
  return (
    <SavedStackNav.Navigator screenOptions={{ headerShown: false }}>
      <SavedStackNav.Screen name="SavedMain" component={SavedScreen} />
      <SavedStackNav.Screen name="OpportunityDetail" component={OpportunityDetailScreen} />
    </SavedStackNav.Navigator>
  );
}

function MainTabs({ userProfile }: { userProfile: any }) {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: SCOUTA.primary,
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingTop: 6,
          paddingBottom: 8,
          height: 60,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';
          if (route.name === 'Feed 🐶') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Saved') iconName = focused ? 'bookmark' : 'bookmark-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Feed 🐶">{p => <FeedStack {...p} userProfile={userProfile} />}</Tab.Screen>
      <Tab.Screen name="Saved" component={SavedStack} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator({ session }: { session: any }) {
  const [route, setRoute] = useState<'welcome' | 'auth' | 'onboarding1' | 'onboarding2' | 'app'>('welcome');
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    (async () => {
      if (!session) {
        setRoute('welcome');
        return;
      }
      const profile = await getUserProfile().catch(() => null);
      setUserProfile(profile);
      setRoute(profile?.interests?.length ? 'app' : 'onboarding1');
    })();
  }, [session]);

  const goAuth = () => setRoute('auth');
  const onAuthSuccess = async () => {
    const profile = await getUserProfile().catch(() => null);
    setUserProfile(profile);
    setRoute(profile?.interests?.length ? 'app' : 'onboarding1');
  };
  const onInterestsNext = (interests: string[]) => {
    setUserProfile((prev: any) => ({ ...(prev || {}), interests }));
    setRoute('onboarding2');
  };
  const onSkillNext = (data: any) => {
    setUserProfile((prev: any) => ({ ...(prev || {}), ...data }));
    setRoute('app');
  };

  return (
    <Root.Navigator screenOptions={{ headerShown: false }}>
      {route === 'welcome' && (
        <Root.Screen name="Welcome">{() => <WelcomeScreen onNext={goAuth} />}</Root.Screen>
      )}
      {route === 'auth' && (
        <Root.Screen name="Auth">{() => <AuthScreen onSuccess={onAuthSuccess} />}</Root.Screen>
      )}
      {route === 'onboarding1' && (
        <Root.Screen name="Onboarding1">
          {() => <InterestSelectionScreen onNext={onInterestsNext} />}
        </Root.Screen>
      )}
      {route === 'onboarding2' && (
        <Root.Screen name="Onboarding2">
          {() => <SkillLevelScreen onNext={onSkillNext} userProfile={userProfile} />}
        </Root.Screen>
      )}
      {route === 'app' && (
        <Root.Screen name="MainApp">{() => <MainTabs userProfile={userProfile} />}</Root.Screen>
      )}
    </Root.Navigator>
  );
}
