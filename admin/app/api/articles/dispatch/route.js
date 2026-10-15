import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import {
  sendArticleToN8n,
  sendBulkArticlesToN8n,
  getN8nWebhookUrl,
} from '../../../utils/n8nWebhook';

function resolveDataFile() {
  const sharedPath = path.join(process.cwd(), '..', 'fx-engin', 'data', 'articles.json');
  if (fs.existsSync(sharedPath)) {
    return sharedPath;
  }
  const localPath = path.join(process.cwd(), 'data', 'articles.json');
  return localPath;
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
  };
}

function readArticles() {
  const dataFile = resolveDataFile();
  try {
    if (fs.existsSync(dataFile)) {
      const content = fs.readFileSync(dataFile, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading articles file in admin dispatch API:', err);
  }
  return [];
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

// GET /api/articles/dispatch - Webhook status and health check
export async function GET() {
  const webhookUrl = getN8nWebhookUrl();
  const articles = readArticles();

  return NextResponse.json(
    {
      success: true,
      service: 'FXENGIN Admin n8n News Webhook Dispatcher',
      targetUrl: webhookUrl,
      totalStoredArticles: articles.length,
      publishedArticles: articles.filter((a) => (a.status || 'PUBLISHED') === 'PUBLISHED').length,
    },
    { status: 200, headers: corsHeaders() }
  );
}

// POST /api/articles/dispatch - Trigger dispatch for one, all, or test
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const articles = readArticles();

    // 1. Connection Test
    if (body.test) {
      const dummyArticle = {
        id: 'test-ping',
        slug: 'test-ping',
        titleAr: 'اختبار اتصال ويبهوك الأخبار',
        titleEn: 'News Webhook Connection Test',
        excerptAr: 'تأكيد وصول التنبيهات والمدونات بنجاح إلى سير العمل في n8n.',
        excerptEn: 'Verifying successful delivery of alerts and blogs to n8n workflow.',
        category: 'اختبار الاتصال',
        categoryEn: 'Connection Test',
        authorAr: 'منصة FXENGIN',
        symbol: 'TEST',
        status: 'TEST',
      };

      const testRes = await sendArticleToN8n(dummyArticle, {
        event: 'webhook.test',
        source: 'test',
      });

      return NextResponse.json(
        {
          success: testRes.success,
          message: testRes.success ? 'تم الاتصال بالويبهوك بنجاح!' : 'فشل الاتصال بالويبهوك',
          details: testRes,
        },
        { status: testRes.success ? 200 : 502, headers: corsHeaders() }
      );
    }

    // 2. Dispatch All Articles
    if (body.all) {
      let targets = articles;
      if (body.onlyPublished) {
        targets = targets.filter((a) => (a.status || 'PUBLISHED') === 'PUBLISHED');
      }

      if (targets.length === 0) {
        return NextResponse.json(
          { success: true, message: 'لا توجد مقالات للإرسال', count: 0 },
          { status: 200, headers: corsHeaders() }
        );
      }

      const bulkRes = await sendBulkArticlesToN8n(targets, {
        event: 'article.sync',
        source: 'admin_bulk_sync',
      });

      return NextResponse.json(
        {
          success: bulkRes.success,
          message: `تمت مزامنة ${bulkRes.successful} من أصل ${bulkRes.total} مقال مع ويبهوك n8n بنجاح.`,
          summary: bulkRes,
        },
        { status: 200, headers: corsHeaders() }
      );
    }

    // 3. Dispatch Single Article by ID or Slug
    const articleId = body.id || body.slug;
    if (!articleId && articleId !== 0) {
      return NextResponse.json(
        { success: false, error: 'يرجى تحديد معرف المقال (id) أو تعيين all: true' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const found = articles.find(
      (a) => String(a.id) === String(articleId) || a.slug === String(articleId)
    );

    if (!found) {
      return NextResponse.json(
        { success: false, error: `المقال بالمعرف ${articleId} غير موجود` },
        { status: 404, headers: corsHeaders() }
      );
    }

    const isFromTradingView = Boolean(
      found.tradingViewUrl ||
      (Array.isArray(found.tags) && found.tags.some((t) => String(t).toLowerCase().includes('tradingview')))
    );

    const dispatchRes = await sendArticleToN8n(found, {
      event: body.event || 'article.manual_dispatch',
      source: isFromTradingView ? 'tradingview' : 'manual',
    });

    return NextResponse.json(
      {
        success: dispatchRes.success,
        message: dispatchRes.success
          ? `تم إرسال مقال "${found.titleAr || found.titleEn}" إلى ويبهوك n8n بنجاح!`
          : `تعذر تسليم المقال إلى ويبهوك n8n: ${dispatchRes.error || 'خطأ غير معروف'}`,
        article: { id: found.id, title: found.titleAr || found.titleEn },
        details: dispatchRes,
      },
      { status: dispatchRes.success ? 200 : 502, headers: corsHeaders() }
    );
  } catch (err) {
    console.error('[Admin Article Dispatch Route Error]:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: corsHeaders() }
    );
  }
}
