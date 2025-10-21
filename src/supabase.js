import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = 'https://cmtydmmjylluuhrpxewy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtdHlkbW1qeWxsdXVocnB4ZXd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NTU1NjQsImV4cCI6MjA3NTMzMTU2NH0.NkGGY1f-kO5CFDhbGI1tD-h6EYAr_bq5O5vUInnnCx0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Save user profile after onboarding
export const saveUserProfile = async (profileData) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert({
      id: user.id,
      email: user.email,
      ...profileData,
      updated_at: new Date().toISOString(),
    });

  if (error) throw error;
  return data;
};

// Get user profile
export const getUserProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return data;
};

// Save an opportunity
export const saveOpportunity = async (opportunity) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('saved_opportunities')
    .insert({
      user_id: user.id,
      opportunity_id: opportunity.id.toString(),
      category: opportunity.category,
      title: opportunity.title,
      score: opportunity.score,
      status: 'saved',
    });

  if (error) throw error;
  return data;
};

// Get saved opportunities
export const getSavedOpportunities = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('saved_opportunities')
    .select('*')
    .eq('user_id', user.id)
    .order('saved_at', { ascending: false });

  if (error) throw error;
  return data;
};

// Delete saved opportunity
export const deleteSavedOpportunity = async (opportunityId) => {
  const { error } = await supabase
    .from('saved_opportunities')
    .delete()
    .eq('id', opportunityId);

  if (error) throw error;
};