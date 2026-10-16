import { API_BASE_URL } from '../services/apiClient';

/**
 * Next.js Route Handler for serving ads.txt
 * Satisfies Google AdSense Publisher Authorization verification requirements.
 * URL: /ads.txt
 */
export async function GET() {
  let adsTxt = '';

  try {
    const res = await fetch(`${API_BASE_URL}/ads/ads-txt`, {
      cache: 'no-store',
      headers: { Accept: 'text/plain' },
    });
    if (res.ok) {
      adsTxt = await res.text();
    }
  } catch (err) {
    // Fallback if backend is unreachable
  }

  if (!adsTxt) {
    adsTxt = [
      '# ==========================================================',
      '# FXENGIN Official Ads.txt Configuration',
      '# https://fxengin.com',
      '# ==========================================================',
      '# Google AdSense: Pending Publisher ID Configuration',
      '# google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0',
    ].join('\n');
  }

  return new Response(adsTxt, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
