import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { authedFetch, clearSession, getAccessToken, getSupabaseConfig, isSupabaseConfigured } from './supabaseMobile';

WebBrowser.maybeCompleteAuthSession();

async function parseJson(response, fallback = 'Request failed.') {
  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const message = body?.msg || body?.error_description || body?.message || fallback;
    const error = new Error(message);
    error.code = body?.code;
    throw error;
  }

  return body;
}

export async function getCurrentUser() {
  if (!isSupabaseConfigured) return null;
  if (!(await getAccessToken())) return null;

  const response = await authedFetch('/auth/v1/user', { method: 'GET' });
  return parseJson(response, 'Could not load user.');
}

export async function signInWithMagicLink(email) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

  const { url, anonKey } = getSupabaseConfig();
  const redirectTo = Linking.createURL('auth-callback');

  const response = await fetch(`${url}/auth/v1/otp`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      create_user: true,
      options: { emailRedirectTo: redirectTo },
    }),
  });

  await parseJson(response, 'Could not send sign-in email.');
}

export async function signInWithGoogle() {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

  const { url } = getSupabaseConfig();
  const redirectTo = Linking.createURL('auth-callback');
  const authUrl = `${url}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`;

  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectTo);
  return result;
}

export async function signOut() {
  if (!isSupabaseConfigured) return;
  try {
    await authedFetch('/auth/v1/logout', { method: 'POST' });
  } catch {
    // no-op
  }
  await clearSession();
}

export async function listMyTrips() {
  if (!isSupabaseConfigured) return [];
  const response = await authedFetch('/rest/v1/trips?select=id,slug,title,visibility,trip_data,created_at,updated_at&order=updated_at.desc&limit=100', {
    method: 'GET',
  });
  return parseJson(response, 'Could not load trips.');
}

export async function loadCloudTripById(id) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

  const response = await authedFetch(`/rest/v1/trips?id=eq.${encodeURIComponent(id)}&select=id,slug,title,visibility,trip_data,created_at,updated_at&limit=1`, {
    method: 'GET',
  });

  const rows = await parseJson(response, 'Could not load cloud trip.');
  if (!rows.length) throw new Error('Trip not found.');
  return rows[0];
}
