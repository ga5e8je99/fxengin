/**
 * @file articleService.js
 * Service for managing Articles, Blogs & Market Research from Admin Dashboard
 * Communicates with local API (/api/articles) and main platform API (http://localhost:3000/api/articles)
 * with robust fallback and automatic n8n news webhook dispatching.
 */

const MAIN_API_BASE = process.env.NEXT_PUBLIC_MAIN_SITE_URL || 'http://localhost:3000';
const STORAGE_KEY = 'fxengin_admin_articles_cache';

export const ARTICLE_CATEGORIES = [
  { key: 'strategies', labelAr: 'استراتيجيات التداول', labelEn: 'Trading Strategies' },
  { key: 'technical', labelAr: 'التحليل الفني', labelEn: 'Technical Analysis' },
  { key: 'risk', labelAr: 'إدارة المخاطر', labelEn: 'Risk Management' },
  { key: 'algo', labelAr: 'الذكاء الاصطناعي والتداول الآلي', labelEn: 'Algo & AI' },
  { key: 'psychology', labelAr: 'سيكولوجية التداول', labelEn: 'Psychology' },
];

/**
 * Helper to attempt fetch on local endpoint first, then fallback to MAIN_API_BASE
 */
async function fetchArticlesEndpoint(endpoint, options = {}) {
  // 1. Try local same-origin API route (works in browser without CORS/port friction)
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch(endpoint, options);
      if (res.ok) {
        return res;
      }
    } catch (err) {
      // Local fetch failed, continue to fallback
    }
  }

  // 2. Try MAIN_API_BASE
  try {
    const url = `${MAIN_API_BASE}${endpoint}`;
    const res = await fetch(url, options);
    if (res.ok) {
      return res;
    }
  } catch (err) {
    // MAIN_API_BASE failed
  }

  return null;
}

/**
 * Fetch list of articles from API, fallback to localStorage or default seed
 */
export async function getArticlesList(category = null) {
  const query = category && category !== 'ALL' ? `?category=${encodeURIComponent(category)}` : '';
  const endpoint = `/api/articles${query}`;

  try {
    const res = await fetchArticlesEndpoint(endpoint, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (res) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(json.data));
        }
        return json.data;
      }
    }
  } catch (err) {
    console.warn('Network error reaching /api/articles, using local cache:', err.message);
  }

  // Fallback to localStorage
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {}
    }
  }

  return [];
}

/**
 * Fetch single article by ID or slug
 */
export async function getArticleById(idOrSlug) {
  const endpoint = `/api/articles?id=${encodeURIComponent(idOrSlug)}`;
  try {
    const res = await fetchArticlesEndpoint(endpoint, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (res) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch article details:', err.message);
  }

  const list = await getArticlesList();
  return list.find((a) => String(a.id) === String(idOrSlug) || a.slug === String(idOrSlug)) || null;
}

/**
 * Add a new article
 */
export async function createArticle(articleData) {
  try {
    const res = await fetchArticlesEndpoint('/api/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(articleData),
    });

    if (res) {
      const json = await res.json();
      if (json.success) {
        const list = await getArticlesList();
        const updated = [json.data, ...list.filter((a) => a.id !== json.data.id)];
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        }
        return { success: true, data: json.data, n8nWebhook: json.n8nWebhook };
      }
    }
  } catch (err) {
    console.warn('Failed to call POST /api/articles, using offline fallback:', err.message);
  }

  // Fallback offline add
  const list = await getArticlesList();
  const maxId = list.reduce((m, a) => (!isNaN(Number(a.id)) && Number(a.id) > m ? Number(a.id) : m), 0);
  const newId = maxId + 1;

  const newArticle = {
    id: newId,
    slug: articleData.slug || `article-${newId}`,
    ...articleData,
    status: articleData.status || 'PUBLISHED',
    createdAt: new Date().toISOString(),
  };

  const updated = [newArticle, ...list];
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  // Try to dispatch to n8n dispatch endpoint even on offline fallback
  dispatchArticleToN8n(newArticle.id).catch(() => {});

  return { success: true, data: newArticle };
}

/**
 * Update an existing article
 */
export async function updateArticle(articleData) {
  try {
    const res = await fetchArticlesEndpoint('/api/articles', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(articleData),
    });

    if (res) {
      const json = await res.json();
      if (json.success) {
        const list = await getArticlesList();
        const updated = list.map((a) => (String(a.id) === String(articleData.id) ? { ...a, ...articleData } : a));
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        }
        return { success: true, data: json.data, n8nWebhook: json.n8nWebhook };
      }
    }
  } catch (err) {
    console.warn('Failed to call PUT /api/articles, using offline fallback:', err.message);
  }

  // Fallback offline update
  const list = await getArticlesList();
  const updated = list.map((a) => (String(a.id) === String(articleData.id) ? { ...a, ...articleData } : a));
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  // Try to dispatch to n8n dispatch endpoint even on offline fallback
  dispatchArticleToN8n(articleData.id).catch(() => {});

  return { success: true, data: articleData };
}

/**
 * Delete an article by ID and/or slug
 */
export async function deleteArticle(id, slug = null) {
  try {
    const params = new URLSearchParams();
    if (id) params.set('id', String(id));
    if (slug) params.set('slug', String(slug));

    const res = await fetchArticlesEndpoint(`/api/articles?${params.toString()}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, slug }),
    });

    if (res) {
      const json = await res.json();
      if (json.success) {
        if (typeof window !== 'undefined') {
          const cached = localStorage.getItem(STORAGE_KEY);
          if (cached) {
            try {
              const list = JSON.parse(cached);
              const updated = list.filter((a) => String(a.id) !== String(id) && a.slug !== String(id) && (!slug || a.slug !== String(slug)));
              localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            } catch (e) {}
          }
        }
        return { success: true, deletedId: id || slug };
      }
    }
  } catch (err) {
    console.warn('Failed to call DELETE /api/articles, using offline fallback:', err.message);
  }

  // Fallback offline delete
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        const list = JSON.parse(cached);
        const updated = list.filter((a) => String(a.id) !== String(id) && a.slug !== String(id) && (!slug || a.slug !== String(slug)));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
    }
  }
  return { success: true, deletedId: id || slug };
}

/**
 * Dispatch a single article to n8n news webhook
 */
export async function dispatchArticleToN8n(id) {
  try {
    const res = await fetchArticlesEndpoint('/api/articles/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ id }),
    });

    if (res) {
      const json = await res.json().catch(() => ({}));
      if (json.success) {
        return { success: true, message: json.message || 'تم إرسال المقال إلى n8n بنجاح' };
      }
      return { success: false, error: json.error || json.message || 'فشل إرسال المقال إلى n8n' };
    }
    return { success: false, error: 'تعذر الوصول لنقطة إرسال n8n' };
  } catch (err) {
    return { success: false, error: err.message || 'خطأ في الاتصال بالخادم' };
  }
}

/**
 * Sync all articles to n8n news webhook
 */
export async function syncAllArticlesToN8n(onlyPublished = false) {
  try {
    const res = await fetchArticlesEndpoint('/api/articles/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ all: true, onlyPublished }),
    });

    if (res) {
      const json = await res.json().catch(() => ({}));
      if (json.success) {
        return { success: true, message: json.message, summary: json.summary };
      }
      return { success: false, error: json.error || json.message || 'فشل مزامنة المقالات' };
    }
    return { success: false, error: 'تعذر الوصول لنقطة مزامنة n8n' };
  } catch (err) {
    return { success: false, error: err.message || 'خطأ في الاتصال بالخادم' };
  }
}

/**
 * Test n8n news webhook connectivity
 */
export async function testN8nWebhook() {
  try {
    const res = await fetchArticlesEndpoint('/api/articles/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ test: true }),
    });

    if (res) {
      const json = await res.json().catch(() => ({}));
      return {
        success: json.success,
        message: json.message || (json.success ? 'الاتصال سليم' : 'فشل الاتصال'),
        details: json.details,
      };
    }
    return { success: false, error: 'تعذر الوصول لنقطة اختبار n8n' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
