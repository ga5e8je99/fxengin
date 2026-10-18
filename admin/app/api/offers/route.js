import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

function getOffersFilePath() {
  // 1. Shared Docker volume in production
  const sharedDockerPath = path.resolve('/app', 'data', 'offers.json');
  if (fs.existsSync(sharedDockerPath)) {
    return sharedDockerPath;
  }

  // 2. Shared data directory in project root
  const sharedDataPath = path.resolve(process.cwd(), '..', 'shared-data', 'offers.json');
  if (fs.existsSync(sharedDataPath)) {
    return sharedDataPath;
  }

  // 3. Local admin data directory
  const localAdminPath = path.join(process.cwd(), 'data', 'offers.json');
  if (fs.existsSync(localAdminPath)) {
    return localAdminPath;
  }

  // 4. Frontend data directory
  const frontendDataPath = path.resolve(process.cwd(), '..', 'frontend', 'data', 'offers.json');
  if (fs.existsSync(frontendDataPath)) {
    return frontendDataPath;
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

function readOffers() {
  const filePath = getOffersFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (err) {
    console.error('Error reading offers.json:', err);
  }
  return [];
}

function writeOffers(offers) {
  let success = false;
  const targetPaths = [
    getOffersFilePath(),
    path.join(process.cwd(), 'data', 'offers.json'),
    path.resolve('/app', 'data', 'offers.json'),
    path.resolve(process.cwd(), '..', 'shared-data', 'offers.json'),
    path.resolve(process.cwd(), '..', 'frontend', 'data', 'offers.json'),
  ];

  const uniquePaths = Array.from(new Set(targetPaths));

  uniquePaths.forEach((p) => {
    try {
      const dir = path.dirname(p);
      if (fs.existsSync(dir)) {
        fs.writeFileSync(p, JSON.stringify(offers, null, 2), 'utf-8');
        success = true;
      }
    } catch (e) {
      // Continue writing to other accessible locations
    }
  });

  return success;
}

// GET /api/offers
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const status = searchParams.get('status'); // 'all', 'active', 'inactive'

    let list = readOffers();

    if (category && category !== 'all') {
      list = list.filter((item) => item.category === category);
    }

    if (status === 'active') {
      list = list.filter((item) => item.isActive !== false);
    } else if (status === 'inactive') {
      list = list.filter((item) => item.isActive === false);
    }

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((item) => {
        return (
          item.titleAr?.toLowerCase().includes(q) ||
          item.titleEn?.toLowerCase().includes(q) ||
          item.subtitleAr?.toLowerCase().includes(q) ||
          item.partnerName?.toLowerCase().includes(q) ||
          item.code?.toLowerCase().includes(q)
        );
      });
    }

    // Calculate metrics
    const totalOffers = list.length;
    const activeOffers = list.filter((o) => o.isActive !== false).length;
    const totalCoupons = list.filter((o) => Boolean(o.code)).length;

    return NextResponse.json(
      {
        success: true,
        data: list,
        metrics: {
          totalOffers,
          activeOffers,
          totalCoupons,
        },
      },
      { headers: corsHeaders() }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500, headers: corsHeaders() }
    );
  }
}

// POST /api/offers - Create new offer
export async function POST(request) {
  try {
    const body = await request.json();
    const list = readOffers();

    const newOffer = {
      id: body.id || `offer-${Date.now()}`,
      category: body.category || 'bonus',
      categoryLabelAr: body.categoryLabelAr || 'عروض ترويجية',
      categoryLabelEn: body.categoryLabelEn || 'Special Offers',
      badgeAr: body.badgeAr || 'عرض حصري',
      badgeEn: body.badgeEn || 'Exclusive Offer',
      badgeColor: body.badgeColor || '#FB8704',
      titleAr: body.titleAr || 'عرض ترويجي جديد',
      titleEn: body.titleEn || 'New Exclusive Offer',
      subtitleAr: body.subtitleAr || '',
      subtitleEn: body.subtitleEn || '',
      discount: body.discount || '',
      discountEn: body.discountEn || '',
      code: body.code ? body.code.toUpperCase().trim() : '',
      validUntilAr: body.validUntilAr || 'عرض مستمر للمسجلين عبر FXENGIN',
      validUntilEn: body.validUntilEn || 'Exclusive for FXENGIN traders',
      partnerName: body.partnerName || 'FXENGIN',
      logo: body.logo || '/assets/Images/Logo/logo.webp',
      isFeatured: Boolean(body.isFeatured),
      isActive: body.isActive !== false,
      featuresAr: Array.isArray(body.featuresAr) ? body.featuresAr : [],
      featuresEn: Array.isArray(body.featuresEn) ? body.featuresEn : [],
      ctaTextAr: body.ctaTextAr || 'تفعيل العرض',
      ctaTextEn: body.ctaTextEn || 'Claim Offer',
      ctaLink: body.ctaLink || '/register',
      isExternal: Boolean(body.isExternal),
      createdAt: new Date().toISOString(),
    };

    list.unshift(newOffer);
    writeOffers(list);

    return NextResponse.json(
      { success: true, message: 'تمت إضافة العرض بنجاح', data: newOffer },
      { headers: corsHeaders() }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500, headers: corsHeaders() }
    );
  }
}

// PUT /api/offers - Update offer or toggle status
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, action, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف العرض (id) مطلوب' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const list = readOffers();
    const index = list.findIndex((item) => item.id === id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, error: 'لم يتم العثور على العرض المطلوب' },
        { status: 404, headers: corsHeaders() }
      );
    }

    if (action === 'toggle-status') {
      const current = list[index].isActive !== false;
      list[index].isActive = !current;
    } else {
      list[index] = {
        ...list[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
    }

    writeOffers(list);

    return NextResponse.json(
      {
        success: true,
        message: action === 'toggle-status' ? 'تم تحديث حالة العرض بنجاح' : 'تم تعديل بيانات العرض بنجاح',
        data: list[index],
      },
      { headers: corsHeaders() }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500, headers: corsHeaders() }
    );
  }
}

// DELETE /api/offers - Delete offer by id
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف العرض (id) مطلوب للحذف' },
        { status: 400, headers: corsHeaders() }
      );
    }

    let list = readOffers();
    const initialLength = list.length;
    list = list.filter((item) => item.id !== id);

    if (list.length === initialLength) {
      return NextResponse.json(
        { success: false, error: 'لم يتم العثور على العرض المحدد' },
        { status: 404, headers: corsHeaders() }
      );
    }

    writeOffers(list);

    return NextResponse.json(
      { success: true, message: 'تم حذف العرض بنجاح' },
      { headers: corsHeaders() }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500, headers: corsHeaders() }
    );
  }
}
