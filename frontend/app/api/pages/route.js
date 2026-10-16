import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'pages.json');

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
  };
}

function readPages() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading pages.json:', err);
  }
  return [];
}

function writePages(pages) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(pages, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing pages.json:', err);
    return false;
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

// GET /api/pages or /api/pages?slug=about
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
    console.warn('Backend /pages fetch failed, falling back to JSON:', err);
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

// PUT /api/pages -> update single page or all pages
export async function PUT(req) {
  try {
    const body = await req.json();
    let pages = readPages();

    // If an array is passed, overwrite all
    if (Array.isArray(body)) {
      if (writePages(body)) {
        return NextResponse.json(
          { success: true, message: 'تم تحديث كافة الصفحات بنجاح', total: body.length },
          { headers: corsHeaders() }
        );
      }
      return NextResponse.json(
        { success: false, error: 'فشل حفظ الصفحات' },
        { status: 500, headers: corsHeaders() }
      );
    }

    // Single page update: { slug, ...fields }
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
        { success: true, message: 'تم تحديث الصفحة بنجاح', page: updatedRecord },
        { headers: corsHeaders() }
      );
    }

    return NextResponse.json(
      { success: false, error: 'فشل حفظ التعديلات' },
      { status: 500, headers: corsHeaders() }
    );
  } catch (err) {
    console.error('Error in PUT /api/pages:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'خطأ في الخادم الداخلي' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
