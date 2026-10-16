import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { sendArticleToN8n } from '../../../utils/n8nWebhook';

const DATA_FILE = path.join(process.cwd(), 'data', 'articles.json');
const DEFAULT_WEBHOOK_SECRET = process.env.TRADINGVIEW_WEBHOOK_SECRET || 'fx_tradingview_webhook_secret_2026';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-webhook-secret',
  };
}

function readArticles() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading articles.json:', err);
  }
  return [];
}

function writeArticles(articles) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(articles, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing articles.json:', err);
    return false;
  }
}

// Quick translation helper
async function translateText(text, from = 'en', to = 'ar') {
  if (!text || !text.trim()) return '';
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.trim().slice(0, 450))}&langpair=${from}|${to}`;
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(t);
    if (res.ok) {
      const data = await res.json();
      const translated = data.responseData?.translatedText;
      if (translated && !translated.startsWith('MYMEMORY WARNING')) {
        return translated
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>');
      }
    }
  } catch (err) {
    console.warn('[Webhook Translate]:', err.message);
  }
  return text;
}

function isArabicText(text) {
  if (!text) return false;
  return /[\u0600-\u06FF\u0750-\u077F]/.test(text);
}

function getFormattedDates() {
  const now = new Date();
  const monthsAr = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  const monthsEn = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const day = now.getDate();
  const year = now.getFullYear();
  return {
    dateAr: `${day} ${monthsAr[now.getMonth()]} ${year}`,
    dateEn: `${monthsEn[now.getMonth()]} ${day}, ${year}`,
  };
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

// GET /api/articles/webhook - Information & Health Check
export async function GET(req) {
  return NextResponse.json(
    {
      status: 'active',
      service: 'TradingView Articles & Alerts Webhook Receiver',
      supportedMethods: ['POST'],
      instructions: 'Send a POST request with JSON payload containing your TradingView alert message.',
      samplePayload: {
        secret: 'fx_tradingview_webhook_secret_2026',
        title: 'EURUSD Bullish Reversal at Daily Order Block',
        content: 'Price tapped key 1.0820 liquidity pool with strong 1H rejection. Targeting 1.0920 supply.',
        symbol: 'EURUSD',
        action: 'BUY',
        imageUrl: 'https://s3.tradingview.com/...',
        tradingViewUrl: 'https://www.tradingview.com/chart/...',
        author: 'TradingView Desk',
      },
    },
    { status: 200, headers: corsHeaders() }
  );
}

// POST /api/articles/webhook - Ingest Article/Alert
export async function POST(req) {
  try {
    const { searchParams } = new URL(req.url);
    const querySecret = searchParams.get('secret');
    const headerSecret = req.headers.get('x-webhook-secret');

    // Read payload (support both JSON and raw string)
    let payload = {};
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      payload = await req.json();
    } else {
      const rawText = await req.text();
      try {
        payload = JSON.parse(rawText);
      } catch {
        payload = { title: 'TradingView Alert', content: rawText };
      }
    }

    // Validate Secret Key
    const providedSecret = payload.secret || querySecret || headerSecret;
    if (providedSecret !== DEFAULT_WEBHOOK_SECRET) {
      return NextResponse.json(
        { success: false, error: 'مفتاح التفويض غير صحيح (Invalid Webhook Secret)' },
        { status: 401, headers: corsHeaders() }
      );
    }

    const symbol = (payload.symbol || payload.ticker || 'FOREX').toUpperCase();
    const rawTitle = payload.title || `${symbol} ${payload.action || 'Market Analysis'} (${new Date().toLocaleDateString()})`;
    const rawContent = payload.content || payload.message || payload.body || `تحليل وتنبيه فني جديد تم استقباله تلقائياً للزوج ${symbol}.`;
    let coverImage = payload.imageUrl || payload.image || payload.chartImage || '';
    const tradingViewUrl = payload.tradingViewUrl || payload.url || '';
    const authorName = payload.author || 'TradingView Automated Desk';

    // Auto-fetch TradingView chart image if missing but tradingViewUrl is provided
    if (!coverImage && tradingViewUrl && tradingViewUrl.includes('tradingview.com')) {
      try {
        const tvController = new AbortController();
        const tvTimeout = setTimeout(() => tvController.abort(), 4000);
        const tvRes = await fetch(tradingViewUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
          signal: tvController.signal,
        });
        clearTimeout(tvTimeout);
        if (tvRes.ok) {
          const html = await tvRes.text();
          const m = html.match(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]+content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image)["']/i);
          if (m && m[1]) {
            coverImage = m[1].replace('_mid.', '_big.');
          } else {
            const s3 = html.match(/https:\/\/s3\.tradingview\.com\/[a-zA-Z0-9_\/-]+\.(?:png|jpg|webp)/i);
            if (s3 && !s3[0].toLowerCase().includes('userpic')) {
              coverImage = s3[0].replace('_mid.', '_big.');
            }
          }
        }
      } catch (e) {
        console.warn('Webhook auto-fetch TV image error:', e.message);
      }
    }

    if (!coverImage) {
      if (['XAUUSD', 'XAGUSD', 'GOLD', 'SILVER'].includes(symbol)) {
        coverImage = 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=1200&q=80';
      } else if (['BTCUSD', 'ETHUSD', 'SOLUSD', 'CRYPTO', 'BITCOIN'].includes(symbol)) {
        coverImage = 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=1200&q=80';
      } else if (['US30', 'NAS100', 'SPX500', 'GER40'].includes(symbol)) {
        coverImage = 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=1200&q=80';
      } else if (['OIL', 'USOIL', 'BRENT'].includes(symbol)) {
        coverImage = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80';
      } else {
        coverImage = 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80';
      }
    }

    // Bilingual processing
    const isAr = isArabicText(rawTitle) || isArabicText(rawContent);
    let titleAr = '';
    let titleEn = '';
    let excerptAr = '';
    let excerptEn = '';

    if (isAr) {
      titleAr = rawTitle;
      titleEn = await translateText(rawTitle, 'ar', 'en');
      excerptAr = rawContent.slice(0, 260);
      excerptEn = await translateText(excerptAr, 'ar', 'en');
    } else {
      titleEn = rawTitle;
      titleAr = await translateText(rawTitle, 'en', 'ar');
      excerptEn = rawContent.slice(0, 260);
      excerptAr = await translateText(excerptEn, 'en', 'ar');
    }

    const bodyAr = isAr ? rawContent : await translateText(rawContent, 'en', 'ar');
    const bodyEn = !isAr ? rawContent : await translateText(rawContent, 'ar', 'en');

    // Read existing articles
    const articles = readArticles();
    const maxNumId = articles.reduce((max, a) => {
      const num = Number(a.id);
      return !isNaN(num) && num > max ? num : max;
    }, 0);
    const newId = maxNumId + 1;

    const generatedSlug = (titleEn || `tradingview-${symbol}-${newId}`)
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '') || `tradingview-${newId}`;

    const { dateAr, dateEn } = getFormattedDates();

    const newArticle = {
      id: newId,
      slug: generatedSlug,
      categoryKey: payload.categoryKey || 'technical',
      category: 'التحليل الفني',
      categoryEn: 'Technical Analysis',
      titleAr,
      titleEn,
      excerptAr,
      excerptEn,
      authorAr: 'م. سليمان داود',
      authorEn: 'Eng. Sleman Daowed',
      authorRoleAr: 'كبير محللي الأسواق',
      authorRoleEn: 'Chief Market Strategist',
      authorImg: '/assets/Images/Avatar/avatar1.webp',
      authorBioAr: 'خبير أسواق مالية ومحلل فني معتمد لدى منصة FXENGIN بخبرة واسعة في تداول العملات والسلع وتحليل حركة الأسعار.',
      authorBioEn: 'Certified market strategist and technical analyst at FXENGIN, specializing in forex, commodities, and price action dynamics.',
      dateAr,
      dateEn,
      readTimeAr: '3 دقائق قراءة',
      readTimeEn: '3 min read',
      featured: Boolean(payload.featured),
      views: '1',
      tags: payload.tags || ['TradingView', symbol, 'Forex', 'Signals'],
      accentColor: '#0488F8',
      symbol,
      coverImage,
      chartImage: coverImage,
      tradingViewUrl,
      keyTakeawaysAr: [
        `إشارة وتحديث حركة السعر للزوج ${symbol}.`,
        payload.action ? `الاتجاه المقترح: ${payload.action}` : 'متابعة كسر وإعادة اختبار المستويات الرئيسية.',
        'تأكيد الشموع وإدارة رأس المال بحجم عقد آمن.',
      ],
      keyTakeawaysEn: [
        `Price action and momentum alert for ${symbol}.`,
        payload.action ? `Signal Bias: ${payload.action}` : 'Monitor breakout and retest confirmation.',
        'Apply disciplined position sizing and wait for candle close.',
      ],
      sections: [
        {
          id: 'tv-signal-outlook',
          headingAr: `1. تفاصيل التحليل والتنبيه (${symbol})`,
          headingEn: `1. Signal Details & Market Outlook (${symbol})`,
          bodyAr,
          bodyEn,
          tipAr: `تم إعداد هذا التحليل للزوج ${symbol}. يرجى مراجعة حركة السعر ومستويات الدخول بدقة قبل التنفيذ.`,
          tipEn: `Prepared for ${symbol}. Please verify price action and entry parameters carefully before execution.`,
        },
      ],
      faqs: [
        {
          qAr: `ما هي طبيعة هذا التقرير الفني؟`,
          qEn: `What is the nature of this market analysis?`,
          aAr: `تقرير تحليلي فني للزوج ${symbol} مبني على حركة السعر والسيولة اللحظية ومُعد تحت إشراف م. سليمان داود في منصة FXENGIN.`,
          aEn: `Technical analysis setup for ${symbol} tracking real-time liquidity and price action under Eng. Sleman Daowed at FXENGIN.`,
        },
      ],
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    articles.unshift(newArticle);
    writeArticles(articles);

    // Automatically dispatch to n8n news webhook
    let n8nDispatchResult = null;
    try {
      n8nDispatchResult = await sendArticleToN8n(newArticle, {
        event: 'tradingview.alert',
        source: 'tradingview',
      });
    } catch (n8nErr) {
      console.warn('[TradingView Webhook]: Failed to dispatch to n8n:', n8nErr.message);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'تم استقبال التحليل وحفظه كمسودة في الداشبورد للمراجعة وإرساله للويبهوك',
        article: {
          id: newArticle.id,
          slug: newArticle.slug,
          titleAr: newArticle.titleAr,
          titleEn: newArticle.titleEn,
          url: `/blog/${newArticle.id}`,
        },
        n8nWebhook: {
          dispatched: Boolean(n8nDispatchResult?.success),
          status: n8nDispatchResult?.status || null,
        },
      },
      { status: 201, headers: corsHeaders() }
    );
  } catch (err) {
    console.error('[TradingView Webhook Ingestion Error]:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: corsHeaders() }
    );
  }
}
