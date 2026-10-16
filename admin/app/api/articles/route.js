import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { sendArticleToN8n } from '../../utils/n8nWebhook';

function resolveDataFile() {
  const sharedPath = path.join(process.cwd(), '..', 'fx-engin', 'data', 'articles.json');
  if (fs.existsSync(sharedPath)) {
    return sharedPath;
  }
  const localPath = path.join(process.cwd(), 'data', 'articles.json');
  return localPath;
}

// Helper to add CORS and caching headers
function corsHeaders(isPublicGet = false) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
    ...(isPublicGet ? { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' } : {}),
  };
}

function getBackendBase() {
  return (
    process.env.INTERNAL_BACKEND_URL ||
    process.env.BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    (process.env.NODE_ENV === 'production' ? 'http://fxengin-backend:3000' : 'http://localhost:5001')
  ).replace(/\/+$/, '');
}

function readArticles() {
  const dataFile = resolveDataFile();
  try {
    if (fs.existsSync(dataFile)) {
      const content = fs.readFileSync(dataFile, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading articles file in admin API:', err);
  }
  return [];
}

function writeArticles(articles) {
  const dataFile = resolveDataFile();
  try {
    const dir = path.dirname(dataFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dataFile, JSON.stringify(articles, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing articles file in admin API:', err);
    return false;
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

// GET /api/articles
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const status = searchParams.get('status');
  const idOrSlug = searchParams.get('id') || searchParams.get('slug');

  const backendBase = getBackendBase();
  try {
    const res = await fetch(`${backendBase}/articles?${searchParams.toString()}`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        const normalizedData = json.data.map((a) => {
          const sd = (typeof a.sectionsData === 'object' && a.sectionsData && !Array.isArray(a.sectionsData)) ? a.sectionsData : {};
          return {
            ...a,
            ...sd,
            category: a.category || a.categoryAr || 'التحليل الفني',
            categoryAr: a.categoryAr || a.category || 'التحليل الفني',
            categoryEn: a.categoryEn || 'Technical Analysis',
            authorAr: a.authorAr || a.authorName || 'مهندس الفوركس',
            authorEn: a.authorEn || a.authorName || 'Forex Engineer',
            authorRoleAr: a.authorRoleAr || a.authorRole || 'كبير محللي الأسواق',
            authorRoleEn: a.authorRoleEn || a.authorRole || 'Chief Market Strategist',
            readTimeAr: a.readTimeAr || `${a.readTimeMinutes || 5} دقائق قراءة`,
            readTimeEn: a.readTimeEn || `${a.readTimeMinutes || 5} min read`,
            featured: Boolean(a.featured ?? a.isFeatured),
            sections: Array.isArray(a.sectionsData) ? a.sectionsData : (sd.sections || a.sections || []),
            videoUrl: a.videoUrl || sd.videoUrl || null,
            links: Array.isArray(a.links) ? a.links : (Array.isArray(sd.links) ? sd.links : []),
            faqs: a.faqs || a.faqsData || [],
            noticeAr: a.noticeAr || sd.noticeAr || null,
            noticeEn: a.noticeEn || sd.noticeEn || null,
            disclaimerAr: a.disclaimerAr || sd.disclaimerAr || a.noticeAr || sd.noticeAr || null,
            disclaimerEn: a.disclaimerEn || sd.disclaimerEn || a.noticeEn || sd.noticeEn || null,
            keyTakeawaysAr: a.keyTakeawaysAr || sd.keyTakeawaysAr || [],
            keyTakeawaysEn: a.keyTakeawaysEn || sd.keyTakeawaysEn || [],
            chartImage: a.chartImage || sd.chartImage || a.coverImage || null,
          };
        });
        return NextResponse.json(
          { success: true, count: normalizedData.length, data: normalizedData },
          { status: 200, headers: corsHeaders(true) }
        );
      }
    }
  } catch (err) {
    console.warn('Backend /articles fetch failed in admin, falling back to JSON:', err);
  }

  let articles = readArticles();

  if (idOrSlug) {
    const found = articles.find(
      (a) => String(a.id) === String(idOrSlug) || a.slug === String(idOrSlug)
    );
    if (!found) {
      return NextResponse.json(
        { success: false, error: 'المقال غير موجود (Article not found)' },
        { status: 404, headers: corsHeaders() }
      );
    }
    return NextResponse.json(
      { success: true, data: found },
      { status: 200, headers: corsHeaders() }
    );
  }

  if (status && status !== 'ALL') {
    articles = articles.filter((a) => (a.status || 'PUBLISHED') === status);
  }

  if (category && category !== 'all' && category !== 'ALL') {
    articles = articles.filter(
      (a) => a.categoryKey === category || a.category === category || a.categoryEn === category
    );
  }

  if (search) {
    const q = search.toLowerCase().trim();
    articles = articles.filter((a) => {
      const titleAr = (a.titleAr || '').toLowerCase();
      const titleEn = (a.titleEn || '').toLowerCase();
      const excerptAr = (a.excerptAr || '').toLowerCase();
      const excerptEn = (a.excerptEn || '').toLowerCase();
      const authorAr = (a.authorAr || '').toLowerCase();
      const authorEn = (a.authorEn || '').toLowerCase();
      const tags = Array.isArray(a.tags) ? a.tags.join(' ').toLowerCase() : '';

      return (
        titleAr.includes(q) ||
        titleEn.includes(q) ||
        excerptAr.includes(q) ||
        excerptEn.includes(q) ||
        authorAr.includes(q) ||
        authorEn.includes(q) ||
        tags.includes(q)
      );
    });
  }

  return NextResponse.json(
    {
      success: true,
      count: articles.length,
      data: articles,
    },
    {
      status: 200,
      headers: corsHeaders(true),
    }
  );
}

// Helper to format date in Arabic & English
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

// POST /api/articles - Create new article
export async function POST(req) {
  try {
    const body = await req.json();

    if (!body.titleAr && !body.titleEn) {
      return NextResponse.json(
        { success: false, error: 'عنوان المقال مطلوب (Article title is required)' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const articles = readArticles();

    const maxNumId = articles.reduce((max, a) => {
      const num = Number(a.id);
      return !isNaN(num) && num > max ? num : max;
    }, 0);

    const newId = maxNumId + 1;

    const generatedSlug = (body.titleEn || body.titleAr || `article-${newId}`)
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '') || `article-${newId}`;

    const { dateAr, dateEn } = getFormattedDates();

    const categoryMap = {
      strategies: { ar: 'استراتيجيات التداول', en: 'Trading Strategies' },
      technical: { ar: 'التحليل الفني', en: 'Technical Analysis' },
      risk: { ar: 'إدارة المخاطر', en: 'Risk Management' },
      algo: { ar: 'الذكاء الاصطناعي والتداول الآلي', en: 'Algo & AI' },
      psychology: { ar: 'سيكولوجية التداول', en: 'Psychology' },
    };

    const catKey = body.categoryKey || 'strategies';
    const mappedCat = categoryMap[catKey] || { ar: body.category || 'عام', en: body.categoryEn || 'General' };

    const newArticle = {
      id: newId,
      slug: body.slug || generatedSlug,
      categoryKey: catKey,
      category: body.category || mappedCat.ar,
      categoryEn: body.categoryEn || mappedCat.en,
      titleAr: body.titleAr || body.titleEn,
      titleEn: body.titleEn || body.titleAr,
      excerptAr: body.excerptAr || '',
      excerptEn: body.excerptEn || '',
      authorAr: body.authorAr || 'م. سليمان داود',
      authorEn: body.authorEn || 'Eng. Sleman Daowed',
      authorRoleAr: body.authorRoleAr || 'كبير محللي الأسواق',
      authorRoleEn: body.authorRoleEn || 'Chief Market Strategist',
      authorImg: body.authorImg || '/assets/Images/Avatar/avatar1.webp',
      authorBioAr: body.authorBioAr || 'خبير أسواق مالية ومحلل فني معتمد لدى منصة FXENGIN بخبرة واسعة في تداول العملات والسلع وتحليل حركة الأسعار.',
      authorBioEn: body.authorBioEn || 'Certified market strategist and technical analyst at FXENGIN, specializing in forex, commodities, and price action dynamics.',
      dateAr: body.dateAr || dateAr,
      dateEn: body.dateEn || dateEn,
      readTimeAr: body.readTimeAr || '5 دقائق قراءة',
      readTimeEn: body.readTimeEn || '5 min read',
      featured: Boolean(body.featured),
      views: body.views || '1',
      tags: Array.isArray(body.tags) ? body.tags : (typeof body.tags === 'string' ? body.tags.split(',').map((t) => t.trim()).filter(Boolean) : ['Trading', 'Forex']),
      accentColor: body.accentColor || '#0488F8',
      keyTakeawaysAr: Array.isArray(body.keyTakeawaysAr) ? body.keyTakeawaysAr : [],
      keyTakeawaysEn: Array.isArray(body.keyTakeawaysEn) ? body.keyTakeawaysEn : [],
      sections: Array.isArray(body.sections) && body.sections.length > 0 ? body.sections : [
        {
          id: 'intro',
          headingAr: '1. مقدمة المقال',
          headingEn: '1. Introduction',
          bodyAr: body.contentAr || body.content || '',
          bodyEn: body.contentEn || body.content || '',
          tipAr: '',
          tipEn: '',
        },
      ],
      faqs: Array.isArray(body.faqs) ? body.faqs : [],
      coverImage: body.coverImage || body.imageUrl || body.chartImage || '',
      chartImage: body.chartImage || body.imageUrl || body.coverImage || '',
      tradingViewUrl: body.tradingViewUrl || body.sourceUrl || '',
      symbol: body.symbol || '',
      status: body.status || 'PUBLISHED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (newArticle.featured) {
      articles.forEach((a) => {
        a.featured = false;
      });
    }

    articles.unshift(newArticle);
    writeArticles(articles);

    // Sync with PostgreSQL backend database
    const backendBase = getBackendBase();
    try {
      const backendRes = await fetch(`${backendBase}/articles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          titleAr: newArticle.titleAr,
          titleEn: newArticle.titleEn,
          slug: newArticle.slug,
          excerptAr: newArticle.excerptAr,
          excerptEn: newArticle.excerptEn,
          contentAr: newArticle.sections?.[0]?.bodyAr || newArticle.excerptAr,
          contentEn: newArticle.sections?.[0]?.bodyEn || newArticle.excerptEn,
          coverImage: newArticle.coverImage || newArticle.chartImage,
          categoryKey: newArticle.categoryKey,
          categoryAr: newArticle.category,
          categoryEn: newArticle.categoryEn,
          authorName: newArticle.authorAr,
          tags: newArticle.tags,
          isFeatured: newArticle.featured,
          status: newArticle.status,
          symbol: newArticle.symbol,
          tradingViewUrl: newArticle.tradingViewUrl,
          sectionsData: {
            sections: newArticle.sections || [],
            videoUrl: newArticle.videoUrl || null,
            links: newArticle.links || [],
          },
          faqsData: newArticle.faqs,
        }),
      });
      if (backendRes.ok) {
        const backendJson = await backendRes.json();
        if (backendJson?.id) {
          newArticle.id = backendJson.id;
        }
      }
    } catch (backendErr) {
      console.warn('[Admin Articles API]: Failed to sync new article to backend database:', backendErr.message);
    }

    // Automatically dispatch to n8n news webhook
    let n8nDispatchResult = null;
    try {
      const isFromTradingView = Boolean(
        newArticle.tradingViewUrl ||
        (Array.isArray(newArticle.tags) && newArticle.tags.some(t => String(t).toLowerCase().includes('tradingview')))
      );
      const eventType = newArticle.status === 'PUBLISHED' ? 'article.published' : 'article.created';
      n8nDispatchResult = await sendArticleToN8n(newArticle, {
        event: eventType,
        source: isFromTradingView ? 'tradingview' : 'manual',
      });
    } catch (n8nErr) {
      console.warn('[Admin Articles API]: Failed to dispatch to n8n:', n8nErr.message);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'تم إنشاء ونشر المقال بنجاح وإرساله إلى n8n',
        data: newArticle,
        n8nWebhook: {
          dispatched: Boolean(n8nDispatchResult?.success),
          status: n8nDispatchResult?.status || null,
        },
      },
      { status: 201, headers: corsHeaders() }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: corsHeaders() }
    );
  }
}

// PUT /api/articles - Update article
export async function PUT(req) {
  try {
    const body = await req.json();
    let articles = readArticles();

    if (Array.isArray(body)) {
      writeArticles(body);
      return NextResponse.json(
        { success: true, message: 'تم تحديث قائمة المقالات بالكامل', data: body },
        { status: 200, headers: corsHeaders() }
      );
    }

    const { id, slug, ...updates } = body;
    if (!id && id !== 0 && !slug) {
      return NextResponse.json(
        { success: false, error: 'معرف المقال مطلوب (Article ID is required)' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const targetKey = id || slug;

    // 1. Sync update to PostgreSQL backend
    const backendBase = getBackendBase();
    try {
      await fetch(`${backendBase}/articles/${encodeURIComponent(targetKey)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          ...(updates.titleAr && { titleAr: updates.titleAr }),
          ...(updates.titleEn && { titleEn: updates.titleEn }),
          ...(updates.excerptAr && { excerptAr: updates.excerptAr }),
          ...(updates.excerptEn && { excerptEn: updates.excerptEn }),
          ...(updates.coverImage && { coverImage: updates.coverImage }),
          ...(updates.chartImage && !updates.coverImage && { coverImage: updates.chartImage }),
          ...(updates.categoryKey && { categoryKey: updates.categoryKey }),
          ...(updates.category && { categoryAr: updates.category }),
          ...(updates.categoryEn && { categoryEn: updates.categoryEn }),
          ...(updates.authorAr && { authorName: updates.authorAr }),
          ...(updates.tags && { tags: updates.tags }),
          ...(updates.status && { status: updates.status }),
          ...(updates.featured !== undefined && { isFeatured: updates.featured }),
          ...(updates.symbol && { symbol: updates.symbol }),
          ...(updates.tradingViewUrl && { tradingViewUrl: updates.tradingViewUrl }),
          ...((updates.sections !== undefined || updates.videoUrl !== undefined || updates.links !== undefined) && {
            sectionsData: {
              sections: updates.sections ?? (articles[index]?.sections || []),
              videoUrl: updates.videoUrl !== undefined ? updates.videoUrl : (articles[index]?.videoUrl || null),
              links: updates.links !== undefined ? updates.links : (articles[index]?.links || []),
            },
          }),
          ...(updates.faqs && { faqsData: updates.faqs }),
        }),
      });
    } catch (backendErr) {
      console.warn('[Admin Articles API]: Failed to sync update to backend database:', backendErr.message);
    }

    // 2. Update local articles.json
    const index = articles.findIndex(
      (a) => (id && String(a.id) === String(id)) || (slug && a.slug === String(slug)) || (id && a.slug === String(id))
    );

    if (index !== -1) {
      if (updates.featured) {
        articles.forEach((a) => {
          a.featured = false;
        });
      }

      articles[index] = {
        ...articles[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      writeArticles(articles);
    }

    // Dispatch to n8n news webhook upon update
    let n8nDispatchResult = null;
    const shouldDispatch = body.dispatchWebhook !== false;
    if (shouldDispatch && index !== -1) {
      try {
        const isFromTradingView = Boolean(
          articles[index].tradingViewUrl ||
          (Array.isArray(articles[index].tags) && articles[index].tags.some(t => String(t).toLowerCase().includes('tradingview')))
        );
        const eventType = articles[index].status === 'PUBLISHED' ? 'article.published' : 'article.updated';
        n8nDispatchResult = await sendArticleToN8n(articles[index], {
          event: eventType,
          source: isFromTradingView ? 'tradingview' : 'manual',
        });
      } catch (n8nErr) {
        console.warn('[Admin Articles API PUT]: Failed to dispatch to n8n:', n8nErr.message);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'تم تحديث بيانات المقال بنجاح',
        data: index !== -1 ? articles[index] : updates,
        n8nWebhook: n8nDispatchResult ? {
          dispatched: Boolean(n8nDispatchResult.success),
          status: n8nDispatchResult.status || null,
        } : undefined,
      },
      { status: 200, headers: corsHeaders() }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: corsHeaders() }
    );
  }
}

// DELETE /api/articles - Delete article
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');
    let slug = searchParams.get('slug');

    if (!id && id !== 0) {
      const body = await req.json().catch(() => ({}));
      id = body.id;
      slug = slug || body.slug;
    }

    if (!id && id !== 0 && !slug) {
      return NextResponse.json(
        { success: false, error: 'معرف المقال مطلوب للحذف (Article ID is required)' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const backendBase = getBackendBase();
    let backendDeleted = false;
    const targetIdentifier = id || slug;

    // 1. Delete from PostgreSQL backend database
    try {
      const backendRes = await fetch(`${backendBase}/articles/${encodeURIComponent(targetIdentifier)}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
      });
      if (backendRes.ok) {
        backendDeleted = true;
      } else if (slug && slug !== targetIdentifier) {
        const slugRes = await fetch(`${backendBase}/articles/${encodeURIComponent(slug)}`, {
          method: 'DELETE',
          headers: { Accept: 'application/json' },
        });
        if (slugRes.ok) backendDeleted = true;
      }
    } catch (backendErr) {
      console.warn('[Admin Articles API]: Failed to delete from backend database:', backendErr.message);
    }

    // 2. Delete from shared/local articles.json
    let articles = readArticles();
    const initialLen = articles.length;
    articles = articles.filter((a) => {
      const matchId = id && (String(a.id) === String(id));
      const matchSlug = (id && a.slug === String(id)) || (slug && a.slug === String(slug));
      return !matchId && !matchSlug;
    });

    const fileDeleted = articles.length < initialLen;
    if (fileDeleted) {
      writeArticles(articles);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'تم حذف المقال بنجاح نهائياً',
        deletedId: id || slug,
        backendDeleted,
        fileDeleted,
      },
      { status: 200, headers: corsHeaders() }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: corsHeaders() }
    );
  }
}
