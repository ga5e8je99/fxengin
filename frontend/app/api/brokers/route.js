import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getBrokersFilePath() {
  const sharedPath = path.resolve('/app', 'data', 'brokers.json');
  if (fs.existsSync(sharedPath)) {
    return sharedPath;
  }
  return path.join(process.cwd(), 'data', 'brokers.json');
}

// Helper to add CORS headers
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
  };
}

function readBrokers() {
  const filePath = getBrokersFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading brokers.json:', err);
  }
  return [];
}

function writeBrokers(brokers) {
  let success = false;
  const targetPaths = [
    getBrokersFilePath(),
    path.join(process.cwd(), 'data', 'brokers.json'),
    path.resolve('/app', 'data', 'brokers.json'),
  ];
  const uniquePaths = Array.from(new Set(targetPaths));

  for (const fp of uniquePaths) {
    try {
      const dir = path.dirname(fp);
      if (fs.existsSync(dir)) {
        fs.writeFileSync(fp, JSON.stringify(brokers, null, 2), 'utf-8');
        success = true;
      }
    } catch (err) {
      // ignore
    }
  }
  return success;
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

function normalizeBroker(b) {
  if (!b) return null;
  const specs = Array.isArray(b.specs)
    ? b.specs
    : (Array.isArray(b.specsData) ? b.specsData : []);

  return {
    ...b,
    id: b.id || b.brokerSlug,
    slug: b.brokerSlug || b.slug || b.id,
    logo: b.logo || b.logoUrl || '/assets/Images/brokers/xm.webp',
    logoUrl: b.logoUrl || b.logo || '/assets/Images/brokers/xm.webp',
    specs,
    specsData: specs,
    descAr: b.descAr || b.descriptionAr || '',
    descEn: b.descEn || b.descriptionEn || '',
    descriptionAr: b.descriptionAr || b.descAr || '',
    descriptionEn: b.descriptionEn || b.descEn || '',
    tradersCount: b.tradersCount || b.clientsCount || '100K+ متداول',
    tradersCountEn: b.tradersCountEn || b.clientsCountEn || '100K+ Traders',
    clientsCount: b.clientsCount || b.tradersCount || '100K+ متداول',
    clientsCountEn: b.clientsCountEn || b.tradersCountEn || '100K+ Traders',
    fxenginPerksAr: b.fxenginPerksAr || b.perksAr || b.perkAr || '',
    fxenginPerksEn: b.fxenginPerksEn || b.perksEn || b.perkEn || '',
    perksAr: b.perksAr || b.fxenginPerksAr || b.perkAr || '',
    perksEn: b.perksEn || b.fxenginPerksEn || b.perkEn || '',
    perkAr: b.perkAr || b.fxenginPerksAr || b.perksAr || '',
    perkEn: b.perkEn || b.fxenginPerksEn || b.perksEn || '',
    categoryBadgeAr: b.categoryBadgeAr || b.categoryLabelAr || b.badgeAr || '',
    categoryBadgeEn: b.categoryBadgeEn || b.categoryLabelEn || b.badgeEn || '',
    featuresAr: Array.isArray(b.featuresAr) ? b.featuresAr : [],
    featuresEn: Array.isArray(b.featuresEn) ? b.featuresEn : [],
  };
}

// GET /api/brokers
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const activeOnly = searchParams.get('activeOnly') === 'true';

  let backendBrokers = [];
  try {
    const backendUrl = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
    const res = await fetch(`${backendUrl}/brokers?${searchParams.toString()}`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json?.data)) {
        backendBrokers = json.data;
      }
    }
  } catch (err) {
    console.warn('Backend /brokers fetch failed:', err?.message || err);
  }

  const fileBrokers = readBrokers();

  // Merge backend data and file data:
  // Key by slug/id (lowercased)
  const brokerMap = new Map();

  // 1. Add backend brokers
  for (const b of backendBrokers) {
    const key = (b.brokerSlug || b.slug || b.id || b.name || '').toLowerCase().trim();
    if (key) {
      brokerMap.set(key, normalizeBroker(b));
    }
  }

  // 2. Add / overlay file brokers (file storage reflects live admin dashboard edits)
  for (const b of fileBrokers) {
    const key = (b.id || b.brokerSlug || b.slug || b.name || '').toLowerCase().trim();
    if (key) {
      const existing = brokerMap.get(key);
      const normalized = normalizeBroker(b);
      brokerMap.set(key, existing ? { ...existing, ...normalized } : normalized);
    }
  }

  let mergedBrokers = Array.from(brokerMap.values());

  if (activeOnly) {
    mergedBrokers = mergedBrokers.filter((b) => b.status === 'ACTIVE' || !b.status || b.isActive !== false);
  }

  // Sort by order
  mergedBrokers.sort((a, b) => (a.order || a.sortOrder || 0) - (b.order || b.sortOrder || 0));

  return NextResponse.json(
    {
      success: true,
      count: mergedBrokers.length,
      data: mergedBrokers,
    },
    {
      status: 200,
      headers: corsHeaders(),
    }
  );
}

// POST /api/brokers - Create new broker
export async function POST(req) {
  try {
    const body = await req.json();

    if (!body.name) {
      return NextResponse.json(
        { success: false, error: 'اسم الوسيط مطلوب (Broker name is required)' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const brokers = readBrokers();
    const id = body.id || body.name.toLowerCase().replace(/[^a-z0-9]/g, '-') || `broker-${Date.now()}`;

    // Ensure unique ID
    const exists = brokers.some((b) => b.id === id);
    const finalId = exists ? `${id}-${Date.now().toString().slice(-4)}` : id;

    const newBroker = {
      id: finalId,
      name: body.name,
      category: body.category || 'forex',
      categoryLabelAr: body.categoryLabelAr || (body.category === 'prop' ? 'شركة تمويل المتداولين المحترفين' : 'وسيط فوركس وعقود فروقات مرخص'),
      categoryLabelEn: body.categoryLabelEn || (body.category === 'prop' ? 'Prop Trading Firm' : 'Regulated Forex & CFD Broker'),
      badgeAr: body.badgeAr || 'وسيط معتمد وموثوق',
      badgeEn: body.badgeEn || 'Verified Official Partner',
      badgeColor: body.badgeColor || '#0488F8',
      logo: body.logo || '/assets/Images/brokers/xm.webp',
      logoBg: body.logoBg || '#000000',
      rating: Number(body.rating) || 4.9,
      clientsCount: body.clientsCount || '100K+ متداول',
      clientsCountEn: body.clientsCountEn || '100K+ Traders',
      accentColor: body.accentColor || '#0488F8',
      glowBorder: body.glowBorder || 'rgba(4, 136, 248, 0.25)',
      descriptionAr: body.descriptionAr || '',
      descriptionEn: body.descriptionEn || '',
      specs: Array.isArray(body.specs) && body.specs.length > 0 ? body.specs : [
        { labelAr: 'الحد الأدنى للإيداع', labelEn: 'Min Deposit', valueAr: '$10', valueEn: '$10' },
        { labelAr: 'أقصى رافعة مالية', labelEn: 'Max Leverage', valueAr: '1:1000', valueEn: '1:1000' },
        { labelAr: 'السبريد', labelEn: 'Spread', valueAr: 'من 0.0 نقطة', valueEn: 'From 0.0 pips' },
        { labelAr: 'المنصات', labelEn: 'Platforms', valueAr: 'MT4, MT5', valueEn: 'MT4, MT5' },
        { labelAr: 'الحساب الإسلامي', labelEn: 'Islamic Account', valueAr: 'متوفر', valueEn: 'Available' },
        { labelAr: 'التراخيص الرقابية', labelEn: 'Licenses', valueAr: 'مرخص', valueEn: 'Regulated' },
      ],
      featuresAr: Array.isArray(body.featuresAr) ? body.featuresAr : [],
      featuresEn: Array.isArray(body.featuresEn) ? body.featuresEn : [],
      couponCode: body.couponCode || '',
      fxenginPerksAr: body.fxenginPerksAr || '',
      fxenginPerksEn: body.fxenginPerksEn || '',
      liveUrl: body.liveUrl || '#',
      demoUrl: body.demoUrl || '#',
      status: body.status || 'ACTIVE',
      order: brokers.length + 1,
    };

    brokers.push(newBroker);
    writeBrokers(brokers);

    return NextResponse.json(
      { success: true, message: 'تمت إضافة الوسيط بنجاح', data: newBroker },
      { status: 201, headers: corsHeaders() }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: corsHeaders() }
    );
  }
}

// PUT /api/brokers - Update broker(s)
export async function PUT(req) {
  try {
    const body = await req.json();
    let brokers = readBrokers();

    // If body is an array, replace entire list (e.g. reordering or bulk update)
    if (Array.isArray(body)) {
      writeBrokers(body);
      return NextResponse.json(
        { success: true, message: 'تم تحديث قائمة الوسطاء بالكامل', data: body },
        { status: 200, headers: corsHeaders() }
      );
    }

    // Single broker update
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف الوسيط مطلوب (Broker ID is required)' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const index = brokers.findIndex((b) => b.id === id);
    if (index === -1) {
      return NextResponse.json(
        { success: false, error: 'الوسيط غير موجود (Broker not found)' },
        { status: 404, headers: corsHeaders() }
      );
    }

    brokers[index] = { ...brokers[index], ...updates };
    writeBrokers(brokers);

    return NextResponse.json(
      { success: true, message: 'تم تحديث بيانات الوسيط بنجاح', data: brokers[index] },
      { status: 200, headers: corsHeaders() }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: corsHeaders() }
    );
  }
}

// DELETE /api/brokers - Delete a broker
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');

    if (!id) {
      const body = await req.json().catch(() => ({}));
      id = body.id;
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف الوسيط مطلوب للحذف (Broker ID required)' },
        { status: 400, headers: corsHeaders() }
      );
    }

    let brokers = readBrokers();
    const initialLen = brokers.length;
    brokers = brokers.filter((b) => b.id !== id);

    if (brokers.length === initialLen) {
      return NextResponse.json(
        { success: false, error: 'الوسيط غير موجود' },
        { status: 404, headers: corsHeaders() }
      );
    }

    writeBrokers(brokers);

    return NextResponse.json(
      { success: true, message: 'تم حذف الوسيط بنجاح', deletedId: id },
      { status: 200, headers: corsHeaders() }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: corsHeaders() }
    );
  }
}
