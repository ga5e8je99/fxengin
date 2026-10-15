/**
 * @file authService.js
 * Dedicated Administrative Authentication & Security Service
 * Integrates:
 * 1. POST /admin/auth/login        - Authenticate Super Administrator
 * 2. GET  /admin/auth/me           - Get Active Administrator Identity
 * 3. GET  /admin/auth/super-admin  - Get Super Administrator Security Dossier & Permissions
 */

import { adminFetch, getAdminToken, setAdminToken, clearAdminToken } from './apiClient';

const ADMIN_PROFILE_KEY = 'fxengin_admin_profile';
const ADMIN_DOSSIER_KEY = 'fxengin_admin_dossier';

/**
 * Retrieve cached admin profile from local storage
 */
export function getStoredAdminProfile() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ADMIN_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Cache admin profile in local storage
 */
export function setStoredAdminProfile(profile) {
  if (typeof window === 'undefined') return;
  if (!profile) {
    localStorage.removeItem(ADMIN_PROFILE_KEY);
  } else {
    localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(profile));
  }
}

/**
 * Retrieve cached Super Admin security dossier
 */
export function getStoredAdminDossier() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ADMIN_DOSSIER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Cache Super Admin security dossier
 */
export function setStoredAdminDossier(dossier) {
  if (typeof window === 'undefined') return;
  if (!dossier) {
    localStorage.removeItem(ADMIN_DOSSIER_KEY);
  } else {
    localStorage.setItem(ADMIN_DOSSIER_KEY, JSON.stringify(dossier));
  }
}

/**
 * 1. POST /admin/auth/login
 * High-security administrative sign-in. Verifies master credentials and stores token.
 *
 * @param {Object} credentials - { email, password }
 * @returns {Promise<{ ok: boolean, status: number, data?: any, error?: string }>}
 */
export async function adminLogin({ email, password }) {
  const res = await adminFetch('/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (res.ok && res.data) {
    const { accessToken, admin } = res.data;
    if (accessToken) {
      setAdminToken(accessToken);
    }
    if (admin) {
      setStoredAdminProfile(admin);
    }
  }

  return res;
}

/**
 * 2. POST /admin/auth/register
 * Register a new Administrator account and automatically save access tokens.
 *
 * @param {Object} data - { fullName, email, password, phoneNumber, securityPasscode }
 * @returns {Promise<{ ok: boolean, status: number, data?: any, error?: string }>}
 */
export async function adminRegister({ fullName, email, password, phoneNumber, securityPasscode }) {
  const res = await adminFetch('/admin/auth/register', {
    method: 'POST',
    body: JSON.stringify({ fullName, email, password, phoneNumber, securityPasscode }),
  });

  if (res.ok && res.data) {
    const { accessToken, admin } = res.data;
    if (accessToken) {
      setAdminToken(accessToken);
    }
    if (admin) {
      setStoredAdminProfile(admin);
    }
  }

  return res;
}

/**
 * 3. GET /admin/auth/me
 * Retrieves the authenticated administrator identity based on the verified JWT token.
 *
 * @returns {Promise<{ ok: boolean, status: number, data?: any, error?: string }>}
 */
export async function getAdminIdentity() {
  const res = await adminFetch('/admin/auth/me', {
    method: 'GET',
  });

  if (res.ok && res.data) {
    setStoredAdminProfile(res.data);
  }

  return res;
}

/**
 * 3. GET /admin/auth/super-admin
 * Returns the full Super Admin identity, security clearance level (Level 5 Root Master),
 * cryptographic permissions matrix, and system security audit telemetry.
 *
 * @returns {Promise<{ ok: boolean, status: number, data?: any, error?: string }>}
 */
export async function getSuperAdminDossier() {
  const res = await adminFetch('/admin/auth/super-admin', {
    method: 'GET',
  });

  if (res.ok && res.data) {
    setStoredAdminDossier(res.data);
  }

  return res;
}

/**
 * Terminate administrative session, clear tokens and security cache
 */
export function logoutAdmin() {
  clearAdminToken();
  setStoredAdminProfile(null);
  setStoredAdminDossier(null);
}

export { getAdminToken, setAdminToken, clearAdminToken };
