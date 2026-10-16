import { NextResponse } from 'next/server';
import { translateFullText, isArabicText } from '../../../lib/translator';

export const dynamic = 'force-dynamic';

function cleanHtmlText(str = '') {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .trim();
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

async function resolveBilingualText(text) {
  if (!text || !text.trim()) return { ar: '', en: '' };
  const trimmed = text.trim();
  const isArabic = isArabicText(trimmed);
  if (isArabic) {
    const en = await translateFullText(trimmed, 'ar', 'en');
    return { ar: trimmed, en: en || trimmed };
  } else {
    const ar = await translateFullText(trimmed, 'en', 'ar');
    return { ar: ar || trimmed, en: trimmed };
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    let rawTitle = '';
    let rawDesc = '';
    let coverImage = '';
    let canonicalUrl = '';
    let authorName = 'TradingView Analyst';
    let authorAvatar = '/assets/Images/Avatar/avatar1.webp';
    let symbol = 'FOREX';

    // 1. If payload already contains pre-parsed item from feed
    if (body.item) {
      const item = body.item;
      rawTitle = item.title || '';
      rawDesc = item.fullDescription || item.description || '';
      coverImage = item.chartImage || '';
      canonicalUrl = item.link || '';
      authorName = item.author || 'TradingView Analyst';
      authorAvatar = item.authorAvatar || '/assets/Images/Avatar/avatar1.webp';
      symbol = (item.symbol || 'FOREX').toUpperCase();
    } else {
      // 2. Fetch directly from URL
      const rawUrl = body.url ? String(body.url).trim() : '';
      if (!rawUrl || !rawUrl.includes('tradingview.com')) {
        return NextResponse.json(
          { success: false, error: 'يرجى إدخال رابط فكرة أو تحليل صحيح من TradingView' },
          { status: 400 }
        );
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);

      const res = await fetch(rawUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
        },
        cache: 'no-store',
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        return NextResponse.json(
          { success: false, error: `فشل الوصول لصفحة TradingView (HTTP ${res.status})` },
          { status: 502 }
        );
      }

      const html = await res.text();

      const getMeta = (prop) => {
        const r1 = new RegExp('<meta[^>]+(?:property|name)=["\']' + prop + '["\'][^>]+content=["\']([^"\']+)["\']', 'i');
        const r2 = new RegExp('<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\']' + prop + '["\']', 'i');
        const m1 = html.match(r1);
        if (m1) return m1[1];
        const m2 = html.match(r2);
        if (m2) return m2[1];
        return '';
      };

      rawTitle = getMeta('og:title') || getMeta('twitter:title') || '';
      rawDesc = getMeta('og:description') || getMeta('description') || '';
      coverImage = getMeta('og:image') || getMeta('twitter:image') || '';
      canonicalUrl = getMeta('og:url') || rawUrl;

      // Fallback search for S3 images in HTML if meta tags didn't contain og:image
      if (!coverImage) {
        const s3Matches = html.match(/https:\/\/s3\.tradingview\.com\/[a-zA-Z0-9_\/-]+\.(?:png|jpg|webp)/gi);
        if (s3Matches && s3Matches.length > 0) {
          const chartImgs = s3Matches.filter(u => !u.toLowerCase().includes('userpic') && !u.toLowerCase().includes('avatar'));
          if (chartImgs.length > 0) {
            coverImage = chartImgs[0];
          }
        }
      }

      // Extract author
      const authorMatch = rawTitle.match(/\bby\s+([a-zA-Z0-9_\u0600-\u06FF-]+)/i);
      if (authorMatch) {
        authorName = authorMatch[1];
      }

      // Extract symbol
      const symbolFromUrl = rawUrl.match(/\/chart\/([A-Z0-9]+)\//i) || rawUrl.match(/\/symbols\/([A-Z0-9]+)\//i);
      if (symbolFromUrl) {
        symbol = symbolFromUrl[1].toUpperCase();
      } else {
        const symbolInTitle = rawTitle.match(/\b([A-Z]{3,6}|XAUUSD|BTCUSD|US30|NAS100)\b/i);
        if (symbolInTitle) symbol = symbolInTitle[1].toUpperCase();
      }
    }

    if (!rawTitle && !rawDesc) {
      return NextResponse.json(
        { success: false, error: 'تعذر استخراج بيانات التحليل من صفحة TradingView' },
        { status: 422 }
      );
    }

    // High-res chart image upgrade
    if (coverImage && coverImage.includes('_mid.')) {
      coverImage = coverImage.replace('_mid.', '_big.');
    }

    // High quality financial visual fallback if TradingView did not include a chart image
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

    // Clean title
    let cleanTitle = cleanHtmlText(rawTitle)
      .replace(/\s+for\s+[A-Z0-9_-]+:[A-Z0-9_-]+\s+by\s+[^\s]+/gi, '')
      .replace(/\s+by\s+[^\s]+$/gi, '')
      .replace(/\s*—\s*TradingView$/i, '')
      .trim();

    if (!cleanTitle) cleanTitle = `${symbol} Technical Analysis & Market Outlook`;

    // Clean description
    const cleanDesc = cleanHtmlText(rawDesc);

    // Language identification & Bilingual resolution for title & excerpt
    const [titlePair, excerptPair] = await Promise.all([
      resolveBilingualText(cleanTitle),
      resolveBilingualText(cleanDesc.slice(0, 320)),
    ]);

    const titleAr = titlePair.ar;
    const titleEn = titlePair.en;
    const excerptAr = excerptPair.ar;
    const excerptEn = excerptPair.en;
    const isAr = isArabicText(cleanTitle) || isArabicText(cleanDesc);

    // Categorization & Styling
    let categoryKey = 'technical';
    let categoryAr = 'التحليل الفني';
    let categoryEn = 'Technical Analysis';
    let accentColor = '#0488F8';

    if (['XAUUSD', 'XAGUSD', 'GOLD', 'SILVER'].includes(symbol)) {
      categoryKey = 'technical';
      categoryAr = 'التحليل الفني للذهب والسلع';
      categoryEn = 'Commodities & Technical Analysis';
      accentColor = '#FB8704';
    } else if (['BTCUSD', 'ETHUSD', 'SOLUSD', 'CRYPTO'].includes(symbol)) {
      categoryKey = 'algo';
      categoryAr = 'العملات الرقمية والأصول المشفرة';
      categoryEn = 'Crypto & Digital Assets';
      accentColor = '#F7931A';
    } else if (['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD'].includes(symbol)) {
      categoryKey = 'strategies';
      categoryAr = 'استراتيجيات تداول الفوركس';
      categoryEn = 'Forex Trading Strategies';
      accentColor = '#0488F8';
    } else if (['US30', 'NAS100', 'SPX500'].includes(symbol)) {
      categoryKey = 'strategies';
      categoryAr = 'تحليل المؤشرات والأسهم العالمية';
      categoryEn = 'Indices & Global Equities';
      accentColor = '#16C784';
    }

    // Split text into intelligent editorial sections
    const paragraphs = cleanDesc
      .split('\n')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    let sec1Text = '';
    let sec2Text = '';
    let sec3Text = '';

    if (paragraphs.length >= 3) {
      sec1Text = paragraphs.slice(0, Math.ceil(paragraphs.length / 3)).join('\n\n');
      sec2Text = paragraphs.slice(Math.ceil(paragraphs.length / 3), Math.ceil((paragraphs.length * 2) / 3)).join('\n\n');
      sec3Text = paragraphs.slice(Math.ceil((paragraphs.length * 2) / 3)).join('\n\n');
    } else if (paragraphs.length === 2) {
      sec1Text = paragraphs[0];
      sec2Text = paragraphs[1];
      sec3Text = isAr
        ? `متابعة حركة السعر ومناطق السيولة المستهدفة للزوج ${symbol}، مع ضرورة الالتزام بنسبة وقف خسارة واضحة وانتظار تأكيد الشموع على الفريمات الأكبر قبل الدخول.`
        : `Monitoring price action and key liquidity pools for ${symbol}, with a defined stop-loss and patience for higher timeframe candle confirmation.`;
    } else {
      sec1Text = cleanDesc || `${symbol} Technical Analysis & Market Outlook`;
      sec2Text = isAr
        ? `تظهر حركة السعر للزوج ${symbol} مستويات مفصلية تتطلب مراقبة رد فعل السيولة وأحجام التداول اللحظية. يُفضل مراقبة مناطق الكسر وإعادة الاختبار (Break & Retest) لتحديد نقاط الدخول الآمنة.`
        : `The price action for ${symbol} highlights critical pivot zones requiring close observation of liquidity reaction and real-time volume. Focus on break-and-retest setups for optimal entries.`;
      sec3Text = isAr
        ? `خطة التداول تعتمد على الالتزام الصارم بقواعد إدارة المخاطر، بحيث لا تتجاوز نسبة المخاطرة 1% إلى 2% من إجمالي رأس المال مع تعيين وقف خسارة واضح عند أقرب قمة أو قاع هيكلي.`
        : `Risk management remains paramount: limit exposure to 1%-2% per setup, with disciplined stops placed beyond structural swing highs or lows.`;
    }

    // Translate section bodies concurrently with proper language pairs
    const [pair1, pair2, pair3] = await Promise.all([
      resolveBilingualText(sec1Text),
      resolveBilingualText(sec2Text),
      resolveBilingualText(sec3Text),
    ]);

    const body1Ar = pair1.ar;
    const body1En = pair1.en;
    const body2Ar = pair2.ar;
    const body2En = pair2.en;
    const body3Ar = pair3.ar;
    const body3En = pair3.en;

    const { dateAr, dateEn } = getFormattedDates();

    // Key Takeaways
    const keyTakeawaysAr = [
      `تحليل هيكل حركة السعر وتدفق السيولة اللحظية للزوج ${symbol}.`,
      `متابعة مناطق الدعم والمقاومة ومستويات العرض والطلب الموضحة بدقة على الشارت.`,
      `انتظار إغلاق الشمعة الشفاف لتجنب الاختراقات الكاذبة (Fakeouts).`,
      `إدارة رأس المال الصارمة وتحديد نسبة العائد إلى المخاطرة (1:2 كحد أدنى).`,
    ];

    const keyTakeawaysEn = [
      `Price action structure and real-time liquidity flow analysis for ${symbol}.`,
      `Monitor key support/resistance and supply/demand zones highlighted on the chart.`,
      `Wait for confirmed candle closures to filter out market fakeouts.`,
      `Strict risk management targeting a minimum 1:2 Risk-to-Reward ratio.`,
    ];

    // Structured Sections with Pro Tips (FXENGIN style)
    const sections = [
      {
        id: 'sec-overview',
        headingAr: `1. نظرة عامة على هيكل السوق والاتجاه (${symbol})`,
        headingEn: `1. Market Structure & Directional Bias (${symbol})`,
        bodyAr: body1Ar,
        bodyEn: body1En,
        tipAr: `لا تدخل الصفقة بمجرد ملامسة السعر للمستوى؛ انتظر تشكل نموذج انعكاسي كشمعة الابتلاع (Engulfing) أو نموذج المطرقة (Pin Bar).`,
        tipEn: `Never execute solely on level touch; wait for confirmed price action triggers such as engulfing or pin bar rejections.`,
      },
      {
        id: 'sec-scenarios',
        headingAr: `2. المستويات السعرية الحاسمة وسيناريوهات التداول`,
        headingEn: `2. Critical Price Zones & Trade Scenarios`,
        bodyAr: body2Ar,
        bodyEn: body2En,
        tipAr: `توافق مستويات الدعم والمقاومة مع مستويات تصحيح فيبوناتشي (0.5 - 0.618) يرفع احتمالية نجاح الصفقة بشكل ملحوظ.`,
        tipEn: `Confluence between horizontal structure and Fibonacci retracements (0.5 - 0.618) significantly improves win-rate.`,
      },
      {
        id: 'sec-risk-mgmt',
        headingAr: `3. خطة الدخول وإدارة المخاطر وتأكيد الشموع`,
        headingEn: `3. Execution Plan & Risk Management Rules`,
        bodyAr: body3Ar,
        bodyEn: body3En,
        tipAr: `احرص دائماً على أن يكون وقف الخسارة خلف المنطقة الهيكلية الآمنة ولا تخاطر بأكثر من 1.5% من محفظتك.`,
        tipEn: `Always place stops beyond structural validation points and restrict risk exposure to under 1.5% of total capital.`,
      },
    ];

    // Interactive FAQs (FXENGIN style)
    const faqs = [
      {
        qAr: `ما هو الإطار الزمني المعتمد في هذا التحليل الفني؟`,
        qEn: `What is the primary timeframe used for this analysis?`,
        aAr: `يعتمد التحليل على الأطر الزمنية المتوسطة والكبرى (H1 / H4) لتحديد الاتجاه الرئيسي، مع إمكانية استخدام إطار 15 دقيقة لتحديد نقاط الدخول الدقيقة.`,
        aEn: `The setup leverages higher timeframes (H1 / H4) for directional bias, and M15 for optimal entry refinement.`,
      },
      {
        qAr: `كيف يتم تأكيد إشارة الدخول بأمان للزوج (${symbol})؟`,
        qEn: `How do I safely confirm an entry signal for (${symbol})?`,
        aAr: `من خلال انتظار إغلاق شمعة صريحة خارج منطقة التذبذب أو إعادة اختبار منطقة الدعم/المقاومة مع حجم تداول مؤكد.`,
        aEn: `By confirming a decisive candle close outside consolidation or an impulse retest with corresponding volume expansion.`,
      },
      {
        qAr: `ما هو مصدر هذا التحليل والشارت المرفق؟`,
        qEn: `What is the origin of this analysis and attached chart?`,
        aAr: `تم إعداد وتنسيق هذا التحليل الفني بواسطة كبير محللي الأسواق م. سليمان داود استناداً إلى أحدث بيانات وحركة شارتات TradingView العالمية.`,
        aEn: `Curated and structured by Chief Market Strategist Eng. Sleman Daowed based on live verified TradingView chart data.`,
      },
    ];

    const tags = ['TradingView', symbol, 'Technical Analysis', 'Price Action', 'Market Outlook'];

    const article = {
      titleAr,
      titleEn,
      excerptAr,
      excerptEn,
      categoryKey,
      category: categoryAr,
      categoryEn,
      symbol,
      coverImage,
      chartImage: coverImage,
      tradingViewUrl: canonicalUrl,
      authorAr: 'م. سليمان داود',
      authorEn: 'Eng. Sleman Daowed',
      authorRoleAr: 'كبير محللي الأسواق',
      authorRoleEn: 'Chief Market Strategist',
      authorImg: '/assets/Images/Avatar/avatar1.webp',
      authorBioAr: 'خبير أسواق مالية ومحلل فني معتمد بخبرة تزيد عن 14 عاماً في تداول العملات والسلع وإدارة المحافظ الاستثمارية.',
      authorBioEn: 'Certified financial analyst & market strategist with 14+ years of trading experience across global FX, commodities, and asset management.',
      dateAr,
      dateEn,
      readTimeAr: '4 دقائق قراءة',
      readTimeEn: '4 min read',
      views: '1.2K',
      featured: false,
      accentColor,
      tags,
      keyTakeawaysAr,
      keyTakeawaysEn,
      sections,
      faqs,
      status: 'DRAFT',
    };

    return NextResponse.json({
      success: true,
      article,
      source: {
        url: canonicalUrl,
        author: authorName,
        symbol,
        coverImage,
      },
    });
  } catch (err) {
    console.error('[TradingView Fetch & Transform Error]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'فشل في جلب وتحويل مقال TradingView' },
      { status: 500 }
    );
  }
}
