import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Appearance, Dimensions, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

type Props = { onNext: (interests: string[]) => void };
const SCOUTA = { grad: ['#7C5CFF', '#00E5FF', '#FF5CA8'] };
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

const InterestSelectionScreen: React.FC<Props> = ({ onNext }) => {
  const [selected, setSelected] = useState<string[]>([]);
  const { isDark, colors } = useLocalTheme();

  const interests = [
    { id: 'social', name: 'Social Media', icon: 'logo-instagram', color: '#E1306C' },
    { id: 'hobbies', name: 'Hobbies', icon: 'fitness', color: '#FF6B6B' },
    { id: 'business', name: 'Side Hustles', icon: 'briefcase', color: '#4ECDC4' },
    { id: 'stocks', name: 'Stocks & Crypto', icon: 'trending-up', color: '#95E1D3' },
  ];

  const toggle = (id: string) => setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>What interests you?</Text>
        <Text style={{ color: colors.secondaryText, marginBottom: 28 }}>Select all that apply — we’ll personalize your feed</Text>

        <View style={styles.grid}>
          {interests.map((i) => {
            const active = selected.includes(i.id);
            return (
              <TouchableOpacity
                key={i.id}
                onPress={() => toggle(i.id)}
                activeOpacity={0.9}
                style={[
                  styles.card,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  active && { backgroundColor: i.color, borderColor: i.color },
                ]}
              >
                <Ionicons name={i.icon as any} size={40} color={active ? '#FFF' : i.color} />
                <Text style={[styles.cardLabel, { color: active ? '#FFF' : colors.text }]}>{i.name}</Text>
                {active && <Ionicons name="checkmark-circle" size={24} color="#FFF" style={styles.check} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <GradientButton onPress={() => onNext(selected)} disabled={selected.length === 0}>
          Continue
        </GradientButton>
      </ScrollView>
    </SafeAreaView>
  );
};

export default InterestSelectionScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 28 },
  card: { width: (width - 64) / 2, aspectRatio: 1, borderRadius: 16, padding: 20, marginBottom: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  cardLabel: { fontSize: 14, fontWeight: '700', marginTop: 12, textAlign: 'center' },
  check: { position: 'absolute', top: 12, right: 12 },
  gButton: { paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  gButtonText: { color: '#FFF', fontWeight: '800' },
});
