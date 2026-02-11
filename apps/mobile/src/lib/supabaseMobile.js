import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const ACCESS_TOKEN_KEY = 'sb-access-token';
const REFRESH_TOKEN_KEY = 'sb-refresh-token';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export function getSupabaseConfig() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
  }
  return { url: supabaseUrl, anonKey: supabaseAnonKey };
}

export async function getAccessToken() {
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken() {
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
}

export async function clearSession() {
  await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
}

export async function saveSession({ accessToken, refreshToken }) {
  const writes = [];
  if (accessToken) writes.push([ACCESS_TOKEN_KEY, accessToken]);
  if (refreshToken) writes.push([REFRESH_TOKEN_KEY, refreshToken]);
  if (writes.length) {
    await AsyncStorage.multiSet(writes);
  }
}

export async function setSessionFromUrl(urlString) {
  if (!urlString) return false;
  const url = String(urlString);
  const hashPart = url.includes('#') ? url.split('#')[1] : '';
  const queryPart = url.includes('?') ? url.split('?')[1].split('#')[0] : '';
  const fragmentParams = new URLSearchParams(hashPart);
  const queryParams = new URLSearchParams(queryPart);

  const accessToken = fragmentParams.get('access_token') || queryParams.get('access_token');
  const refreshToken = fragmentParams.get('refresh_token') || queryParams.get('refresh_token');

  if (!accessToken) return false;
  await saveSession({ accessToken, refreshToken });
  return true;
}

async function refreshAccessToken() {
  const { url, anonKey } = getSupabaseConfig();
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return false;

  const response = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    await clearSession();
    return false;
  }

  const body = await response.json().catch(() => null);
  const accessToken = body?.access_token;
  const nextRefreshToken = body?.refresh_token || refreshToken;
  if (!accessToken) {
    await clearSession();
    return false;
  }

  await saveSession({ accessToken, refreshToken: nextRefreshToken });
  return true;
}

function buildHeaders(anonKey, optionsHeaders, accessToken) {
  const headers = {
    apikey: anonKey,
    'Content-Type': 'application/json',
    ...(optionsHeaders || {}),
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  return headers;
}

export async function authedFetch(path, options = {}) {
  const { url, anonKey } = getSupabaseConfig();
  let accessToken = await getAccessToken();

  let response = await fetch(`${url}${path}`, {
    ...options,
    headers: buildHeaders(anonKey, options.headers, accessToken),
  });

  if (response.status === 401 || response.status === 403) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      accessToken = await getAccessToken();
      response = await fetch(`${url}${path}`, {
        ...options,
        headers: buildHeaders(anonKey, options.headers, accessToken),
      });
    }
  }

  return response;
}
