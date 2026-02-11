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
    <View style={{ flex: 1, justifyContent: 'center', gap: 14 }}>
      <View style={{ alignItems: 'center', gap: 6 }}>
        <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 22 }}>✈︎</Text>
        </View>
        <Text style={{ fontSize: 30, fontWeight: '800', color: '#111827' }}>PLNR</Text>
        <Text style={{ color: '#6b7280', textAlign: 'center' }}>Sign in to access your saved trips and keep plans synced.</Text>
      </View>

      <View style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 20, padding: 14, backgroundColor: '#ffffff', gap: 12, shadowColor: '#0f172a', shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 2 }}>
        <Text style={{ color: '#111827', fontWeight: '700', fontSize: 16 }}>Welcome back</Text>
        <Text style={{ color: '#6b7280', fontSize: 13 }}>Use Google for one-tap sign in, or get a magic link by email.</Text>

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
            borderColor: '#d1d5db',
            borderRadius: 14,
            paddingHorizontal: 12,
            paddingVertical: 12,
            fontSize: 16,
            backgroundColor: '#f9fafb',
          }}
        />

        <PrimaryButton title={sending ? 'Sending...' : 'Send Magic Link'} onPress={handleMagicLink} disabled={sending || !isSupabaseConfigured} variant="outline" />
      </View>
    </View>
  );
}
