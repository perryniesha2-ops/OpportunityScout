import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Alert, Appearance, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { saveUserProfile } from '../services/supabase';

type Props = {
  onNext: (data: { skillLevel: 'beginner'|'intermediate'|'expert'; timeAvailable: 'casual'|'serious'|'fulltime' }) => void;
  userProfile: any;
};

const SCOUTA = { grad: ['#7C5CFF', '#00E5FF', '#FF5CA8'], primary: '#7C5CFF' };
const lightColors = { background: '#F8F9FA', card: '#FFFFFF', text: '#2D3436', secondaryText: '#636E72', border: '#E0E0E0' };
const darkColors = { background: '#0F111A', card: '#1A1C28', text: '#FFFFFF', secondaryText: '#B2BEC3', border: '#2A2E3C' };
const useLocalTheme = () => {
  const isDark = Appearance.getColorScheme() === 'dark';
  return { isDark, colors: isDark ? darkColors : lightColors };
};

const GradientButton: React.FC<React.ComponentProps<typeof TouchableOpacity>> = ({ children, style, ...props }) => (
  <TouchableOpacity activeOpacity={0.9} {...props}>
    <LinearGradient colors={['#7C5CFF', '#00E5FF', '#FF5CA8'] as const} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.gButton, style]}>
      <Text style={styles.gButtonText}>{children}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

const SkillLevelScreen: React.FC<Props> = ({ onNext, userProfile }) => {
  const { isDark, colors } = useLocalTheme();
  const [skillLevel, setSkillLevel] = useState<'beginner'|'intermediate'|'expert'|null>(null);
  const [timeAvailable, setTimeAvailable] = useState<'casual'|'serious'|'fulltime'|null>(null);
  const [saving, setSaving] = useState(false);

  const skillLevels = [
    { id: 'beginner', label: 'Beginner', desc: 'Just starting out' },
    { id: 'intermediate', label: 'Intermediate', desc: 'Some experience' },
    { id: 'expert', label: 'Expert', desc: 'Experienced pro' },
  ] as const;

  const timeOptions = [
    { id: 'casual', label: '1-5 hrs/week', desc: 'Casual explorer' },
    { id: 'serious', label: '5-15 hrs/week', desc: 'Serious pursuer' },
    { id: 'fulltime', label: '15+ hrs/week', desc: 'All-in commitment' },
  ] as const;

  const handleComplete = async () => {
    if (!skillLevel || !timeAvailable) return;
    setSaving(true);
    try {
      const payload = { interests: userProfile?.interests ?? [], skill_level: skillLevel, time_available: timeAvailable };
      await saveUserProfile(payload);
      onNext({ skillLevel, timeAvailable });
    } catch (e) {
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Tell us about yourself</Text>
        <Text style={{ color: colors.secondaryText, marginBottom: 28 }}>This helps us match opportunities to your level</Text>

        <Text style={[styles.sectionLabel, { color: colors.text }]}>Your skill level</Text>
        {skillLevels.map((level) => {
          const active = skillLevel === level.id;
          return (
            <TouchableOpacity
              key={level.id}
              onPress={() => setSkillLevel(level.id)}
              style={[
                styles.option,
                { backgroundColor: colors.card, borderColor: colors.border },
                active && { borderColor: SCOUTA.primary, backgroundColor: '#F5F3FF' },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionLabel, { color: active ? SCOUTA.primary : colors.text }]}>{level.label}</Text>
                <Text style={{ color: colors.secondaryText }}>{level.desc}</Text>
              </View>
              {active && <Ionicons name="checkmark-circle" size={24} color={SCOUTA.primary} />}
            </TouchableOpacity>
          );
        })}

        <Text style={[styles.sectionLabel, { color: colors.text, marginTop: 24 }]}>Time you can commit</Text>
        {timeOptions.map((opt) => {
          const active = timeAvailable === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              onPress={() => setTimeAvailable(opt.id)}
              style={[
                styles.option,
                { backgroundColor: colors.card, borderColor: colors.border },
                active && { borderColor: SCOUTA.primary, backgroundColor: '#F5F3FF' },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionLabel, { color: active ? SCOUTA.primary : colors.text }]}>{opt.label}</Text>
                <Text style={{ color: colors.secondaryText }}>{opt.desc}</Text>
              </View>
              {active && <Ionicons name="checkmark-circle" size={24} color={SCOUTA.primary} />}
            </TouchableOpacity>
          );
        })}

        <GradientButton onPress={handleComplete} disabled={!skillLevel || !timeAvailable || saving}>
          {saving ? 'Saving…' : 'Complete Setup'}
        </GradientButton>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SkillLevelScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 8 },
  sectionLabel: { fontSize: 18, fontWeight: '800', marginBottom: 14 },
  option: { borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 2 },
  optionLabel: { fontSize: 16, fontWeight: '800' },
  gButton: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  gButtonText: { color: '#FFF', fontWeight: '800' },
});
