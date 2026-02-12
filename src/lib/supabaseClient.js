const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const ACCESS_TOKEN_KEY = 'sb-access-token';
const REFRESH_TOKEN_KEY = 'sb-refresh-token';
const SESSION_URL_KEY = 'sb-supabase-url';

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
  localStorage.removeItem(SESSION_URL_KEY);
}

export function saveSession({ accessToken, refreshToken }) {
  if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  if (supabaseUrl) localStorage.setItem(SESSION_URL_KEY, supabaseUrl);
}

function base64UrlDecode(input) {
  const raw = String(input || '').replace(/-/g, '+').replace(/_/g, '/');
  const pad = raw.length % 4 ? '='.repeat(4 - (raw.length % 4)) : '';
  try {
    return atob(raw + pad);
  } catch {
    return '';
  }
}

function parseJwtPayload(token) {
  const t = String(token || '').trim();
  const parts = t.split('.');
  if (parts.length !== 3) return null;
  const json = base64UrlDecode(parts[1]);
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function expectedIssuerPrefix() {
  const u = String(supabaseUrl || '').replace(/\/+$/, '');
  if (!u) return '';
  return `${u}/auth/v1`;
}

function validateStoredSessionForCurrentProject() {
  const storedUrl = localStorage.getItem(SESSION_URL_KEY);
  if (storedUrl && supabaseUrl && storedUrl !== supabaseUrl) {
    clearSession();
    return false;
  }
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (!accessToken) return true;
  const payload = parseJwtPayload(accessToken);
  if (!payload?.iss) return true;
  const expected = expectedIssuerPrefix();
  if (expected && typeof payload.iss === 'string' && !payload.iss.startsWith(expected)) {
    // Token from another Supabase project/environment.
    clearSession();
    return false;
  }
  return true;
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

async function refreshAccessToken() {
  const { url, anonKey } = getSupabaseConfig();
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const response = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    clearSession();
    return null;
  }

  const accessToken = body?.access_token;
  const nextRefresh = body?.refresh_token || refreshToken;
  if (!accessToken) {
    clearSession();
    return null;
  }

  saveSession({ accessToken, refreshToken: nextRefresh });
  return accessToken;
}

export async function authedFetch(path, options = {}) {
  const { url, anonKey } = getSupabaseConfig();
  validateStoredSessionForCurrentProject();
  const accessToken = getAccessToken();

  const headers = {
    apikey: anonKey,
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const isJwtLike = (value) => {
    const s = String(value || '').trim();
    // Supabase keys and access tokens are JWTs (3 base64url segments).
    return s.split('.').length === 3;
  };

  const isFunctionCall = String(path || '').startsWith('/functions/v1/');
  const initialFunctionBearer = isJwtLike(accessToken) ? accessToken : anonKey;
  if (isFunctionCall) {
    // Edge functions are fronted by JWT verification. If a user token is stale (or from another project),
    // it will fail as "Invalid JWT". We retry with anon key so the function can still run.
    headers.Authorization = `Bearer ${initialFunctionBearer}`;
  } else if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const doFetch = async (bearer) => {
    const nextHeaders = { ...headers };
    if (bearer) {
      nextHeaders.Authorization = `Bearer ${bearer}`;
    } else {
      delete nextHeaders.Authorization;
    }
    return fetch(`${url}${path}`, {
      ...options,
      headers: nextHeaders,
    });
  };

  let bearerToUse = headers.Authorization ? headers.Authorization.replace(/^Bearer\s+/i, '') : null;
  let response = await doFetch(bearerToUse);

  // If token expired, attempt a refresh+retry once.
  if (isFunctionCall && (response.status === 401 || response.status === 403)) {
    // If we tried a user token first, retry with anon key (which matches the project URL env).
    if (bearerToUse && bearerToUse !== anonKey) {
      bearerToUse = anonKey;
      response = await doFetch(bearerToUse);
    }
  } else if (!isFunctionCall && (response.status === 401 || response.status === 403) && getRefreshToken()) {
    const nextAccessToken = await refreshAccessToken();
    if (nextAccessToken) response = await doFetch(nextAccessToken);
  }

  return response;
}
