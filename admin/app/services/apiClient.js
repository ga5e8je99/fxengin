/**
 * @file apiClient.js
 * Centralized API client for FXENGIN Admin Dashboard
 * Connects to Core API backend or uses proxy /api
 */

export const API_BASE_URL = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_USE_DIRECT_API === 'true'
      ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001')
      : '/api')
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001');

export function getCleanAdminToken() {
  const token = getAdminToken();
  if (!token) return null;
  return token.replace(/^Bearer\s+/i, '').trim();
}

export function getAdminToken() {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('fxengin_admin_token') || localStorage.getItem('fxengin_token');
  return token ? token.trim() : null;
}

export function setAdminToken(token) {
  if (typeof window === 'undefined') return;
  const clean = token ? token.replace(/^Bearer\s+/i, '').trim() : '';
  localStorage.setItem('fxengin_admin_token', clean);
}

export function clearAdminToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('fxengin_admin_token');
  localStorage.removeItem('fxengin_token');
}

export async function adminFetch(endpoint, options = {}) {
  const cleanToken = getCleanAdminToken();
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(cleanToken ? { Authorization: `Bearer ${cleanToken}` } : {}),
    ...options.headers,
  };

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  try {
    const res = await fetch(url, { credentials: 'include', ...options, headers });
    const data = await res.json().catch(() => null);

    if (res.status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('fxengin:unauthorized', {
          detail: { endpoint, status: 401, error: data?.message || 'Unauthorized' },
        })
      );
    }

    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    console.warn(`Admin API Error [${endpoint}]:`, err);
    return { ok: false, status: 500, error: err.message };
  }
}
