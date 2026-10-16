/**
 * @file subscriptionService.js
 * @description Service for managing subscriptions and permissions for FXENGIN traders
 */

import { API_BASE_URL, getAccessToken } from './apiClient';

/**
 * Fetch active subscription & permissions for current authenticated user
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function fetchUserSubscription() {
  const token = getAccessToken();
  if (!token) {
    return {
      success: false,
      data: {
        hasActiveSubscription: false,
        isPrivilegedRole: false,
        activePermissions: [],
      },
    };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/subscriptions/my-subscription`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return {
        success: false,
        data: {
          hasActiveSubscription: false,
          isPrivilegedRole: false,
          activePermissions: [],
        },
      };
    }

    const data = await res.json().catch(() => null);
    return data || { success: false };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      data: {
        hasActiveSubscription: false,
        isPrivilegedRole: false,
        activePermissions: [],
      },
    };
  }
}

/**
 * Fetch public pricing catalog plans
 */
export async function fetchPublicPlans() {
  try {
    const res = await fetch(`${API_BASE_URL}/subscriptions/plans`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return [];
    const data = await res.json().catch(() => []);
    return Array.isArray(data) ? data : data?.data || [];
  } catch {
    return [];
  }
}
