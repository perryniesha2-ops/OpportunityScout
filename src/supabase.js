// src/supabase.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import { CONFIG } from './config';

export const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // RN: we will handle magic-link manually
  },
});

/* ─────────────────────────────
   AUTH HELPERS
────────────────────────────── */
export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session ?? null;
};

export const onAuthChange = (callback) => {
  // returns unsubscribe fn
  const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session ?? null);
  });
  return () => sub.subscription?.unsubscribe?.();
};

export const signUpEmailPassword = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
};

export const signInEmailPassword = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const sendMagicLink = async (email, redirectTo) => {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  });
  if (error) throw error;
  return data;
};

/**
 * Pass the full URL you receive from Linking (Expo),
 * it will parse the hash and set the session.
 */
export const setSessionFromRedirect = async (url) => {
  const hash = url.split('#')[1] || '';
  const pairs = hash.split('&').map((kv) => kv.split('='));
  const params = Object.fromEntries(
    pairs.filter(([k]) => k).map(([k, v]) => [k, decodeURIComponent(v)])
  );

  const access_token = params['access_token'];
  const refresh_token = params['refresh_token'];

  if (access_token && refresh_token) {
    const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
    if (error) throw error;
    return data.session ?? null;
  }
  return null;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

/* ─────────────────────────────
   APP DATA HELPERS (safe if no session)
────────────────────────────── */

// Save user profile after onboarding
export const saveUserProfile = async (profileData) => {
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('user_profiles')
    .upsert({
      id: user.id,
      email: user.email,
      ...profileData,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Get user profile (returns null if not logged in or not found)
export const getUserProfile = async () => {
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  if (!user) return null;

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
};

// Save an opportunity
export const saveOpportunity = async (opportunity) => {
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('saved_opportunities')
    .insert({
      user_id: user.id,
      opportunity_id: opportunity.id.toString(),
      category: opportunity.category,
      title: opportunity.title,
      score: opportunity.score,
      status: 'saved',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Get saved opportunities
export const getSavedOpportunities = async () => {
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  if (!user) return [];

  const { data, error } = await supabase
    .from('saved_opportunities')
    .select('*')
    .eq('user_id', user.id)
    .order('saved_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
};

// Delete saved opportunity
export const deleteSavedOpportunity = async (id) => {
  const { error } = await supabase.from('saved_opportunities').delete().eq('id', id);
  if (error) throw error;
};
