import { authedFetch, clearSession, getAccessToken, getSupabaseConfig, isSupabaseConfigured } from './supabaseClient';

const PUBLIC_VISIBILITIES = ['unlisted', 'public'];
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
    const message = body?.msg || body?.error_description || body?.message || fallback;
    const error = new Error(message);
    error.code = body?.code;
    error.details = body?.details;
    throw error;
  }

  return body;
}

export async function getCurrentUser() {
  if (!isSupabaseConfigured) return null;
  if (!getAccessToken()) return null;

  const response = await authedFetch('/auth/v1/user', { method: 'GET' });
  return parseJson(response, 'Could not load user.');
}

export async function signInWithMagicLink(email) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

  const { url, anonKey } = getSupabaseConfig();
  const redirectTo = window.location.origin + window.location.pathname;

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

export function signInWithGoogle() {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

  const { url } = getSupabaseConfig();
  const redirectTo = window.location.origin + window.location.pathname;
  const authUrl = `${url}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`;
  window.location.assign(authUrl);
}

export async function signOut() {
  if (!isSupabaseConfigured) return;
  try {
    await authedFetch('/auth/v1/logout', { method: 'POST' });
  } catch {
    // Ignore logout API errors and clear local session anyway.
  }
  clearSession();
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

    const response = await authedFetch('/rest/v1/trips?select=id,slug,title,visibility,created_at,updated_at', {
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

export async function updateCloudTrip(id, tripData, visibility = 'private', currentSlug = null) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

  const title = tripData?.tripConfig?.title || 'Untitled Trip';
  const payload = {
    title,
    trip_data: tripData,
    visibility,
    slug: currentSlug || withShortSuffix(slugifyTitle(title)),
  };

  const response = await authedFetch(`/rest/v1/trips?id=eq.${encodeURIComponent(id)}&select=id,slug,title,visibility,created_at,updated_at`, {
    method: 'PATCH',
    headers: {
      Prefer: 'return=representation',
    },
    body: JSON.stringify(payload),
  });

  const rows = await parseJson(response, 'Could not update trip.');
  return rows[0];
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

  const response = await authedFetch(`/rest/v1/trips?id=eq.${encodeURIComponent(id)}&select=id,slug,title,visibility,share_token,trip_data,owner_id,created_at,updated_at&limit=1`, {
    method: 'GET',
  });

  const rows = await parseJson(response, 'Could not load cloud trip.');
  if (!rows.length) throw new Error('Trip not found.');
  return rows[0];
}

export async function loadCloudTripByShareToken(shareToken) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

  const response = await authedFetch(`/rest/v1/trips?share_token=eq.${encodeURIComponent(shareToken)}&select=id,slug,title,visibility,share_token,trip_data,owner_id,created_at,updated_at&limit=1`, {
    method: 'GET',
  });

  const rows = await parseJson(response, 'Could not load trip.');
  if (!rows.length) throw new Error('Trip not found.');
  return rows[0];
}

export async function loadCloudTripBySlug(slug) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

  const response = await authedFetch(`/rest/v1/trips?slug=eq.${encodeURIComponent(slug)}&select=id,slug,title,visibility,share_token,trip_data,owner_id,created_at,updated_at&limit=1`, {
    method: 'GET',
  });

  const rows = await parseJson(response, 'Could not load shared trip.');
  if (!rows.length) throw new Error('Shared trip not found.');
  return rows[0];
}

export async function generateShareToken(tripId) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

  const token = Math.random().toString(36).slice(2, 18);
  const response = await authedFetch(`/rest/v1/trips?id=eq.${encodeURIComponent(tripId)}&select=id,share_token`, {
    method: 'PATCH',
    headers: {
      Prefer: 'return=representation',
    },
    body: JSON.stringify({ share_token: token, visibility: 'unlisted' }),
  });

  const rows = await parseJson(response, 'Could not create share token.');
  if (!rows.length) throw new Error('Trip not found.');
  return rows[0].share_token;
}

export function isPublicVisibility(visibility) {
  return PUBLIC_VISIBILITIES.includes(visibility);
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
