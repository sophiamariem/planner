import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { authedFetch, clearSession, getAccessToken, getSupabaseConfig, isSupabaseConfigured } from './supabaseMobile';

WebBrowser.maybeCompleteAuthSession();
const SLUG_SUFFIX_LEN = 4;
const MAX_SLUG_LEN = 28;

async function parseJson(response, fallback = 'Request failed.') {
  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const message = toFriendlyMessage(response, body, fallback);
    const error = new Error(message);
    error.code = body?.code;
    error.details = body?.msg || body?.error_description || body?.message || null;
    throw error;
  }

  return body;
}

function toFriendlyMessage(response, body, fallback) {
  const status = response?.status || 0;
  const raw = String(body?.msg || body?.error_description || body?.message || '').toLowerCase();

  if (status === 401 || status === 403 || raw.includes('jwt') || raw.includes('token') || raw.includes('expired')) {
    return 'Your session expired. Please sign in again.';
  }

  if (status === 429) {
    return 'Too many attempts. Please wait a moment and try again.';
  }

  if (raw.includes('unsupported provider') || raw.includes('provider is not enabled')) {
    return 'Google sign-in is not available right now. Please use email sign-in.';
  }

  if (body?.code === '23505' || raw.includes('duplicate key')) {
    return 'This trip already exists. Try saving again.';
  }

  if (status >= 500) {
    return 'Something went wrong on our side. Please try again.';
  }

  return fallback || 'Something went wrong. Please try again.';
}

export async function getCurrentUser() {
  if (!isSupabaseConfigured) return null;
  if (!(await getAccessToken())) return null;

  const response = await authedFetch('/auth/v1/user', { method: 'GET' });
  if (response.status === 401 || response.status === 403) {
    await clearSession();
    return null;
  }
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

export async function saveTripToCloud(tripData, visibility = 'private') {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

  const title = tripData?.tripConfig?.title || 'Untitled Trip';
  const baseSlug = slugifyTitle(title);
  const maxAttempts = 6;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const payload = {
      title,
      trip_data: tripData,
      visibility,
      slug: withShortSuffix(baseSlug),
    };

    const response = await authedFetch('/rest/v1/trips?select=id,slug,title,visibility,trip_data,created_at,updated_at', {
      method: 'POST',
      headers: {
        Prefer: 'return=representation',
      },
      body: JSON.stringify(payload),
    });

    try {
      const rows = await parseJson(response, 'Could not save trip.');
      return rows[0];
    } catch (error) {
      if (error.code === '23505') continue;
      throw error;
    }
  }

  throw new Error('Could not allocate a unique slug. Try saving again.');
}

export async function updateCloudTripById(id, tripData, visibility = 'private') {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
  if (!id) throw new Error('Trip id is required.');

  const title = tripData?.tripConfig?.title || 'Untitled Trip';
  const payload = {
    title,
    trip_data: tripData,
    visibility,
  };

  const response = await authedFetch(
    `/rest/v1/trips?id=eq.${encodeURIComponent(id)}&select=id,slug,title,visibility,trip_data,created_at,updated_at`,
    {
      method: 'PATCH',
      headers: {
        Prefer: 'return=representation',
      },
      body: JSON.stringify(payload),
    }
  );

  const rows = await parseJson(response, 'Could not update trip.');
  if (!rows.length) throw new Error('Trip not found.');
  return rows[0];
}

function slugifyTitle(title) {
  const normalized = String(title || 'trip')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const safe = normalized || 'trip';
  const maxBaseLen = MAX_SLUG_LEN - (SLUG_SUFFIX_LEN + 1);
  return safe.slice(0, maxBaseLen).replace(/-+$/g, '') || 'trip';
}

function withShortSuffix(base) {
  return `${base}-${Math.random().toString(36).slice(2, 2 + SLUG_SUFFIX_LEN)}`;
}
