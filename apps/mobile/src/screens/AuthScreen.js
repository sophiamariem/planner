import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import { signInWithGoogle, signInWithMagicLink } from '../lib/cloudTripsMobile';
import { isSupabaseConfigured } from '../lib/supabaseMobile';

export default function AuthScreen({ onAuthStarted, onToast }) {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  const handleMagicLink = async () => {
    if (!email.trim()) {
      onToast('Enter an email address.');
      return;
    }

    setSending(true);
    try {
      await signInWithMagicLink(email.trim());
      onAuthStarted();
      onToast('Magic link sent. Check your inbox.');
    } catch (error) {
      onToast(error.message || 'Could not send magic link.');
    } finally {
      setSending(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithGoogle();
      onAuthStarted();
    } catch (error) {
      onToast(error.message || 'Could not start Google sign-in.');
    }
  };

  return (
    <View style={{ gap: 12 }}>
      <Text style={{ fontSize: 30, fontWeight: '800', color: '#18181b' }}>Trip Planner Mobile</Text>
      <Text style={{ color: '#52525b' }}>Sign in to access and edit your saved trips on the go.</Text>

      {!isSupabaseConfigured && (
        <Text style={{ color: '#b45309' }}>
          Sign in is temporarily unavailable.
        </Text>
      )}

      <PrimaryButton title="Continue with Google" onPress={handleGoogle} disabled={!isSupabaseConfigured} />

      <TextInput
        placeholder="you@example.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={{
          borderWidth: 1,
          borderColor: '#d4d4d8',
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 12,
          fontSize: 16,
        }}
      />

      <PrimaryButton title={sending ? 'Sending...' : 'Send Magic Link'} onPress={handleMagicLink} disabled={sending || !isSupabaseConfigured} variant="outline" />
    </View>
  );
}
