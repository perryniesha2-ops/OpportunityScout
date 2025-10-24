// src/screens/WelcomeScreen.tsx
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { LOGO_DARK } from '../branding';
import GradientButton from '../components/GradientButton';
import LegalLinks from '../components/LegalLinks';
import { BRAND, useTheme } from '../theme';

const TEASERS = [
  '🔮 Predict trending hobbies',
  '💼 Spot new business ideas',
  '📈 Track upcoming stocks',
  '📱 Discover social trends',
];

type Props = { onNext: () => void };
type AnimVal = Animated.Value;


export default function WelcomeScreen({ onNext }: Props) {
  const { colors } = useTheme();

  // staged reveal
  const bgOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.92)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  // slow drifting glows
  const glow1X = useRef(new Animated.Value(0)).current;
  const glow1Y = useRef(new Animated.Value(0)).current;
  const glow2X = useRef(new Animated.Value(0)).current;
  const glow2Y = useRef(new Animated.Value(0)).current;

  // rotating teaser
  const [teaserIndex, setTeaserIndex] = useState(0);
  const teaserOpacity = useRef(new Animated.Value(1)).current;
const rotateTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    // intro sequence
    Animated.sequence([
      Animated.timing(bgOpacity, { toValue: 1, duration: 450, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(logoScale, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.timing(textOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(buttonOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();

    // drifting glow loops
   const drift = (val: AnimVal, to: number) =>
  Animated.loop(
    Animated.sequence([
      Animated.timing(val, { toValue: to, duration: 7000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(val, { toValue: -to, duration: 7000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ])
  ).start();
  
    drift(glow1X, 10); drift(glow1Y, 8);
    drift(glow2X, 12); drift(glow2Y, 9);

    // rotating teaser loop (no Reanimated)
    mountedRef.current = true;

    const rotate = () => {
      Animated.timing(teaserOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished || !mountedRef.current) return;
        setTeaserIndex((i) => (i + 1) % TEASERS.length);
        Animated.timing(teaserOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }).start(({ finished: fin }) => {
          if (!fin || !mountedRef.current) return;
          rotateTimeout.current = setTimeout(rotate, 2300);
        });
      });
    };

    rotateTimeout.current = setTimeout(rotate, 2300);

    return () => {
      mountedRef.current = false;
      if (rotateTimeout.current) clearTimeout(rotateTimeout.current);
    };
  }, []);

  const ui = useMemo(() => ({
    title: { color: colors.text }, sub: { color: colors.secondaryText },
    bg: { backgroundColor: colors.background },
  }), [colors]);

  return (
    <View style={[styles.root, ui.bg]}>
      {/* Layered animated background */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: bgOpacity }]}>
        {/* base sweep */}
        <LinearGradient
          colors={['#0B1120', '#020617']}
          start={{ x: 0.1, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* magenta glow (left) */}
        <Animated.View
          style={{
            position: 'absolute', left: '18%', top: '20%', width: 280, height: 280,
            transform: [{ translateX: glow1X }, { translateY: glow1Y }],
          }}
        >
          <LinearGradient
            colors={['rgba(168,85,247,0.35)', 'transparent']}
            start={{ x: 0.3, y: 0.3 }} end={{ x: 0.9, y: 0.9 }}
            style={styles.blob}
          />
        </Animated.View>
        {/* cyan glow (right) */}
        <Animated.View
          style={{
            position: 'absolute', right: '14%', top: '12%', width: 300, height: 300,
            transform: [{ translateX: glow2X }, { translateY: glow2Y }],
          }}
        >
          <LinearGradient
            colors={['rgba(34,211,238,0.28)', 'transparent']}
            start={{ x: 0.2, y: 0.2 }} end={{ x: 0.9, y: 0.9 }}
            style={styles.blob}
          />
        </Animated.View>
        {/* subtle vignette */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.35)']}
          start={{ x: 0.5, y: 0.3 }} end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Content */}
      <View style={styles.center}>
        {/* halo puck behind logo for perfect blend */}
        <LinearGradient
          colors={[BRAND.primary, BRAND.success]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.logoHalo}
        />
        <Animated.Image
          source={LOGO_DARK}
          style={[
            styles.logo,
            { opacity: logoOpacity, transform: [{ scale: logoScale }] },
          ]}
          resizeMode="contain"
        />
        <Animated.Text style={[styles.title, ui.title, { opacity: textOpacity }]}>
          Scouta
        </Animated.Text>
        <Animated.Text style={[styles.subtitle, ui.sub, { opacity: textOpacity }]}>
          Find What’s Next
        </Animated.Text>

        {/* rotating teaser */}
        <Animated.Text style={[styles.teaser, { opacity: teaserOpacity, color: colors.secondaryText }]}>
          {TEASERS[teaserIndex]}
        </Animated.Text>

        <Animated.View style={{ opacity: buttonOpacity, width: '80%', maxWidth: 360 }}>
          <GradientButton
            onPress={onNext}
            gradient={[BRAND.primary, BRAND.success]}
            style={{ marginTop: 18 }}
          >
            Start Exploring
          </GradientButton>
        </Animated.View>

        <Text style={[styles.footer, { color: colors.secondaryText, opacity: 0.6 }]}>
          Powered by Scouta AI • Beta
        </Text>
        
      </View>
       <LegalLinks />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  logo: { width: 220, height: 220, borderRadius: 24 },
  logoHalo: {
    position: 'absolute',
    width: 260, height: 260, borderRadius: 200,
    top: '32%',
    opacity: 0.35,
    // @ts-ignore: web-only style; RN native ignores it
    filter: 'blur(40px)',
  },
  // @ts-ignore: web-only style; RN native ignores it
  blob: { flex: 1, borderRadius: 300, filter: 'blur(40px)' },
  title: { marginTop: 6, fontSize: 42, fontWeight: '800', letterSpacing: 0.5 },
  subtitle: { marginTop: 4, fontSize: 16 },
  teaser: { marginTop: 12, fontSize: 14 },
  footer: { marginTop: 28, fontSize: 12 },
});
