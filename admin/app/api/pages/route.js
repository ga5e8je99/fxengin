import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

function resolveDataFile() {
  const sharedPath = path.join(process.cwd(), '..', 'fx-engin', 'data', 'pages.json');
  if (fs.existsSync(sharedPath)) {
    return sharedPath;
  }
  const localPath = path.join(process.cwd(), 'data', 'pages.json');
  return localPath;
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
  };
}

function readPages() {
  const dataFile = resolveDataFile();
  try {
    if (fs.existsSync(dataFile)) {
      const content = fs.readFileSync(dataFile, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading pages file in admin API:', err);
  }
  return [];
}

function writePages(pages) {
  const dataFile = resolveDataFile();
  try {
    const dir = path.dirname(dataFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dataFile, JSON.stringify(pages, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing pages file in admin API:', err);
    return false;
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

// GET /api/pages
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  const category = searchParams.get('category');

  try {
    const backendUrl = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
    const url = slug ? `${backendUrl}/pages/${encodeURIComponent(slug)}` : `${backendUrl}/pages?${searchParams.toString()}`;
    const res = await fetch(url, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const json = await res.json();
      return NextResponse.json(json, { status: 200, headers: corsHeaders() });
    }
  } catch (err) {
    console.warn('Backend /pages fetch failed in admin, falling back to JSON:', err);
  }

  const pages = readPages();

  if (slug) {
    const page = pages.find((p) => p.slug === slug);
    if (!page) {
      return NextResponse.json(
        { success: false, error: 'الصفحة غير موجودة (Page not found)' },
        { status: 404, headers: corsHeaders() }
      );
    }
    return NextResponse.json({ success: true, page }, { headers: corsHeaders() });
  }

  let filtered = pages;
  if (category && category !== 'ALL') {
    filtered = pages.filter((p) => p.category === category);
  }

  return NextResponse.json(
    {
      success: true,
      total: filtered.length,
      pages: filtered,
    },
    { headers: corsHeaders() }
  );
}

// PUT /api/pages
export async function PUT(req) {
  try {
    const body = await req.json();
    let pages = readPages();

    if (Array.isArray(body)) {
      if (writePages(body)) {
        return NextResponse.json(
          { success: true, message: 'تم تحديث كافة الصفحات بنجاح', total: body.length },
          { headers: corsHeaders() }
        );
      }
      return NextResponse.json(
        { success: false, error: 'فشل حفظ ملف الصفحات' },
        { status: 500, headers: corsHeaders() }
      );
    }

    const { slug } = body;
    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'معرف الصفحة مطلوب (slug is required)' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const index = pages.findIndex((p) => p.slug === slug);
    const updatedRecord = {
      ...(index !== -1 ? pages[index] : {}),
      ...body,
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    if (index !== -1) {
      pages[index] = updatedRecord;
    } else {
      pages.push(updatedRecord);
    }

    if (writePages(pages)) {
      return NextResponse.json(
        { success: true, message: 'تم حفظ تعديلات الصفحة بنجاح ومزامنتها مع الموقع المباشر', page: updatedRecord },
        { headers: corsHeaders() }
      );
    }

    return NextResponse.json(
      { success: false, error: 'فشل كتابة البيانات إلى القرص' },
      { status: 500, headers: corsHeaders() }
    );
  } catch (err) {
    console.error('Error in Admin PUT /api/pages:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'خطأ في الخادم' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
