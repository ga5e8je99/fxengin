/**
 * @file pageService.js
 * Service for managing Static & Legal CMS Pages from the FXENGIN Admin Studio.
 * Interfaces with local /api/pages and main site http://localhost:3000/api/pages.
 */

const MAIN_API_BASE = process.env.NEXT_PUBLIC_MAIN_SITE_URL || 'http://localhost:3000';

export const PAGE_CATEGORIES = [
  { key: 'ALL', labelAr: 'جميع الصفحات', labelEn: 'All Pages' },
  { key: 'company', labelAr: 'أقسام الشركة (Company)', labelEn: 'Company' },
  { key: 'legal', labelAr: 'الدعم القانوني والامتثال (Legal)', labelEn: 'Legal & Support' },
];

async function fetchPagesEndpoint(endpoint, options = {}) {
  // 1. Local same-origin
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch(endpoint, options);
      if (res.ok) return res;
    } catch (err) {
      // fallback
    }
  }

  // 2. Main site endpoint
  try {
    const url = `${MAIN_API_BASE}${endpoint}`;
    const res = await fetch(url, options);
    if (res.ok) return res;
  } catch (err) {
    // fallback
  }

  return null;
}

export async function getPagesList(category = null) {
  const query = category && category !== 'ALL' ? `?category=${encodeURIComponent(category)}` : '';
  const endpoint = `/api/pages${query}`;

  try {
    const res = await fetchPagesEndpoint(endpoint, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (res) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.pages)) {
        return data.pages;
      }
    }
  } catch (err) {
    console.error('Failed to fetch pages:', err);
  }

  return [];
}

export async function getPageBySlug(slug) {
  if (!slug) return null;
  const endpoint = `/api/pages?slug=${encodeURIComponent(slug)}`;

  try {
    const res = await fetchPagesEndpoint(endpoint, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (res) {
      const data = await res.json();
      if (data && data.success && data.page) {
        return data.page;
      }
    }
  } catch (err) {
    console.error(`Failed to fetch page ${slug}:`, err);
  }

  return null;
}

export async function updatePage(slug, pageData) {
  const endpoint = '/api/pages';
  const payload = { slug, ...pageData };

  try {
    const res = await fetchPagesEndpoint(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (res) {
      const data = await res.json();
      if (data && data.success) {
        return { success: true, page: data.page, message: data.message };
      }
      return { success: false, error: data?.error || 'فشل حفظ التعديلات' };
    }
  } catch (err) {
    console.error(`Failed to update page ${slug}:`, err);
    return { success: false, error: err.message || 'خطأ في الاتصال' };
  }

  return { success: false, error: 'تعذر الاتصال بواجهة برمجة التطبيقات' };
}
