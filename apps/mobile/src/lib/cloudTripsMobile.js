import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { authedFetch, clearSession, getAccessToken, getSupabaseConfig, isSupabaseConfigured } from './supabaseMobile';

WebBrowser.maybeCompleteAuthSession();
const SLUG_SUFFIX_LEN = 4;
const MAX_SLUG_LEN = 28;
const DEFAULT_MEDIA_BUCKET = process.env.EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET || 'trip-media';

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
  if (!isSupabaseConfigured) throw new Error('Sign in is unavailable right now.');

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
  if (!isSupabaseConfigured) throw new Error('Google sign-in is unavailable right now.');

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
  if (!isSupabaseConfigured) throw new Error('Saved trips are unavailable right now.');

  const response = await authedFetch(`/rest/v1/trips?id=eq.${encodeURIComponent(id)}&select=id,slug,title,visibility,trip_data,created_at,updated_at&limit=1`, {
    method: 'GET',
  });

  const rows = await parseJson(response, 'Could not load cloud trip.');
  if (!rows.length) throw new Error('Trip not found.');
  return rows[0];
}

export async function saveTripToCloud(tripData, visibility = 'private') {
  if (!isSupabaseConfigured) throw new Error('Saved trips are unavailable right now.');

  const preparedTripData = await importTripMediaToStorage(tripData);
  const title = preparedTripData?.tripConfig?.title || 'Untitled Trip';
  const baseSlug = slugifyTitle(title);
  const maxAttempts = 6;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const payload = {
      title,
      trip_data: preparedTripData,
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
  if (!isSupabaseConfigured) throw new Error('Saved trips are unavailable right now.');
  if (!id) throw new Error('Trip id is required.');

  const preparedTripData = await importTripMediaToStorage(tripData);
  const title = preparedTripData?.tripConfig?.title || 'Untitled Trip';
  const payload = {
    title,
    trip_data: preparedTripData,
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

export async function deleteCloudTripById(id) {
  if (!isSupabaseConfigured) throw new Error('Saved trips are unavailable right now.');
  if (!id) throw new Error('Trip id is required.');

  const response = await authedFetch(`/rest/v1/trips?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: {
      Prefer: 'return=minimal',
    },
  });

  if (!response.ok) {
    await parseJson(response, 'Could not delete trip.');
  }
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

function toStoragePath(path) {
  return String(path || '')
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');
}

function isHttpUrl(value) {
  return /^https?:\/\//i.test(String(value || '').trim());
}

function getFileExtFromUrl(url) {
  try {
    const parsed = new URL(url);
    const last = parsed.pathname.split('/').pop() || '';
    const clean = last.split('?')[0].split('#')[0];
    const ext = clean.includes('.') ? clean.slice(clean.lastIndexOf('.') + 1).toLowerCase() : '';
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'].includes(ext)) return ext;
  } catch {
    // ignore
  }
  return 'jpg';
}

function getExtFromMime(type) {
  const raw = String(type || '').toLowerCase();
  if (raw.includes('png')) return 'png';
  if (raw.includes('webp')) return 'webp';
  if (raw.includes('gif')) return 'gif';
  if (raw.includes('avif')) return 'avif';
  return 'jpg';
}

async function uploadUrlToStorage(sourceUrl, cache = new Map()) {
  const clean = String(sourceUrl || '').trim();
  if (!isHttpUrl(clean)) return clean;
  if (cache.has(clean)) return cache.get(clean);

  const { url, anonKey } = getSupabaseConfig();
  if (clean.includes(`${url}/storage/v1/object/`)) {
    cache.set(clean, clean);
    return clean;
  }

  const token = await getAccessToken();
  if (!token) return clean;

  try {
    const input = await fetch(clean);
    if (!input.ok) throw new Error('image_fetch_failed');
    const blob = await input.blob();
    if (!blob || !blob.size) throw new Error('image_empty');

    const ext = blob.type ? getExtFromMime(blob.type) : getFileExtFromUrl(clean);
    const path = `imports/${new Date().toISOString().slice(0, 10)}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const upload = await fetch(`${url}/storage/v1/object/${DEFAULT_MEDIA_BUCKET}/${toStoragePath(path)}`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${token}`,
        'x-upsert': 'true',
        'Content-Type': blob.type || `image/${ext}`,
      },
      body: blob,
    });
    if (!upload.ok) throw new Error('image_upload_failed');

    const stored = `${url}/storage/v1/object/public/${DEFAULT_MEDIA_BUCKET}/${path}`;
    cache.set(clean, stored);
    return stored;
  } catch {
    cache.set(clean, clean);
    return clean;
  }
}

async function importTripMediaToStorage(tripData) {
  const base = tripData ? JSON.parse(JSON.stringify(tripData)) : {};
  const cache = new Map();

  if (base?.tripConfig?.cover) {
    base.tripConfig.cover = await uploadUrlToStorage(base.tripConfig.cover, cache);
  }

  if (Array.isArray(base?.days)) {
    for (let i = 0; i < base.days.length; i += 1) {
      const day = base.days[i] || {};
      if (Array.isArray(day.photos)) {
        const nextPhotos = [];
        for (const photo of day.photos) {
          nextPhotos.push(await uploadUrlToStorage(photo, cache));
        }
        day.photos = nextPhotos;
      }
    }
  }

  return base;
}
