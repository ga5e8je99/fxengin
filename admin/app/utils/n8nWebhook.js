/**
 * @file n8nWebhook.js
 * Utility to dispatch articles/blogs to the n8n news webhook from Admin Dashboard
 * Webhook Target: https://n8n-p4oh.srv1867849.hstgr.cloud/webhook/news
 */

export const DEFAULT_N8N_NEWS_WEBHOOK = 'https://n8n-p4oh.srv1867849.hstgr.cloud/webhook/news';

export function getN8nWebhookUrl() {
  return process.env.N8N_NEWS_WEBHOOK_URL || DEFAULT_N8N_NEWS_WEBHOOK;
}

/**
 * Clean and combine section bodies into a coherent plain text/markdown string
 */
function extractFullContent(sections = [], lang = 'ar') {
  if (!Array.isArray(sections) || sections.length === 0) return '';
  return sections
    .map((sec) => {
      const heading = lang === 'ar' ? (sec.headingAr || sec.headingEn || '') : (sec.headingEn || sec.headingAr || '');
      const body = lang === 'ar' ? (sec.bodyAr || sec.bodyEn || '') : (sec.bodyEn || sec.bodyAr || '');
      const tip = lang === 'ar' ? (sec.tipAr || '') : (sec.tipEn || '');
      let out = '';
      if (heading) out += `### ${heading}\n\n`;
      if (body) out += `${body}\n\n`;
      if (tip) out += `> ${tip}\n\n`;
      return out.trim();
    })
    .filter(Boolean)
    .join('\n\n');
}

/**
 * Format article into a rich, structured payload for n8n
 */
export function formatArticlePayload(article, { event = 'article.created', source } = {}) {
  const contentAr = extractFullContent(article.sections, 'ar') || article.contentAr || article.content || article.excerptAr || '';
  const contentEn = extractFullContent(article.sections, 'en') || article.contentEn || article.content || article.excerptEn || '';

  const siteBase = process.env.NEXT_PUBLIC_MAIN_SITE_URL || 'https://fxengin.com';
  const articleUrl = `${siteBase}/blog/${article.slug || article.id}`;
  const coverImage = article.coverImage || article.chartImage || article.imageUrl || '';

  // Determine whether this article originates from TradingView or manual authoring
  const isFromTradingView = Boolean(
    source === 'tradingview' ||
    article.tradingViewUrl ||
    (Array.isArray(article.tags) && article.tags.some((t) => String(t).toLowerCase().includes('tradingview')))
  );

  const resolvedSource = source || (isFromTradingView ? 'tradingview' : 'manual');
  const mainTitle = article.titleAr || article.titleEn || 'مقال جديد';
  const mainContent = contentAr || contentEn;
  const mainExcerpt = article.excerptAr || article.excerptEn || '';

  return {
    event, // 'article.created' | 'article.published' | 'article.updated' | 'tradingview.alert' | 'article.sync'
    source: resolvedSource, // 'tradingview' | 'manual' | 'admin' | 'api'
    isTradingView: isFromTradingView,
    timestamp: new Date().toISOString(),
    id: article.id,
    slug: article.slug || `article-${article.id}`,
    url: articleUrl,
    link: articleUrl,
    localUrl: `/blog/${article.slug || article.id}`,

    // Primary content fields
    title: mainTitle,
    titleAr: article.titleAr || '',
    titleEn: article.titleEn || '',
    excerpt: mainExcerpt,
    excerptAr: article.excerptAr || '',
    excerptEn: article.excerptEn || '',
    content: mainContent,
    contentAr,
    contentEn,

    // Convenient aliases for common n8n nodes (Telegram, Discord, Slack, WordPress, Twitter)
    text: mainContent || mainExcerpt || mainTitle,
    message: mainContent || mainExcerpt || mainTitle,
    description: mainExcerpt || mainContent.slice(0, 300),
    image: coverImage,
    imageUrl: coverImage,
    chartImage: article.chartImage || coverImage,
    coverImage,
    tradingViewUrl: article.tradingViewUrl || '',

    // Categorization & metadata
    category: article.category || 'عام',
    categoryEn: article.categoryEn || 'General',
    categoryKey: article.categoryKey || 'technical',
    symbol: (article.symbol || '').toUpperCase(),

    // Author
    author: article.authorAr || article.authorEn || 'FXENGIN',
    authorAr: article.authorAr || 'م. سليمان داود',
    authorEn: article.authorEn || 'Eng. Sleman Daowed',
    authorRole: article.authorRoleAr || 'كبير محللي الأسواق',
    authorRoleEn: article.authorRoleEn || 'Chief Market Strategist',
    authorImg: article.authorImg || '/assets/Images/Avatar/avatar1.png',
    authorBioAr: article.authorBioAr || '',
    authorBioEn: article.authorBioEn || '',

    // Taxonomies & structure
    tags: Array.isArray(article.tags) ? article.tags : [],
    keyTakeaways: Array.isArray(article.keyTakeawaysAr) && article.keyTakeawaysAr.length > 0
      ? article.keyTakeawaysAr
      : (Array.isArray(article.keyTakeawaysEn) ? article.keyTakeawaysEn : []),
    keyTakeawaysAr: Array.isArray(article.keyTakeawaysAr) ? article.keyTakeawaysAr : [],
    keyTakeawaysEn: Array.isArray(article.keyTakeawaysEn) ? article.keyTakeawaysEn : [],
    sections: Array.isArray(article.sections) ? article.sections : [],
    faqs: Array.isArray(article.faqs) ? article.faqs : [],
    status: article.status || 'PUBLISHED',
    featured: Boolean(article.featured),
    readTime: article.readTimeAr || article.readTimeEn || '5 دقائق قراءة',
    readTimeAr: article.readTimeAr || '5 دقائق قراءة',
    readTimeEn: article.readTimeEn || '5 min read',
    accentColor: article.accentColor || '#0488F8',
    createdAt: article.createdAt || new Date().toISOString(),
    updatedAt: article.updatedAt || new Date().toISOString(),
    rawArticle: article,
  };
}

/**
 * Dispatch an article to the n8n news webhook
 * @param {Object} article - The article object
 * @param {Object} options - Options including event and source
 * @returns {Promise<{success: boolean, status?: number, response?: any, error?: string}>}
 */
export async function sendArticleToN8n(article, options = {}) {
  const webhookUrl = getN8nWebhookUrl();

  if (!webhookUrl) {
    console.warn('[n8n Webhook]: Webhook URL is not defined');
    return { success: false, error: 'Webhook URL not configured' };
  }

  const payload = formatArticlePayload(article, options);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'FXENGIN-Admin-Dispatcher/1.0',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseText = await res.text();
    let responseData = responseText;
    try {
      responseData = JSON.parse(responseText);
    } catch {}

    if (res.ok) {
      console.log(`[n8n Webhook]: Successfully dispatched article "${payload.title}" (ID: ${payload.id}) - HTTP ${res.status}`);
      return {
        success: true,
        status: res.status,
        response: responseData,
      };
    } else {
      console.warn(`[n8n Webhook]: Upstream returned HTTP ${res.status}:`, responseText);
      return {
        success: false,
        status: res.status,
        error: `HTTP ${res.status}: ${responseText}`,
      };
    }
  } catch (err) {
    clearTimeout(timeoutId);
    console.error(`[n8n Webhook Error]: Failed to dispatch article "${article.titleAr || article.titleEn || article.id}":`, err.message);
    return {
      success: false,
      error: err.message,
    };
  }
}

/**
 * Dispatch multiple articles sequentially with a small delay
 */
export async function sendBulkArticlesToN8n(articles = [], options = {}) {
  if (!Array.isArray(articles) || articles.length === 0) {
    return { success: true, count: 0, results: [] };
  }

  const results = [];
  for (const article of articles) {
    const res = await sendArticleToN8n(article, options);
    results.push({ id: article.id, title: article.titleAr || article.titleEn, ...res });
    // Small breathing pause between requests
    await new Promise((r) => setTimeout(r, 150));
  }

  const successful = results.filter((r) => r.success).length;
  return {
    success: successful > 0,
    total: articles.length,
    successful,
    failed: articles.length - successful,
    results,
  };
}
