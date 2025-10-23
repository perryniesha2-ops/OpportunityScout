// src/components/SignOutButton.tsx
import React, { useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { supabase } from '../services/supabase';

type Props = {
  title?: string;
  style?: ViewStyle;
  onAfterSignOut?: () => void; // optional: extra cleanup if you ever need it
};

const SignOutButton: React.FC<Props> = ({ title = 'Sign Out', style, onAfterSignOut }) => {
  const [busy, setBusy] = useState(false);

  const handleSignOut = async () => {
    try {
      setBusy(true);
      await supabase.auth.signOut();   // kills session across tabs/devices
      onAfterSignOut?.();

      // On web, refresh to clear any in-memory state
      if (typeof window !== 'undefined') window.location.reload();
    } finally {
      setBusy(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={handleSignOut}
      disabled={busy}
      style={[{ backgroundColor: '#6723a7ff', padding: 16, borderRadius: 12, alignItems: 'center' }, style]}
      activeOpacity={0.9}
    >
      {busy ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '800' }}>{title}</Text>}
    </TouchableOpacity>
  );
};

export default SignOutButton;
