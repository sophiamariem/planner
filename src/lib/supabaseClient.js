const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const ACCESS_TOKEN_KEY = 'sb-access-token';
const REFRESH_TOKEN_KEY = 'sb-refresh-token';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = null;

export function getSupabaseConfig() {
  if (!isSupabaseConfigured) {
    throw new Error('This feature is temporarily unavailable.');
  }

  return { url: supabaseUrl, anonKey: supabaseAnonKey };
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function clearSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function saveSession({ accessToken, refreshToken }) {
  if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function setSessionFromUrl() {
  const hash = window.location.hash || '';
  if (!hash.includes('access_token=')) return false;

  const fragment = hash.startsWith('#') ? hash.slice(1) : hash;
  const params = new URLSearchParams(fragment);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');

  if (!accessToken) return false;

  saveSession({ accessToken, refreshToken });

  const preserve = params.get('next_hash');
  if (preserve) {
    window.history.replaceState(null, '', `${window.location.pathname}#${preserve}`);
  } else {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }

  return true;
}

export async function authedFetch(path, options = {}) {
  const { url, anonKey } = getSupabaseConfig();
  const accessToken = getAccessToken();

  const headers = {
    apikey: anonKey,
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${url}${path}`, {
    ...options,
    headers,
  });

  return response;
}
