import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

function getBrokersFilePath() {
  // Check shared Docker volume path first (/app/data/brokers.json)
  const sharedPath = path.resolve('/app', 'data', 'brokers.json');
  if (fs.existsSync(sharedPath)) {
    return sharedPath;
  }

  // Check local admin data folder
  const localAdminPath = path.join(process.cwd(), 'data', 'brokers.json');
  if (fs.existsSync(localAdminPath)) {
    return localAdminPath;
  }

  // Check adjacent fx-engin data folder (local dev)
  const adjacentPath = path.resolve(process.cwd(), '..', 'fx-engin', 'data', 'brokers.json');
  if (fs.existsSync(adjacentPath)) {
    return adjacentPath;
  }

  return localAdminPath;
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
  };
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

function readBrokers() {
  const filePath = getBrokersFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading brokers.json in admin API:', err);
  }
  return [];
}

function writeBrokers(brokers) {
  let success = false;
  const targetPaths = [
    getBrokersFilePath(),
    path.join(process.cwd(), 'data', 'brokers.json'),
    path.resolve('/app', 'data', 'brokers.json'),
    path.resolve(process.cwd(), '..', 'fx-engin', 'data', 'brokers.json'),
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
      // silent fallback
    }
  }

  return success;
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
    logo: b.logo || b.logoUrl || '/assets/Images/brokers/xm.png',
    logoUrl: b.logoUrl || b.logo || '/assets/Images/brokers/xm.png',
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

  let brokers = readBrokers();

  if (activeOnly) {
    brokers = brokers.filter((b) => b.status === 'ACTIVE' || b.isActive !== false);
  }

  brokers.sort((a, b) => (a.order || 0) - (b.order || 0));

  return NextResponse.json(
    {
      success: true,
      count: brokers.length,
      data: brokers.map(normalizeBroker),
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
    const body = await req.json().catch(() => ({}));

    if (!body.name) {
      return NextResponse.json(
        { success: false, error: 'اسم الوسيط مطلوب' },
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
      categoryLabelAr: body.categoryLabelAr || 'وسيط فوركس وعقود فروقات مرخص عالمياً',
      categoryLabelEn: body.categoryLabelEn || 'Multi-Regulated Global Forex & CFD Broker',
      badgeAr: body.badgeAr || body.categoryBadgeAr || 'الأكثر موثوقية عالمياً • فئة أولى Tier-1',
      badgeEn: body.badgeEn || body.categoryBadgeEn || 'Most Trusted Globally • Tier-1 Regulated',
      badgeColor: body.badgeColor || '#0488F8',
      logo: body.logo || body.logoUrl || '/assets/Images/brokers/xm.png',
      logoUrl: body.logoUrl || body.logo || '/assets/Images/brokers/xm.png',
      logoBg: body.logoBg || '#000000',
      rating: Number(body.rating) || 4.9,
      clientsCount: body.clientsCount || body.tradersCount || '100K+ متداول',
      clientsCountEn: body.clientsCountEn || body.tradersCountEn || '100K+ Traders',
      accentColor: body.accentColor || '#0488F8',
      glowBorder: body.glowBorder || 'rgba(4, 136, 248, 0.25)',
      descriptionAr: body.descriptionAr || body.descAr || '',
      descriptionEn: body.descriptionEn || body.descEn || '',
      specs: Array.isArray(body.specs) && body.specs.length > 0 ? body.specs : [
        { labelAr: 'الحد الأدنى للإيداع', labelEn: 'Min Deposit', valueAr: '$10 فقط', valueEn: '$10 Only', val: '$10' },
        { labelAr: 'أقصى رافعة مالية', labelEn: 'Max Leverage', valueAr: 'تصل إلى 1:1000', valueEn: 'Up to 1:1000', val: '1:1000' },
        { labelAr: 'السبريد', labelEn: 'Spread', valueAr: 'من 0.0 نقطة', valueEn: 'From 0.0 pips', val: '0.0 Pip' },
        { labelAr: 'المنصات', labelEn: 'Platforms', valueAr: 'MT4, MT5, Web', valueEn: 'MT4, MT5, Web', val: 'MT4 / MT5' },
        { labelAr: 'الحساب الإسلامي', labelEn: 'Islamic Account', valueAr: 'متوفر', valueEn: 'Available', val: 'Swap-Free' },
        { labelAr: 'التراخيص الرقابية', labelEn: 'Regulations', valueAr: 'مرخص', valueEn: 'Regulated', val: 'Regulated' },
      ],
      featuresAr: Array.isArray(body.featuresAr) ? body.featuresAr : [],
      featuresEn: Array.isArray(body.featuresEn) ? body.featuresEn : [],
      couponCode: body.couponCode || '',
      fxenginPerksAr: body.fxenginPerksAr || body.perksAr || body.perkAr || '',
      fxenginPerksEn: body.fxenginPerksEn || body.perksEn || body.perkEn || '',
      liveUrl: body.liveUrl || '#',
      demoUrl: body.demoUrl || '#',
      status: body.status || 'ACTIVE',
      order: brokers.length + 1,
    };

    brokers.push(newBroker);
    writeBrokers(brokers);

    return NextResponse.json(
      { success: true, message: 'تمت إضافة الوسيط وحفظه بنجاح', data: normalizeBroker(newBroker) },
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
    const body = await req.json().catch(() => ({}));
    let brokers = readBrokers();

    if (Array.isArray(body)) {
      writeBrokers(body);
      return NextResponse.json(
        { success: true, message: 'تم تحديث قائمة الوسطاء بالكامل', data: body.map(normalizeBroker) },
        { status: 200, headers: corsHeaders() }
      );
    }

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'معرّف الوسيط مطلوب للتحديث' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const index = brokers.findIndex((b) => b.id === body.id || b.brokerSlug === body.id);
    if (index === -1) {
      return NextResponse.json(
        { success: false, error: 'الوسيط غير موجود' },
        { status: 404, headers: corsHeaders() }
      );
    }

    brokers[index] = {
      ...brokers[index],
      ...body,
      id: brokers[index].id,
    };

    writeBrokers(brokers);

    return NextResponse.json(
      { success: true, message: 'تم تحديث بيانات الوسيط بنجاح', data: normalizeBroker(brokers[index]) },
      { status: 200, headers: corsHeaders() }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: corsHeaders() }
    );
  }
}

// DELETE /api/brokers - Delete broker
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرّف الوسيط مطلوب للحذف' },
        { status: 400, headers: corsHeaders() }
      );
    }

    let brokers = readBrokers();
    const filtered = brokers.filter((b) => b.id !== id && b.brokerSlug !== id);

    if (filtered.length === brokers.length) {
      return NextResponse.json(
        { success: false, error: 'الوسيط غير موجود' },
        { status: 404, headers: corsHeaders() }
      );
    }

    writeBrokers(filtered);

    return NextResponse.json(
      { success: true, message: 'تم حذف الوسيط بنجاح' },
      { status: 200, headers: corsHeaders() }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: corsHeaders() }
    );
  }
}
