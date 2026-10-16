/**
 * @file apiClient.js
 * @description Centralized Core Engine API Client for FXENGIN
 * Handles Base URL resolution, authentication headers, automatic 401 token rotation retry,
 * error code telemetry reporting (401/403/404/429/500), and sensitive data sanitization.
 */

export const API_BASE_URL = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_USE_DIRECT_API === 'true' ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001') : '/api')
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001');

const ACCESS_TOKEN_KEY = 'fxengin_access_token';
const REFRESH_TOKEN_KEY = 'fxengin_refresh_token';
const USER_KEY = 'fxengin_user';

// In-flight refresh singleton promise lock to prevent parallel refresh race conditions
let refreshPromise = null;
let sessionExpiredCallback = null;

// Rate-limiting and loop prevention for error telemetry
const reportedErrorsSet = new Set();
let isReportingActive = false;

/**
 * Register callback to trigger when session expires
 * @param {Function} callback
 */
export function setOnSessionExpired(callback) {
  sessionExpiredCallback = callback;
}

/**
 * Trigger global session expiration (cleans storage and redirects)
 */
export function handleSessionExpired() {
  clearTokens();
  if (typeof sessionExpiredCallback === 'function') {
    try {
      sessionExpiredCallback();
    } catch (e) {
      console.warn('Session expired callback error:', e);
    }
  }
  if (typeof window !== 'undefined' && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
    window.location.href = '/login';
  }
}

/**
 * Get current Access Token from localStorage
 * @returns {string|null}
 */
export function getAccessToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem('fxengin_token');
}

/**
 * Get current Refresh Token from localStorage
 * @returns {string|null}
 */
export function getRefreshToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Persist tokens in localStorage
 * @param {string} accessToken
 * @param {string} [refreshToken]
 */
export function setTokens(accessToken, refreshToken) {
  if (typeof window === 'undefined') return;
  if (accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem('fxengin_token', accessToken);
  }
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

/**
 * Clear tokens and user state from localStorage
 */
export function clearTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem('fxengin_token');
}

/**
 * Sensitive Data Sanitizer for Telemetry
 * Removes passwords, authorization tokens, bearer headers, credit cards, or credentials.
 * @param {string|object} data
 * @returns {string} Sanitized string
 */
export function sanitizeSensitiveData(data) {
  if (!data) return '';
  let str = typeof data === 'object' ? JSON.stringify(data) : String(data);

  // Redact passwords, tokens, and authorization values
  str = str.replace(/"password"\s*:\s*"[^"]+"/gi, '"password":"[REDACTED]"');
  str = str.replace(/"confirmPassword"\s*:\s*"[^"]+"/gi, '"confirmPassword":"[REDACTED]"');
  str = str.replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED_TOKEN]');
  str = str.replace(/"(accessToken|refreshToken|token)"\s*:\s*"[^"]+"/gi, '"$1":"[REDACTED_TOKEN]"');

  return str.length > 500 ? str.substring(0, 500) + '... (truncated)' : str;
}

/**
 * Centralized Error Telemetry Reporter
 * Sends client/API error events to POST /system/report-error
 * @param {{ errorCode: '404'|'401'|'403'|'500'|'503', path: string, message?: string }} payload
 */
export async function reportErrorTelemetry({ errorCode, path, message }) {
  if (typeof window === 'undefined' || isReportingActive) return;

  // Prevent error loop on report-error endpoint itself
  if (!path || path.includes('/system/report-error')) return;

  // Deduplicate identical error reports within session
  const errorKey = `${errorCode}:${path}:${message || ''}`;
  if (reportedErrorsSet.has(errorKey)) return;
  reportedErrorsSet.add(errorKey);

  // Cap size of set to prevent memory leaks
  if (reportedErrorsSet.size > 50) reportedErrorsSet.clear();

  try {
    isReportingActive = true;
    const sanitizedMsg = sanitizeSensitiveData(message || `Client Error ${errorCode} on ${path}`);
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Next.js Client';

    await fetch(`${API_BASE_URL}/system/report-error`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        errorCode: String(errorCode),
        path: path.substring(0, 255),
        message: sanitizedMsg,
        userAgent: userAgent.substring(0, 255),
      }),
    });
  } catch (telemetryErr) {
    // Silent fail - never throw or enter loop from error reporting
  } finally {
    isReportingActive = false;
  }
}

/**
 * Rotate Refresh Token & Obtain New Access Token
 * Endpoint: POST /auth/refresh
 * Singleton promise prevents parallel duplicate refresh calls.
 * @returns {Promise<{success: boolean, accessToken?: string, refreshToken?: string, error?: string}>}
 */
export async function rotateRefreshToken() {
  const currentRefreshToken = getRefreshToken();
  if (!currentRefreshToken) {
    handleSessionExpired();
    return { success: false, error: 'No refresh token found in storage' };
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ refreshToken: currentRefreshToken }),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed with HTTP ${response.status}`);
      }

      const data = await response.json();
      const newAccessToken = data.accessToken || data.data?.accessToken;
      const newRefreshToken = data.refreshToken || data.data?.refreshToken;

      if (data.success && newAccessToken) {
        setTokens(newAccessToken, newRefreshToken || currentRefreshToken);
        return {
          success: true,
          accessToken: newAccessToken,
          refreshToken: newRefreshToken || currentRefreshToken,
          data,
        };
      } else {
        throw new Error(data.message || 'Token refresh rejected by backend');
      }
    } catch (err) {
      console.warn('Authentication token rotation failed:', err);
      handleSessionExpired();
      return { success: false, error: err.message };
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function attachSafeJson(response) {
  if (!response || typeof response.json !== 'function') return response;
  const originalJson = response.json.bind(response);
  response.json = async () => {
    try {
      return await originalJson();
    } catch (parseError) {
      console.warn('apiFetch: response was not valid JSON, returning fallback object', parseError);
      return {
        success: false,
        statusCode: response.status || 500,
        message: response.statusText || 'Internal Server Error',
        error: response.statusText || 'Invalid JSON response',
      };
    }
  };
  return response;
}

/**
 * Centralized API Fetch Interceptor
 * Features:
 * - Automatically prefixes API_BASE_URL
 * - Automatically injects Bearer <accessToken>
 * - Intercepts 401: automatically rotates refresh token, retries original request once
 * - Reports 500/503/404/403 errors to POST /system/report-error telemetry
 * - Handles 429 rate limit notifications
 *
 * @param {string} endpoint - API endpoint (e.g. '/market/rates' or '/auth/me')
 * @param {RequestInit} [options={}] - Standard Fetch options
 * @param {boolean} [isRetry=false] - Internal flag preventing infinite retry loop
 * @returns {Promise<Response>}
 */
export async function apiFetch(endpoint, options = {}, isRetry = false) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${cleanEndpoint}`;
  
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  const token = getAccessToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    let response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized -> Automatic Token Refresh Interceptor & Retry
    if (response.status === 401 && !isRetry && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register') && !endpoint.includes('/auth/refresh')) {
      const refreshResult = await rotateRefreshToken();
      if (refreshResult.success && refreshResult.accessToken) {
        headers.set('Authorization', `Bearer ${refreshResult.accessToken}`);
        return await apiFetch(endpoint, { ...options, headers }, true);
      } else {
        handleSessionExpired();
        return attachSafeJson(response);
      }
    }

    // Telemetry reporting for critical failures
    const isExpected404 = response.status === 404 && endpoint.includes('/analyst/share');
    if ([500, 503, 404, 403].includes(response.status) && !endpoint.includes('/system/report-error') && !isExpected404) {
      reportErrorTelemetry({
        errorCode: String(response.status),
        path: endpoint,
        message: `HTTP ${response.status} response from API`,
      }).catch(() => {});
    }

    return attachSafeJson(response);
  } catch (networkError) {
    // 1. If direct API connection failed in browser, immediately attempt local same-origin /api proxy fallback
    if (!isRetry && typeof window !== 'undefined' && !endpoint.startsWith('http') && API_BASE_URL !== '/api') {
      try {
        const proxyUrl = `/api${cleanEndpoint}`;
        const proxyRes = await fetch(proxyUrl, {
          ...options,
          headers,
        });
        if (proxyRes.ok || proxyRes.status < 500) {
          return attachSafeJson(proxyRes);
        }
      } catch (proxyErr) {
        // Continue to retry
      }
    }

    // 2. Retry once after 800ms for transient backend startup/compilation race condition
    if (!isRetry && !endpoint.includes('/auth/refresh') && !endpoint.includes('/system/report-error')) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      return await apiFetch(endpoint, options, true);
    }

    console.warn(`Network error fetching ${endpoint}:`, networkError.message);
    
    // Telemetry report for network failure
    if (!endpoint.includes('/system/report-error')) {
      reportErrorTelemetry({
        errorCode: '500',
        path: endpoint,
        message: `Network failure: ${networkError.message}`,
      }).catch(() => {});
    }

    return attachSafeJson(new Response(
      JSON.stringify({
        success: false,
        message: 'تعذر الاتصال بالخادم (Network Error)',
        error: networkError.message,
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' },
      }
    ));
  }
}
