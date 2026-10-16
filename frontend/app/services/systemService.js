/**
 * @file systemService.js
 * @description System & Telemetry Service for FXENGIN Core API
 * Handles GET /system/locales and POST /system/report-error
 */

import { apiFetch, reportErrorTelemetry } from './apiClient.js';

/**
 * @typedef {Object} SupportedLocale
 * @property {string} code - 'EN' | 'AR'
 * @property {string} name - 'English' | 'العربية'
 * @property {string} dir - 'ltr' | 'rtl'
 * @property {boolean} isDefault
 */

/**
 * @typedef {Object} LocalesResponse
 * @property {boolean} success
 * @property {string} defaultLocale
 * @property {SupportedLocale[]} supportedLocales
 * @property {string} timestamp
 */

/**
 * Fetch supported platform languages and locale configs
 * Endpoint: GET /system/locales
 * @returns {Promise<LocalesResponse>}
 */
export async function fetchLocales() {
  try {
    const res = await apiFetch('/system/locales', {
      method: 'GET',
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch locales: HTTP ${res.status}`);
    }

    const data = await res.json();
    return {
      success: true,
      defaultLocale: data.defaultLocale || 'EN',
      supportedLocales: Array.isArray(data.supportedLocales) ? data.supportedLocales : [
        { code: 'EN', name: 'English', dir: 'ltr', isDefault: true },
        { code: 'AR', name: 'العربية', dir: 'rtl', isDefault: false },
      ],
      timestamp: data.timestamp || new Date().toISOString(),
    };
  } catch (err) {
    console.warn('Locales fetch failed, using fallback locales:', err.message);
    return {
      success: false,
      defaultLocale: 'EN',
      supportedLocales: [
        { code: 'EN', name: 'English', dir: 'ltr', isDefault: true },
        { code: 'AR', name: 'العربية', dir: 'rtl', isDefault: false },
      ],
      timestamp: new Date().toISOString(),
      error: err.message,
    };
  }
}

/**
 * Report client/API error telemetry to FXENGIN Core
 * Endpoint: POST /system/report-error
 * @param {{ errorCode: '404'|'401'|'403'|'500'|'503', path: string, message?: string }} param0
 * @returns {Promise<void>}
 */
export async function reportError({ errorCode, path, message }) {
  await reportErrorTelemetry({ errorCode, path, message });
}
