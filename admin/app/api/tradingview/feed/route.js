import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function cleanXmlText(str = '') {
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const filterSymbol = (searchParams.get('symbol') || '').toUpperCase().trim();
    const filterCategory = (searchParams.get('category') || '').toLowerCase().trim();
    const limit = Math.min(parseInt(searchParams.get('limit') || '30', 10), 50);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch('https://www.tradingview.com/feed/', {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      cache: 'no-store',
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `TradingView Feed responded with status ${res.status}` },
        { status: 502 }
      );
    }

    const xml = await res.text();

    // Parse RSS items
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    const rawItems = [];
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
      rawItems.push(match[1]);
    }

    const parsedIdeas = rawItems.map((itemXml, index) => {
      const getTag = (tag) => {
        const r = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
        const m = itemXml.match(r);
        return m ? m[1].trim() : '';
      };

      const titleRaw = getTag('title');
      const link = getTag('link') || getTag('guid');
      const pubDate = getTag('pubDate');
      const descRaw = getTag('description');
      const contentRaw = getTag('content:encoded');

      // Extract chart image: look for chart image link in content or desc
      let chartImage = '';
      const chartImgMatch = (contentRaw || descRaw || itemXml).match(
        /<a[^>]+href=["']https:\/\/www\.tradingview\.com\/chart\/[^"']+["'][^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["']/i
      );
      if (chartImgMatch) {
        chartImage = chartImgMatch[1].replace('_mid.', '_big.');
      } else {
        const genericImgMatch = (contentRaw || descRaw || itemXml).match(
          /https:\/\/s3\.tradingview\.com\/(?![uU]serpics)[a-zA-Z0-9_\/-]+\.(?:png|jpg|webp)/i
        );
        if (genericImgMatch) {
          chartImage = genericImgMatch[0].replace('_mid.', '_big.');
        }
      }

      // If no chart image found in RSS XML, provide high quality asset visual
      if (!chartImage) {
        if (['XAUUSD', 'XAGUSD', 'GOLD', 'SILVER'].includes(symbol)) {
          chartImage = 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=1200&q=80';
        } else if (['BTCUSD', 'ETHUSD', 'SOLUSD', 'CRYPTO', 'BITCOIN'].includes(symbol)) {
          chartImage = 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=1200&q=80';
        } else if (['US30', 'NAS100', 'SPX500', 'GER40'].includes(symbol)) {
          chartImage = 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=1200&q=80';
        } else if (['OIL', 'USOIL', 'BRENT'].includes(symbol)) {
          chartImage = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80';
        } else {
          chartImage = 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80';
        }
      }

      // Extract author
      let author = 'TradingView Analyst';
      let authorAvatar = '';
      const authorMatch = (contentRaw || itemXml).match(/<div class="chart-author">[\s\S]*?>([^<]+)<\/a>/i);
      if (authorMatch) {
        author = authorMatch[1].trim();
      } else {
        const titleAuthor = titleRaw.match(/by\s+([a-zA-Z0-9_\u0600-\u06FF-]+)/i);
        if (titleAuthor) author = titleAuthor[1];
      }

      const avatarMatch = (contentRaw || itemXml).match(/<div class="avatar">[\s\S]*?<img src="([^"]+)"/i);
      if (avatarMatch) {
        authorAvatar = avatarMatch[1];
      }

      // Extract symbol
      let symbol = 'MARKET';
      let symbolName = '';
      const symbolMatch = (contentRaw || itemXml).match(/<div class="chart-symbol">[\s\S]*?<a[^>]*>([^<]+)<\/a>(?:[\s\S]*?<span class="symbol-descr">([^<]+)<\/span>)?/i);
      if (symbolMatch) {
        symbolName = symbolMatch[1].trim();
        const descr = symbolMatch[2] ? symbolMatch[2].trim() : '';
        const colonMatch = descr.match(/:([A-Z0-9]+)/i);
        if (colonMatch) {
          symbol = colonMatch[1].toUpperCase();
        } else {
          symbol = symbolName.toUpperCase();
        }
      } else {
        const symFromLink = link.match(/\/chart\/([A-Z0-9]+)\//i);
        if (symFromLink) {
          symbol = symFromLink[1].toUpperCase();
        } else {
          const symFromTitle = titleRaw.match(/\b([A-Z]{3,6}|XAUUSD|BTCUSD|US30|NAS100)\b/i);
          if (symFromTitle) symbol = symFromTitle[1].toUpperCase();
        }
      }

      // Format description text
      const cleanDesc = cleanXmlText(descRaw || contentRaw);
      const cleanTitle = cleanXmlText(titleRaw)
        .replace(/\s+for\s+[A-Z0-9_-]+:[A-Z0-9_-]+\s+by\s+[^\s]+/gi, '')
        .replace(/\s+by\s+[^\s]+$/gi, '')
        .replace(/\s*—\s*TradingView$/i, '')
        .trim();

      // Asset Class
      let categoryKey = 'technical';
      let assetClass = 'Forex';
      if (['XAUUSD', 'XAGUSD', 'GOLD', 'SILVER', 'OIL', 'WTI', 'BRENT', 'USOIL'].includes(symbol)) {
        categoryKey = 'technical';
        assetClass = 'Commodities';
      } else if (['BTCUSD', 'ETHUSD', 'SOLUSD', 'BNBUSD', 'XRPUSD', 'BITCOIN'].includes(symbol)) {
        categoryKey = 'algo';
        assetClass = 'Crypto';
      } else if (['US30', 'NAS100', 'SPX500', 'GER40', 'UK100'].includes(symbol)) {
        categoryKey = 'strategies';
        assetClass = 'Indices';
      } else {
        categoryKey = 'strategies';
        assetClass = 'Forex';
      }

      return {
        id: `tv-${index}-${symbol}-${Date.now()}`,
        title: cleanTitle || `${symbol} Technical Analysis`,
        symbol,
        symbolName: symbolName || symbol,
        assetClass,
        categoryKey,
        link,
        chartImage,
        author,
        authorAvatar: authorAvatar || '/assets/Images/Avatar/avatar1.png',
        pubDate: pubDate ? new Date(pubDate).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' }) : 'اليوم',
        pubDateEn: pubDate ? new Date(pubDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Today',
        rawPubDate: pubDate,
        description: cleanDesc.slice(0, 320),
        fullDescription: cleanDesc,
      };
    });

    // Apply filtering
    let filtered = parsedIdeas;
    if (filterSymbol) {
      filtered = filtered.filter((i) => i.symbol.includes(filterSymbol));
    }
    if (filterCategory && filterCategory !== 'all') {
      filtered = filtered.filter((i) => i.assetClass.toLowerCase() === filterCategory || i.categoryKey === filterCategory);
    }

    return NextResponse.json({
      success: true,
      count: filtered.length,
      items: filtered.slice(0, limit),
    });
  } catch (err) {
    console.error('[TradingView Feed API Error]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch TradingView feed' },
      { status: 500 }
    );
  }
}
