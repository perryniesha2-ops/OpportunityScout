// src/screens/AuthScreen.tsx
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { LOGO_DARK } from '../branding';
import GradientButton from '../components/GradientButton';
import { supabase } from '../services/supabase';
import { BRAND, useTheme } from '../theme';

type Props = { onSuccess: () => void };

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthScreen({ onSuccess }: Props) {
  const { colors } = useTheme();

  // UI tokens
  const ui = useMemo(
    () => ({
      bg: colors.background,
      card: colors.card,
      text: colors.text,
      sub: colors.secondaryText,
      border: colors.border,
      primaryGrad: colors.background, 
      inputBg: 'rgba(255,255,255,0.03)',
      inputBorder: 'rgba(255,255,255,0.12)',
      focus: BRAND.success,
    }),
    [colors]
  );

  // state
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [focus, setFocus] = useState<'email' | 'code' | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ✨ animations
  const pulseLogo = useRef(new Animated.Value(1)).current;           // logo breathe
  const btnGlow = useRef(new Animated.Value(0.25)).current;          // CTA glow pulse

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseLogo, { toValue: 1.06, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulseLogo, { toValue: 1.0, duration: 1800, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(btnGlow, { toValue: 0.55, duration: 1600, useNativeDriver: false }),
        Animated.timing(btnGlow, { toValue: 0.25, duration: 1600, useNativeDriver: false }),
      ])
    ).start();
  }, [pulseLogo, btnGlow]);

  // Supabase auth listener (magic link path)
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_evt, session) => {
    if (session) onSuccess?.();
  });
  return () => subscription.unsubscribe();
}, [onSuccess]);


  useEffect(() => {
    if (resendIn <= 0 && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [resendIn]);

  function startResendTimer() {
    setResendIn(30);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendIn((s) => {
        const next = s - 1;
        if (next <= 0 && timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        return next;
      });
    }, 1000);
  }

  async function sendOtp() {
  const addr = email.trim();
  if (!EMAIL_REGEX.test(addr)) {
    Alert.alert('Invalid email', 'Please enter a valid email address.');
    return;
  }
  try {
    setSending(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: addr,
      options: {
        shouldCreateUser: true,
        // For native: omit redirect (use the code). For web dev, current origin works:
        emailRedirectTo: Platform.OS === 'web' ? window.location.origin + '/auth' : undefined,
      },
    });
    if (error) throw error;
    setStep('code');
    startResendTimer();
  } catch (e: any) {
    Alert.alert('Error', e?.message ?? 'Failed to send code.');
  } finally {
    setSending(false);
  }
}
 async function verifyCode() {
  const t = code.trim();
  if (t.length < 6) {
    Alert.alert('Invalid code', 'Enter the 6-digit code sent to your email.');
    return;
  }
  try {
    setVerifying(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: t,
      type: 'email', // ✅ correct for 6-digit email code
    });
    if (error) throw error;
    // Either path, the auth listener will fire; this is just immediate UX:
    if (data?.session) onSuccess?.();
  } catch (e: any) {
    Alert.alert('Verification failed', e?.message ?? 'Check your code and try again.');
  } finally {
    setVerifying(false);
  }
}

  async function resend() {
    if (resendIn > 0) return;
    await sendOtp();
  }

  const canSend = EMAIL_REGEX.test(email.trim());
  const canVerify = code.trim().length >= 6;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: ui.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* 🌈 ambient glow behind the auth card */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={styles.ambientWrap}>
          <LinearGradient
            colors={[BRAND.primary, BRAND.success]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ambientBlob}
          />
        </View>
      </View>

      {/* gradient border wrapper */}
      <View style={styles.cardBorder}>
        <LinearGradient
          colors={[BRAND.primary, BRAND.success]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardBorderInner}
        >
          {/* glass card */}
          <View style={[styles.card, { backgroundColor: ui.card, borderColor: ui.border }]}>
            <Animated.Image
              source={LOGO_DARK}
              resizeMode="contain"
              style={{ width: 88, height: 88, alignSelf: 'center', transform: [{ scale: pulseLogo }] }}
            />

            <Text style={[styles.title, { color: ui.text }]}>Sign in to Scouta</Text>
            <Text style={[styles.tagline, { color: ui.sub }]}>Your AI compass for what’s next</Text>

            <Text style={[styles.subtitle, { color: ui.sub }]}>
              We’ll email you a 6-digit code (or you can tap the magic link).
            </Text>

            {step === 'email' ? (
              <>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor="#7C7F8A"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  onFocus={() => setFocus('email')}
                  onBlur={() => setFocus(null)}
                  style={[
                    styles.input,
                    {
                      color: ui.text,
                      backgroundColor: ui.inputBg,
                      borderColor: focus === 'email' ? ui.focus : ui.inputBorder,
                      shadowColor: focus === 'email' ? BRAND.success : 'transparent',
                      shadowOpacity: focus === 'email' ? 0.35 : 0,
                      shadowRadius: focus === 'email' ? 8 : 0,
                    },
                  ]}
                  returnKeyType="go"
                  onSubmitEditing={() => (canSend ? sendOtp() : undefined)}
                />

                <Animated.View
                  style={{
                    marginTop: 14,
                    shadowColor: BRAND.success,
                    shadowOpacity: btnGlow as unknown as number,
                    shadowRadius: 24,
                    borderRadius: 999,
                  }}
                >
                  <GradientButton
                    onPress={sendOtp}
                    disabled={!canSend || sending}
                    loading={sending}
                  >
                    Send Code
                  </GradientButton>
                </Animated.View>
              </>
            ) : (
              <>
                <TextInput
                  value={code}
                  onChangeText={setCode}
                  placeholder="6-digit code"
                  placeholderTextColor="#7C7F8A"
                  keyboardType="number-pad"
                  maxLength={6}
                  onFocus={() => setFocus('code')}
                  onBlur={() => setFocus(null)}
                  style={[
                    styles.input,
                    {
                      color: ui.text,
                      backgroundColor: ui.inputBg,
                      borderColor: focus === 'code' ? ui.focus : ui.inputBorder,
                      letterSpacing: 6,
                      textAlign: 'center',
                      shadowColor: focus === 'code' ? BRAND.success : 'transparent',
                      shadowOpacity: focus === 'code' ? 0.35 : 0,
                      shadowRadius: focus === 'code' ? 8 : 0,
                    },
                  ]}
                  returnKeyType="done"
                  onSubmitEditing={() => (canVerify ? verifyCode() : undefined)}
                />

                <Animated.View
                  style={{
                    marginTop: 14,
                    shadowColor: BRAND.success,
                    shadowOpacity: btnGlow as unknown as number,
                    shadowRadius: 24,
                    borderRadius: 999,
                  }}
                >
                  <GradientButton
                    onPress={verifyCode}
                    disabled={!canVerify || verifying}
                    loading={verifying}
                  >
                    Verify & Continue
                  </GradientButton>
                </Animated.View>

                <View style={styles.resendRow}>
                  <Text style={[styles.resendText, { color: ui.sub }]}>Didn’t get it?</Text>
                  <Text
                    onPress={resend}
                    style={[
                      styles.resendLink,
                      { color: resendIn > 0 ? ui.sub : BRAND.success },
                    ]}
                  >
                    {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
                  </Text>
                </View>

                <Text onPress={() => setStep('email')} style={{ marginTop: 8, color: ui.sub, textAlign: 'center' }}>
                  Change email
                </Text>
              </>
            )}
          </View>
        </LinearGradient>
      </View>

      {/* verifying overlay */}
      {verifying && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={BRAND.success} />
          <Text style={{ color: '#fff', marginTop: 8 }}>Verifying your code…</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },

  // ambient glow behind card
  ambientWrap: {
    position: 'absolute',
    top: '36%',
    left: '50%',
    width: 360,
    height: 360,
    transform: [{ translateX: -180 }],
    opacity: 0.28,
  },
  // @ts-ignore web-only blur; native ignores it
  ambientBlob: { flex: 1, borderRadius: 360, filter: 'blur(100px)' },

  // gradient outline
  cardBorder: { width: '100%', maxWidth: 480, borderRadius: 22, padding: 1.6 },
  cardBorderInner: { borderRadius: 22, padding: 1.6 },

  // glass card
  card: {
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 8,
  },

  title: { fontSize: 22, fontWeight: '800', textAlign: 'center', marginTop: 12 },
  tagline: { fontSize: 13, textAlign: 'center', marginTop: 4, letterSpacing: 0.3 },
  subtitle: { fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 18 },

  input: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: Platform.select({ ios: 14, android: 12, default: 12 }),
    borderRadius: 14,
    borderWidth: 1,
    fontSize: 16,
  },

  resendRow: { marginTop: 14, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  resendText: { fontSize: 14 },
  resendLink: { fontSize: 14, fontWeight: '700' },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(5, 6, 23, 0.6)',
  },
});
