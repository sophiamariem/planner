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

export async function authedFetch(path, options = {}) {
  const { url, anonKey } = getSupabaseConfig();
  const accessToken = await getAccessToken();

  const headers = {
    apikey: anonKey,
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return fetch(`${url}${path}`, {
    ...options,
    headers,
  });
}
