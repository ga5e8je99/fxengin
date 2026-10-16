/**
 * @file adsService.js
 * Service for fetching active advertisements and tracking interactions on FXENGIN website
 */

import { API_BASE_URL } from './apiClient';

/**
 * Fetch active advertisements for a specific placement or ALL
 * @param {'SKYSCRAPER_RIGHT' | 'SKYSCRAPER_LEFT' | 'HORIZONTAL_BANNER' | 'MOBILE_TOP_BAR' | 'POPUP_MODAL' | 'ALL' | 'SIDEBAR'} [placement]
 */
export async function fetchActiveAds(placement) {
  try {
    let url = `${API_BASE_URL}/ads/active`;
    if (placement && placement !== 'ALL') {
      url += `?placement=${encodeURIComponent(placement)}`;
    }
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json().catch(() => []);
    return Array.isArray(data) ? data : data?.data || [];
  } catch (err) {
    // Fail silently to allow frontend fallback ads to render seamlessly
    return [];
  }
}

/**
 * Fetch all active sidebar/display advertisements across all placements
 * Guaranteed to return unified list from SKYSCRAPER_LEFT, SKYSCRAPER_RIGHT, ALL, etc.
 */
export async function fetchAllActiveSidebarAds() {
  try {
    // Try unified query first
    const unified = await fetchActiveAds('ALL');
    if (Array.isArray(unified) && unified.length > 0) {
      return unified;
    }

    // Fallback: query left and right separately and merge
    const [leftAds, rightAds, mobileAds] = await Promise.all([
      fetchActiveAds('SKYSCRAPER_LEFT').catch(() => []),
      fetchActiveAds('SKYSCRAPER_RIGHT').catch(() => []),
      fetchActiveAds('MOBILE_TOP_BAR').catch(() => []),
    ]);

    const map = new Map();
    [...(leftAds || []), ...(rightAds || []), ...(mobileAds || [])].forEach((ad) => {
      if (ad && ad.id && !map.has(ad.id)) {
        map.set(ad.id, ad);
      }
    });

    return Array.from(map.values());
  } catch (e) {
    return [];
  }
}

/**
 * Record a user click on an advertisement
 * @param {string} adId
 */
export function trackAdClick(adId) {
  if (!adId || adId.startsWith('default-')) return;
  const url = `${API_BASE_URL}/ads/${encodeURIComponent(adId)}/click`;
  try {
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon(url);
    } else {
      fetch(url, { method: 'POST', keepalive: true }).catch(() => {});
    }
  } catch (e) {
    // Silent fail
  }
}

/**
 * Record an ad view / impression
 * @param {string} adId
 */
export function trackAdView(adId) {
  if (!adId || adId.startsWith('default-')) return;
  const url = `${API_BASE_URL}/ads/${encodeURIComponent(adId)}/view`;
  try {
    fetch(url, { method: 'POST', keepalive: true }).catch(() => {});
  } catch (e) {
    // Silent fail
  }
}

/**
 * Fetch Google AdSense configuration for the website
 */
export async function fetchAdSenseConfig() {
  try {
    const res = await fetch(`${API_BASE_URL}/ads/adsense-config`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    return data;
  } catch (err) {
    return null;
  }
}
