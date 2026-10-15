import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getBackendUrl() {
  return (
    process.env.INTERNAL_BACKEND_URL ||
    process.env.BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://fxengin-backend:3000'
  ).replace(/\/+$/, '');
}

/**
 * Server-Side Proxy for TradingView Scanners in Admin
 */
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { url, tickers } = body || {};

    if (!url || !Array.isArray(tickers) || tickers.length === 0) {
      return NextResponse.json({ success: false, data: [] }, { status: 400 });
    }

    if (!url.startsWith('https://scanner.tradingview.com/')) {
      return NextResponse.json({ success: false, data: [] }, { status: 403 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    try {
      const res = await fetch(url, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          symbols: { tickers },
          columns: ['close', 'change', 'change_abs', 'high', 'low', 'bid', 'ask'],
        }),
        cache: 'no-store',
      });
      clearTimeout(timeout);

      if (res.ok) {
        const json = await res.json();
        return NextResponse.json({
          success: true,
          data: Array.isArray(json?.data) ? json.data : [],
        });
      }
    } catch {
      clearTimeout(timeout);
    }

    return NextResponse.json({ success: false, data: [] });
  } catch (err) {
    return NextResponse.json(
      { success: false, data: [], error: err.message },
      { status: 500 }
    );
  }
}
