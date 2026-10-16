import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DATA_FILE = path.join(process.cwd(), 'data', 'affiliates.json');

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };
}

function getAffiliatesCandidatePaths() {
  const list = [];
  const primary = path.join(process.cwd(), 'data', 'affiliates.json');
  list.push(primary);

  if (process.env.SHARED_DATA_DIR) {
    list.push(path.join(process.env.SHARED_DATA_DIR, 'affiliates.json'));
  }
  list.push('/app/data/affiliates.json');
  list.push(path.join(process.cwd(), '..', 'shared-data', 'affiliates.json'));
  list.push(path.join(process.cwd(), '..', 'fxengin-admin', 'data', 'affiliates.json'));
  list.push(path.join(process.cwd(), '..', 'fx-engin', 'data', 'affiliates.json'));

  return [...new Set(list)];
}

function resolveAffiliatesReadFile() {
  const candidates = getAffiliatesCandidatePaths();
  let bestFile = null;
  let bestMtime = 0;

  for (const f of candidates) {
    try {
      if (fs.existsSync(/*turbopackIgnore: true*/ f)) {
        const stats = fs.statSync(/*turbopackIgnore: true*/ f);
        if (stats.mtimeMs > bestMtime) {
          bestMtime = stats.mtimeMs;
          bestFile = f;
        }
      }
    } catch {}
  }
  return bestFile || path.join(process.cwd(), 'data', 'affiliates.json');
}

function readAffiliatesData() {
  try {
    const file = resolveAffiliatesReadFile();
    if (fs.existsSync(/*turbopackIgnore: true*/ file)) {
      const content = fs.readFileSync(/*turbopackIgnore: true*/ file, 'utf-8');
      const parsed = JSON.parse(content);
      return {
        partners: Array.isArray(parsed?.partners) ? parsed.partners : [],
        clicks: Array.isArray(parsed?.clicks) ? parsed.clicks : [],
        conversions: Array.isArray(parsed?.conversions) ? parsed.conversions : [],
        payouts: Array.isArray(parsed?.payouts) ? parsed.payouts : [],
        referredUsers: Array.isArray(parsed?.referredUsers) ? parsed.referredUsers : [],
        creatives: Array.isArray(parsed?.creatives) ? parsed.creatives : [],
      };
    }
  } catch (err) {
    console.error('Error reading affiliates.json:', err);
  }
  return { partners: [], clicks: [], conversions: [], payouts: [], referredUsers: [], creatives: [] };
}

function writeAffiliatesData(data) {
  const content = JSON.stringify(data, null, 2);
  let writtenAtLeastOnce = false;

  const candidates = getAffiliatesCandidatePaths();
  for (const filePath of candidates) {
    try {
      const dir = path.dirname(filePath);
      if (fs.existsSync(dir)) {
        fs.writeFileSync(filePath, content, 'utf-8');
        writtenAtLeastOnce = true;
      }
    } catch (e) {}
  }

  if (!writtenAtLeastOnce) {
    try {
      const primary = path.join(process.cwd(), 'data', 'affiliates.json');
      fs.mkdirSync(path.dirname(primary), { recursive: true });
      fs.writeFileSync(primary, content, 'utf-8');
      return true;
    } catch (err) {
      console.error('Error fallback writing affiliates.json:', err);
      return false;
    }
  }
  return true;
}

function generateUniqueCode(existingPartners, name = '') {
  let cleanPrefix = 'FXG';
  if (name) {
    const latin = name.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 3);
    if (latin.length >= 2) cleanPrefix = latin;
  }
  let code = '';
  let attempts = 0;
  while (attempts < 100) {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    code = `${cleanPrefix}-${randomDigits}`;
    if (!existingPartners.some((p) => p.referralCode === code)) {
      return code;
    }
    attempts++;
  }
  return `FXG-${Date.now().toString().slice(-5)}`;
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

// GET /api/affiliate?userId=... OR ?code=... OR ?all=true
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const code = searchParams.get('code');
    const all = searchParams.get('all');

    const data = readAffiliatesData();

    // Check if creatives requested directly
    if (searchParams.get('creatives') === 'true' || searchParams.get('type') === 'creatives') {
      return NextResponse.json(
        {
          success: true,
          creatives: (data.creatives || []).filter((c) => c.isActive !== false),
        },
        { status: 200, headers: corsHeaders() }
      );
    }

    // Check if a user is an attributed lead
    const checkLead = searchParams.get('checkLead') || searchParams.get('checkUser');
    if (checkLead) {
      const cleanCheck = checkLead.trim().toLowerCase();
      const lead = (data.referredUsers || []).find(
        (u) =>
          (u.userId && String(u.userId).toLowerCase() === cleanCheck) ||
          (u.userEmail && u.userEmail.toLowerCase() === cleanCheck)
      );
      if (lead) {
        return NextResponse.json(
          { success: true, isReferred: true, referralCode: lead.referralCode, partnerId: lead.partnerId },
          { status: 200, headers: corsHeaders() }
        );
      }
      return NextResponse.json(
        { success: true, isReferred: false },
        { status: 200, headers: corsHeaders() }
      );
    }

    // Verify code lookup
    if (code) {
      const partner = data.partners.find(
        (p) => p.referralCode && p.referralCode.toLowerCase() === code.trim().toLowerCase()
      );
      if (partner) {
        return NextResponse.json(
          {
            success: true,
            valid: true,
            partnerName: partner.userName,
            referralCode: partner.referralCode,
          },
          { status: 200, headers: corsHeaders() }
        );
      }
      return NextResponse.json(
        { success: false, valid: false, message: 'كود الإحالة غير صالح' },
        { status: 404, headers: corsHeaders() }
      );
    }

    // Partner profile lookup
    const userEmail = searchParams.get('email');
    if (userId || userEmail) {
      const partner = data.partners.find(
        (p) =>
          (userId && String(p.userId) === String(userId)) ||
          (userEmail && p.userEmail && p.userEmail.toLowerCase() === userEmail.trim().toLowerCase())
      );
      if (!partner) {
        return NextResponse.json(
          { success: true, isPartner: false },
          { status: 200, headers: corsHeaders() }
        );
      }

      // Filter conversions, referred users, and payouts belonging to this partner
      const partnerConversions = data.conversions
        .filter((c) => c.referralCode === partner.referralCode || c.partnerId === partner.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const partnerReferredUsers = (data.referredUsers || [])
        .filter((u) => u.referralCode === partner.referralCode || u.partnerId === partner.id)
        .sort((a, b) => new Date(b.registeredAt || 0) - new Date(a.registeredAt || 0));

      const partnerPayouts = data.payouts
        .filter((p) => p.referralCode === partner.referralCode || p.partnerId === partner.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Separate course vs group subscriptions
      const coursesCount = partnerConversions.filter(
        (c) =>
          c.productType === 'COURSE' ||
          (!c.productType &&
            !c.productName?.toLowerCase().includes('group') &&
            !c.productName?.includes('جروب') &&
            !c.productName?.includes('توصيات') &&
            !c.productName?.includes('signals'))
      ).length;

      const groupsCount = partnerConversions.filter(
        (c) =>
          c.productType === 'GROUP' ||
          c.productName?.toLowerCase().includes('group') ||
          c.productName?.includes('جروب') ||
          c.productName?.includes('توصيات') ||
          c.productName?.includes('signals') ||
          c.productName?.includes('إشارات')
      ).length;

      return NextResponse.json(
        {
          success: true,
          isPartner: true,
          partner,
          stats: {
            totalEarnings: Number(partner.totalEarnings || 0).toFixed(2),
            availableBalance: Number(partner.availableBalance || 0).toFixed(2),
            totalClicks: partner.totalClicks || 0,
            totalConversions: partner.totalConversions || partnerConversions.length,
            totalReferredUsers: partnerReferredUsers.length,
            coursesCount,
            groupsCount,
            commissionRate: '10%',
          },
          referredUsers: partnerReferredUsers,
          conversions: partnerConversions,
          payouts: partnerPayouts,
          creatives: (data.creatives || []).filter((c) => c.isActive !== false),
        },
        { status: 200, headers: corsHeaders() }
      );
    }

    // Default: summary and full list for Admin
    const totalEarningsAll = data.partners.reduce(
      (acc, p) => acc + (Number(p.totalEarnings) || 0),
      0
    );
    const totalAvailableAll = data.partners.reduce(
      (acc, p) => acc + (Number(p.availableBalance) || 0),
      0
    );

    return NextResponse.json(
      {
        success: true,
        summary: {
          totalPartners: data.partners.length,
          totalConversions: data.conversions.length,
          totalReferredUsers: (data.referredUsers || []).length,
          totalClicks: data.clicks.length,
          totalPayouts: data.payouts.length,
          totalEarningsAll: Number(totalEarningsAll).toFixed(2),
          totalAvailableAll: Number(totalAvailableAll).toFixed(2),
          commissionRate: '10%',
        },
        partners: data.partners,
        conversions: data.conversions.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        ),
        referredUsers: (data.referredUsers || []).sort(
          (a, b) => new Date(b.registeredAt || 0) - new Date(a.registeredAt || 0)
        ),
        payouts: data.payouts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
        creatives: (data.creatives || []).filter((c) => c.isActive !== false),
      },
      { status: 200, headers: corsHeaders() }
    );
  } catch (err) {
    console.error('Affiliate GET error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: corsHeaders() }
    );
  }
}

// POST /api/affiliate - Handles actions: 'join', 'track_click', 'track_registration', 'record_conversion', 'request_payout', 'update_payout'
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action;
    const data = readAffiliatesData();

    // ── 1. JOIN AFFILIATE PROGRAM ──
    if (action === 'join') {
      const { userId, userName, userEmail, userPhone } = body;
      if (!userId) {
        return NextResponse.json(
          { success: false, error: 'معرف المستخدم مطلوب' },
          { status: 400, headers: corsHeaders() }
        );
      }

      // Check if already registered
      let existing = data.partners.find((p) => String(p.userId) === String(userId));
      if (existing) {
        return NextResponse.json(
          {
            success: true,
            message: 'أنت مسجل بالفعل كشريك في برنامج الإحالة',
            partner: existing,
          },
          { status: 200, headers: corsHeaders() }
        );
      }

      const newCode = generateUniqueCode(data.partners, userName);
      const partner = {
        id: `prt-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        userId: String(userId),
        userName: userName || 'عضو FXENGIN',
        userEmail: userEmail || '',
        userPhone: userPhone || '',
        referralCode: newCode,
        termsAccepted: true,
        termsAcceptedAt: new Date().toISOString(),
        totalEarnings: 0,
        availableBalance: 0,
        totalClicks: 0,
        totalConversions: 0,
        totalReferredUsers: 0,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      };

      data.partners.push(partner);
      writeAffiliatesData(data);

      return NextResponse.json(
        {
          success: true,
          message: 'تهانينا! تم تفعيل حساب الشريك ورابط الإحالة الخاص بك بنجاح (10% عمولة)',
          partner,
        },
        { status: 201, headers: corsHeaders() }
      );
    }

    // ── 2. TRACK CLICK ──
    if (action === 'track_click') {
      const { referralCode, path: visitedPath } = body;
      if (!referralCode) {
        return NextResponse.json(
          { success: false, error: 'كود الإحالة مطلوب' },
          { status: 400, headers: corsHeaders() }
        );
      }

      const cleanCode = referralCode.trim().toUpperCase();
      const partnerIndex = data.partners.findIndex(
        (p) => p.referralCode && p.referralCode.toUpperCase() === cleanCode
      );

      if (partnerIndex !== -1) {
        data.partners[partnerIndex].totalClicks =
          (data.partners[partnerIndex].totalClicks || 0) + 1;

        data.clicks.push({
          id: `clk-${Date.now()}`,
          referralCode: cleanCode,
          partnerId: data.partners[partnerIndex].id,
          path: visitedPath || '/',
          timestamp: new Date().toISOString(),
        });
        if (data.clicks.length > 500) {
          data.clicks = data.clicks.slice(-500);
        }

        writeAffiliatesData(data);
        return NextResponse.json(
          { success: true, tracked: true },
          { status: 200, headers: corsHeaders() }
        );
      }

      return NextResponse.json(
        { success: false, tracked: false, message: 'الكود غير مسجل' },
        { status: 404, headers: corsHeaders() }
      );
    }

    // ── 3. TRACK USER REGISTRATION ("الناس اللي دخلت عبر الرابط") ──
    if (action === 'track_registration') {
      const { referralCode, userId, fullName, email, phone } = body;
      if (!referralCode) {
        return NextResponse.json(
          { success: false, error: 'كود الإحالة مطلوب' },
          { status: 400, headers: corsHeaders() }
        );
      }

      const cleanCode = referralCode.trim().toUpperCase();
      const partnerIndex = data.partners.findIndex(
        (p) => p.referralCode && p.referralCode.toUpperCase() === cleanCode
      );

      if (partnerIndex === -1) {
        return NextResponse.json(
          { success: false, message: 'شريك الإحالة غير مسجل' },
          { status: 404, headers: corsHeaders() }
        );
      }

      const partner = data.partners[partnerIndex];

      // Anti-self referral on registration
      if (userId && String(partner.userId) === String(userId)) {
        return NextResponse.json(
          { success: false, message: 'لا يمكن إحالة النفس' },
          { status: 400, headers: corsHeaders() }
        );
      }

      if (!data.referredUsers) data.referredUsers = [];

      // Check if user already tracked under this referral
      const existingUser = data.referredUsers.find(
        (u) =>
          u.referralCode === cleanCode &&
          ((userId && String(u.userId) === String(userId)) || (email && u.userEmail === email))
      );

      if (existingUser) {
        return NextResponse.json(
          { success: true, message: 'المستخدم مسجل مسبقاً تحت هذا الشريك', referredUser: existingUser },
          { status: 200, headers: corsHeaders() }
        );
      }

      const newReferredUser = {
        id: `ref-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        referralCode: cleanCode,
        partnerId: partner.id,
        partnerName: partner.userName,
        userId: userId ? String(userId) : null,
        userName: fullName || 'مستخدم مسجل جديد',
        userEmail: email || '',
        userPhone: phone || '',
        registeredAt: new Date().toISOString(),
        subscriptionsCount: 0,
        totalSpent: 0,
        totalCommission: 0,
        status: 'REGISTERED', // 'REGISTERED' | 'SUBSCRIBED'
      };

      data.referredUsers.push(newReferredUser);
      data.partners[partnerIndex].totalReferredUsers =
        (data.partners[partnerIndex].totalReferredUsers || 0) + 1;

      writeAffiliatesData(data);

      return NextResponse.json(
        {
          success: true,
          message: 'تم تسجيل العضو المحال بنجاح',
          referredUser: newReferredUser,
        },
        { status: 201, headers: corsHeaders() }
      );
    }

    // ── 4. RECORD CONVERSION (الاشتراك في أي كورس أو أي جروب) ──
    if (action === 'record_conversion') {
      const {
        referralCode,
        orderNumber,
        orderAmount,
        currency = 'USDT',
        productName = 'دورة أو اشتراك',
        productType,
        buyerName = 'مستخدم FXENGIN',
        buyerEmail = '',
        buyerPhone = '',
        buyerId,
      } = body;

      let cleanCode = referralCode ? referralCode.trim().toUpperCase() : '';

      // 1. If referralCode is missing, resolve partner from referredUsers by buyerId, buyerEmail, or buyerPhone
      if (!cleanCode && (buyerId || buyerEmail || buyerPhone)) {
        const foundLead = (data.referredUsers || []).find(
          (u) =>
            (buyerId && String(u.userId) === String(buyerId)) ||
            (buyerEmail && u.userEmail && u.userEmail.toLowerCase() === buyerEmail.toLowerCase()) ||
            (buyerPhone && u.userPhone && u.userPhone.replace(/\D/g, '').endsWith(buyerPhone.replace(/\D/g, '').slice(-8)))
        );
        if (foundLead && foundLead.referralCode) {
          cleanCode = foundLead.referralCode.trim().toUpperCase();
        }
      }

      // 2. If still missing, check recent clicks in data.clicks
      if (!cleanCode && Array.isArray(data.clicks) && data.clicks.length > 0) {
        const lastClick = data.clicks[data.clicks.length - 1];
        if (lastClick?.referralCode) {
          cleanCode = lastClick.referralCode.trim().toUpperCase();
        }
      }

      // 3. Fallback: If only 1 partner exists in system and buyer is not that partner, attribute to that partner
      if (!cleanCode && data.partners.length === 1) {
        const p = data.partners[0];
        const isSelf =
          (buyerId && String(p.userId) === String(buyerId)) ||
          (buyerEmail && p.userEmail && p.userEmail.toLowerCase() === buyerEmail.toLowerCase());
        if (!isSelf && p.referralCode) {
          cleanCode = p.referralCode.trim().toUpperCase();
        }
      }

      if (!cleanCode || !orderNumber) {
        return NextResponse.json(
          { success: false, message: 'لم يتم العثور على كود إحالة مسجل لهذا الطلب' },
          { status: 200, headers: corsHeaders() }
        );
      }

      const partnerIndex = data.partners.findIndex(
        (p) => p.referralCode && p.referralCode.toUpperCase() === cleanCode
      );

      if (partnerIndex === -1) {
        return NextResponse.json(
          { success: false, message: 'شريك الإحالة غير مسجل' },
          { status: 404, headers: corsHeaders() }
        );
      }

      const partner = data.partners[partnerIndex];

      // Anti-fraud: prevent self-referral commission
      if (buyerId && String(partner.userId) === String(buyerId)) {
        return NextResponse.json(
          { success: false, message: 'لا يمكن احتساب عمولة إحالة للنفس' },
          { status: 400, headers: corsHeaders() }
        );
      }

      // Check if conversion already recorded for this order
      const alreadyRecorded = data.conversions.some(
        (c) => c.orderNumber && String(c.orderNumber) === String(orderNumber)
      );
      if (alreadyRecorded) {
        return NextResponse.json(
          { success: true, message: 'تم تسجيل العمولة لهذا الطلب مسبقاً' },
          { status: 200, headers: corsHeaders() }
        );
      }

      const numericAmount = Math.max(0, Number(orderAmount) || 0);
      // Fixed 10% commission rate as required
      const commissionRate = 0.10;
      const commissionAmount = Math.round(numericAmount * commissionRate * 100) / 100;

      // Detect if course or VIP group subscription
      const isGroup =
        Boolean(productType === 'GROUP') ||
        (productName &&
          (productName.toLowerCase().includes('group') ||
            productName.toLowerCase().includes('signal') ||
            productName.includes('جروب') ||
            productName.includes('توصيات') ||
            productName.includes('إشارات') ||
            productName.includes('vip')));

      const resolvedProductType = isGroup ? 'GROUP' : 'COURSE';

      // Rule: 10% commission is awarded for FIRST TIME ONLY per category (Groups: 1st time only, Courses: 1st time only).
      // Renewals or subsequent subscriptions/courses for the same referred user do NOT generate commissions.
      const hasPriorCategoryConversion = data.conversions.some((c) => {
        if (c.status === 'REJECTED') return false;
        if (c.orderNumber && String(c.orderNumber) === String(orderNumber)) return false;
        if (c.productType !== resolvedProductType) return false;

        const matchId = buyerId && c.buyerId && String(c.buyerId).toLowerCase() === String(buyerId).toLowerCase();
        const matchEmail = buyerEmail && c.buyerEmail && c.buyerEmail.trim().toLowerCase() === buyerEmail.trim().toLowerCase();
        const matchPhone = buyerPhone && c.buyerPhone && c.buyerPhone.replace(/\D/g, '').length >= 8 &&
          c.buyerPhone.replace(/\D/g, '').endsWith(buyerPhone.replace(/\D/g, '').slice(-8));

        return Boolean(matchId || matchEmail || matchPhone);
      });

      if (hasPriorCategoryConversion) {
        return NextResponse.json(
          {
            success: true,
            commissionAmount: 0,
            firstTimeOnlyNotice: true,
            message: resolvedProductType === 'GROUP'
              ? 'العمولة تُحتسب لأول اشتراك في الجروبات فقط لمرة واحدة للمستخدم المحال (لا تشمل التجديد أو الجروبات الأخرى)'
              : 'العمولة تُحتسب لأول كورس فقط لمرة واحدة للمستخدم المحال (لا تشمل الكورسات الإضافية)',
          },
          { status: 200, headers: corsHeaders() }
        );
      }

      const conversion = {
        id: `conv-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        referralCode: cleanCode,
        partnerId: partner.id,
        partnerName: partner.userName,
        orderNumber: String(orderNumber),
        orderAmount: numericAmount,
        commissionRate,
        commissionAmount,
        currency,
        productType: resolvedProductType,
        productName: productName || (resolvedProductType === 'GROUP' ? 'اشتراك جروب توصيات VIP' : 'دورة تدريبية'),
        buyerName,
        buyerEmail,
        buyerPhone,
        buyerId: buyerId || null,
        status: 'PENDING', // لا يُحسب الربح إلا بعد تأكيد كود التفعيل
        createdAt: new Date().toISOString(),
      };

      data.conversions.push(conversion);

      // لا يتم احتساب الأرباح أو إضافتها إلى رصيد الشريك إلا بعد تأكيد كود التفعيل
      // partner.totalEarnings and availableBalance are NOT updated here!

      // Update or link referred user as REGISTERED
      if (!data.referredUsers) data.referredUsers = [];
      let refUser = data.referredUsers.find(
        (u) =>
          (u.referralCode === cleanCode || u.partnerId === partner.id) &&
          ((buyerId && String(u.userId) === String(buyerId)) ||
            (buyerEmail && u.userEmail === buyerEmail) ||
            (buyerName && u.userName === buyerName))
      );

      if (!refUser) {
        refUser = {
          id: `ref-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
          referralCode: cleanCode,
          partnerId: partner.id,
          partnerName: partner.userName,
          userId: buyerId ? String(buyerId) : null,
          userName: buyerName || 'مشترك جديد',
          userEmail: buyerEmail || '',
          userPhone: buyerPhone || '',
          registeredAt: new Date().toISOString(),
          subscriptionsCount: 0,
          totalSpent: 0,
          totalCommission: 0,
          status: 'REGISTERED',
        };
        data.referredUsers.push(refUser);
        data.partners[partnerIndex].totalReferredUsers =
          (data.partners[partnerIndex].totalReferredUsers || 0) + 1;
      }

      writeAffiliatesData(data);

      return NextResponse.json(
        {
          success: true,
          message: 'تم تسجيل طلب الإحالة، وسيتم احتساب الأرباح فور اعتماد وتفعيل الكود',
          commissionAmount,
          productType: resolvedProductType,
          partnerName: partner.userName,
          conversion,
        },
        { status: 201, headers: corsHeaders() }
      );
    }

    // ── CONFIRM CONVERSION & CREDIT PROFIT (تأكيد واحتساب الربح بعد كود التفعيل) ──
    if (action === 'confirm_conversion_by_order' || action === 'confirm_conversion') {
      const {
        orderNumber,
        conversionId,
        buyerEmail,
        buyerId,
        buyerName,
        buyerPhone,
        orderAmount,
        productTitle,
        referralCode,
      } = body;

      if (!orderNumber && !conversionId) {
        return NextResponse.json(
          { success: false, error: 'رقم الطلب أو معرف التحويل مطلوب للتأكيد' },
          { status: 400, headers: corsHeaders() }
        );
      }

      let convIndex = (data.conversions || []).findIndex(
        (c) =>
          (orderNumber && String(c.orderNumber) === String(orderNumber)) ||
          (conversionId && c.id === conversionId)
      );

      // If conversion not found in data.conversions, auto-create it if buyer was referred or partner matches!
      if (convIndex === -1 && orderNumber) {
        let matchedPartner = null;

        if (referralCode) {
          matchedPartner = data.partners.find(
            (p) => p.referralCode && p.referralCode.toUpperCase() === referralCode.trim().toUpperCase()
          );
        }

        if (!matchedPartner && (buyerId || buyerEmail)) {
          const lead = (data.referredUsers || []).find(
            (u) =>
              (buyerId && String(u.userId) === String(buyerId)) ||
              (buyerEmail && u.userEmail && u.userEmail.toLowerCase() === buyerEmail.toLowerCase())
          );
          if (lead) {
            matchedPartner = data.partners.find(
              (p) => p.id === lead.partnerId || p.referralCode === lead.referralCode
            );
          }
        }

        // If only 1 partner exists in system and buyer is not that partner, attribute to that partner
        if (!matchedPartner && data.partners.length === 1) {
          const p = data.partners[0];
          const isSelf =
            (buyerId && String(p.userId) === String(buyerId)) ||
            (buyerEmail && p.userEmail && p.userEmail.toLowerCase() === buyerEmail.toLowerCase());
          if (!isSelf) {
            matchedPartner = p;
          }
        }

        if (matchedPartner) {
          const numAmount = Math.max(0, Number(orderAmount) || 199);
          const comm = Math.round(numAmount * 0.10 * 100) / 100;
          const newConv = {
            id: `conv-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
            referralCode: matchedPartner.referralCode,
            partnerId: matchedPartner.id,
            partnerName: matchedPartner.userName,
            orderNumber: String(orderNumber),
            orderAmount: numAmount,
            commissionRate: 0.10,
            commissionAmount: comm,
            currency: 'USD',
            productType: 'COURSE',
            productName: productTitle || 'دورة تدريبية',
            buyerName: buyerName || 'مشترك جديد',
            buyerEmail: buyerEmail || '',
            buyerPhone: buyerPhone || '',
            buyerId: buyerId || null,
            status: 'PENDING',
            createdAt: new Date().toISOString(),
          };
          if (!data.conversions) data.conversions = [];
          data.conversions.push(newConv);
          convIndex = data.conversions.length - 1;
        }
      }

      if (convIndex === -1) {
        return NextResponse.json(
          { success: false, message: 'لا يوجد اشتراك إحالة معلق لهذا الطلب' },
          { status: 404, headers: corsHeaders() }
        );
      }

      const conv = data.conversions[convIndex];

      // Clean up product name if it was a raw database ID
      if (productTitle && !/^c[a-z0-9]{20,}$/i.test(productTitle)) {
        if (!conv.productName || /^c[a-z0-9]{20,}$/i.test(conv.productName)) {
          conv.productName = productTitle;
        }
      }

      if (conv.status === 'CONFIRMED') {
        return NextResponse.json(
          { success: true, message: 'العمولة معتمدة ومحتسبة بالفعل مسبقاً', conversion: conv },
          { status: 200, headers: corsHeaders() }
        );
      }

      // Mark confirmed and timestamp
      conv.status = 'CONFIRMED';
      conv.confirmedAt = new Date().toISOString();

      // Check if buyer already had a prior confirmed conversion for this category (Group or Course)
      const hasPriorConfirmed = (data.conversions || []).some((c) => {
        if (c.id === conv.id) return false;
        if (c.status !== 'CONFIRMED') return false;
        if (c.productType !== conv.productType) return false;
        const matchId = conv.buyerId && c.buyerId && String(c.buyerId).toLowerCase() === String(conv.buyerId).toLowerCase();
        const matchEmail = conv.buyerEmail && c.buyerEmail && c.buyerEmail.trim().toLowerCase() === conv.buyerEmail.trim().toLowerCase();
        const matchPhone = conv.buyerPhone && c.buyerPhone && c.buyerPhone.replace(/\D/g, '').length >= 8 &&
          c.buyerPhone.replace(/\D/g, '').endsWith(conv.buyerPhone.replace(/\D/g, '').slice(-8));
        return Boolean(matchId || matchEmail || matchPhone);
      });

      if (hasPriorConfirmed) {
        conv.commissionAmount = 0;
        conv.firstTimeExceeded = true;
        conv.note = 'لم تُحتسب عمولة لأن المستخدم لديه اشتراك سابق بالفعل في هذه الفئة (أول مرة فقط)';
      }

      // Now calculate and add profit to the partner!
      const pIdx = data.partners.findIndex(
        (p) => p.id === conv.partnerId || p.referralCode === conv.referralCode
      );

      if (pIdx !== -1) {
        const comm = Number(conv.commissionAmount) || 0;
        data.partners[pIdx].totalEarnings =
          Math.round(((data.partners[pIdx].totalEarnings || 0) + comm) * 100) / 100;
        data.partners[pIdx].availableBalance =
          Math.round(((data.partners[pIdx].availableBalance || 0) + comm) * 100) / 100;
        data.partners[pIdx].totalConversions =
          (data.partners[pIdx].totalConversions || 0) + 1;
      }

      // Update referred user stats
      if (!data.referredUsers) data.referredUsers = [];
      let refUser = data.referredUsers.find(
        (u) =>
          (u.referralCode === conv.referralCode || u.partnerId === conv.partnerId) &&
          ((conv.buyerId && String(u.userId) === String(conv.buyerId)) ||
            (conv.buyerEmail && u.userEmail === conv.buyerEmail) ||
            (conv.buyerName && u.userName === conv.buyerName))
      );

      if (refUser) {
        refUser.subscriptionsCount = (refUser.subscriptionsCount || 0) + 1;
        refUser.totalSpent =
          Math.round(((refUser.totalSpent || 0) + (Number(conv.orderAmount) || 0)) * 100) / 100;
        refUser.totalCommission =
          Math.round(((refUser.totalCommission || 0) + (Number(conv.commissionAmount) || 0)) * 100) / 100;
        refUser.status = 'SUBSCRIBED';
      }

      writeAffiliatesData(data);

      return NextResponse.json(
        {
          success: true,
          message: `تم اعتماد وتأكيد كود التفعيل واحتساب عمولة بقيمة $${conv.commissionAmount} للشريك بنجاح!`,
          conversion: conv,
        },
        { status: 200, headers: corsHeaders() }
      );
    }

    // ── 5. REQUEST PAYOUT ──
    if (action === 'request_payout') {
      const { userId, amount, method, accountDetails, notes } = body;

      if (!userId || !amount || !method || !accountDetails) {
        return NextResponse.json(
          { success: false, error: 'جميع بيانات طلب السحب مطلوبة' },
          { status: 400, headers: corsHeaders() }
        );
      }

      const partnerIndex = data.partners.findIndex((p) => String(p.userId) === String(userId));
      if (partnerIndex === -1) {
        return NextResponse.json(
          { success: false, error: 'حساب الشريك غير موجود' },
          { status: 404, headers: corsHeaders() }
        );
      }

      const partner = data.partners[partnerIndex];
      const withdrawAmount = Math.round(Number(amount) * 100) / 100;

      if (withdrawAmount <= 0) {
        return NextResponse.json(
          { success: false, error: 'المبلغ غير صالح للسحب' },
          { status: 400, headers: corsHeaders() }
        );
      }

      if (withdrawAmount < 100) {
        return NextResponse.json(
          { success: false, error: 'الحد الأدنى لطلب السحب هو 100 دولار' },
          { status: 400, headers: corsHeaders() }
        );
      }

      if (withdrawAmount > (partner.availableBalance || 0)) {
        return NextResponse.json(
          { success: false, error: 'الرصيد المتاح غير كافٍ لإتمام السحب' },
          { status: 400, headers: corsHeaders() }
        );
      }

      // Deduct from available balance
      data.partners[partnerIndex].availableBalance =
        Math.round(((partner.availableBalance || 0) - withdrawAmount) * 100) / 100;

      const payout = {
        id: `pay-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        partnerId: partner.id,
        userId: partner.userId,
        userName: partner.userName,
        referralCode: partner.referralCode,
        amount: withdrawAmount,
        method, // INSTAPAY, VODAFONE_CASH, USDT_TRC20, BANK_TRANSFER
        accountDetails: String(accountDetails).trim(),
        notes: notes ? String(notes).trim() : '',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      };

      data.payouts.push(payout);
      writeAffiliatesData(data);

      return NextResponse.json(
        {
          success: true,
          message: 'تم إرسال طلب السحب بنجاح، سيتم تنفيذه خلال 24-48 ساعة عمل',
          payout,
          newBalance: data.partners[partnerIndex].availableBalance,
        },
        { status: 201, headers: corsHeaders() }
      );
    }

    // ── 6. UPDATE PAYOUT (Admin action) ──
    if (action === 'update_payout') {
      const { payoutId, status, adminNotes } = body;
      if (!payoutId || !status) {
        return NextResponse.json(
          { success: false, error: 'معرف الطلب والحالة مطلوبان' },
          { status: 400, headers: corsHeaders() }
        );
      }

      const payoutIndex = data.payouts.findIndex((p) => p.id === payoutId);
      if (payoutIndex === -1) {
        return NextResponse.json(
          { success: false, error: 'طلب السحب غير موجود' },
          { status: 404, headers: corsHeaders() }
        );
      }

      const payout = data.payouts[payoutIndex];
      const prevStatus = payout.status;
      payout.status = status; // 'COMPLETED' | 'REJECTED' | 'PENDING'
      if (adminNotes) payout.adminNotes = adminNotes;
      payout.updatedAt = new Date().toISOString();

      // If rejected from pending, refund balance to partner
      if (status === 'REJECTED' && prevStatus === 'PENDING') {
        const partnerIndex = data.partners.findIndex((p) => p.id === payout.partnerId);
        if (partnerIndex !== -1) {
          data.partners[partnerIndex].availableBalance =
            Math.round(((data.partners[partnerIndex].availableBalance || 0) + payout.amount) * 100) / 100;
        }
      }

      writeAffiliatesData(data);

      return NextResponse.json(
        {
          success: true,
          message: `تم تحديث حالة طلب السحب إلى ${status}`,
          payout,
        },
        { status: 200, headers: corsHeaders() }
      );
    }

    // ── 7. DELETE PARTNER ──
    if (action === 'delete_partner') {
      const { partnerId, referralCode, deleteRelated = true } = body;
      const partnerIndex = data.partners.findIndex(
        (p) => (partnerId && p.id === partnerId) || (referralCode && p.referralCode === referralCode)
      );

      if (partnerIndex === -1) {
        return NextResponse.json(
          { success: false, error: 'الشريك المطلوب حذفه غير موجود' },
          { status: 404, headers: corsHeaders() }
        );
      }

      const target = data.partners[partnerIndex];
      const targetCode = target.referralCode;
      const targetId = target.id;

      data.partners.splice(partnerIndex, 1);

      if (deleteRelated) {
        data.clicks = (data.clicks || []).filter(
          (c) => c.partnerId !== targetId && c.referralCode !== targetCode
        );
        data.referredUsers = (data.referredUsers || []).filter(
          (u) => u.partnerId !== targetId && u.referralCode !== targetCode
        );
        data.conversions = (data.conversions || []).filter(
          (c) => c.partnerId !== targetId && c.referralCode !== targetCode
        );
        data.payouts = (data.payouts || []).filter((p) => p.partnerId !== targetId);
      }

      writeAffiliatesData(data);
      return NextResponse.json(
        {
          success: true,
          message: `تم حذف الشريك "${target.userName}" وإلغاء كود الإحالة (${targetCode}) بنجاح`,
          deletedPartner: target,
        },
        { status: 200, headers: corsHeaders() }
      );
    }

    // ── 8. DELETE REFERRED USER (LEAD) ──
    if (action === 'delete_referred_user') {
      const { leadId } = body;
      const leadIndex = (data.referredUsers || []).findIndex((u) => u.id === leadId);
      if (leadIndex === -1) {
        return NextResponse.json(
          { success: false, error: 'العضو المحال غير موجود' },
          { status: 404, headers: corsHeaders() }
        );
      }

      const targetLead = data.referredUsers[leadIndex];
      data.referredUsers.splice(leadIndex, 1);

      if (targetLead.partnerId || targetLead.referralCode) {
        const pIdx = data.partners.findIndex(
          (p) => p.id === targetLead.partnerId || p.referralCode === targetLead.referralCode
        );
        if (pIdx !== -1) {
          data.partners[pIdx].totalReferredUsers = Math.max(
            0,
            (data.partners[pIdx].totalReferredUsers || 1) - 1
          );
        }
      }

      writeAffiliatesData(data);
      return NextResponse.json(
        { success: true, message: 'تم حذف العضو المحال بنجاح' },
        { status: 200, headers: corsHeaders() }
      );
    }

    // ── 9. DELETE CONVERSION ──
    if (action === 'delete_conversion') {
      const { conversionId } = body;
      const convIndex = (data.conversions || []).findIndex((c) => c.id === conversionId);
      if (convIndex === -1) {
        return NextResponse.json(
          { success: false, error: 'سجل الاشتراك غير موجود' },
          { status: 404, headers: corsHeaders() }
        );
      }

      const targetConv = data.conversions[convIndex];
      data.conversions.splice(convIndex, 1);

      if (targetConv.partnerId || targetConv.referralCode) {
        const pIdx = data.partners.findIndex(
          (p) => p.id === targetConv.partnerId || p.referralCode === targetConv.referralCode
        );
        if (pIdx !== -1) {
          const comm = Number(targetConv.commissionAmount) || 0;
          data.partners[pIdx].totalEarnings = Math.max(
            0,
            Math.round(((data.partners[pIdx].totalEarnings || 0) - comm) * 100) / 100
          );
          data.partners[pIdx].availableBalance = Math.max(
            0,
            Math.round(((data.partners[pIdx].availableBalance || 0) - comm) * 100) / 100
          );
          data.partners[pIdx].totalConversions = Math.max(
            0,
            (data.partners[pIdx].totalConversions || 1) - 1
          );
        }
      }

      writeAffiliatesData(data);
      return NextResponse.json(
        { success: true, message: 'تم حذف سجل الاشتراك بنجاح' },
        { status: 200, headers: corsHeaders() }
      );
    }

    // ── 10. DELETE PAYOUT ──
    if (action === 'delete_payout') {
      const { payoutId } = body;
      const payoutIndex = (data.payouts || []).findIndex((p) => p.id === payoutId);
      if (payoutIndex === -1) {
        return NextResponse.json(
          { success: false, error: 'طلب السحب غير موجود' },
          { status: 404, headers: corsHeaders() }
        );
      }

      data.payouts.splice(payoutIndex, 1);
      writeAffiliatesData(data);
      return NextResponse.json(
        { success: true, message: 'تم حذف سجل طلب السحب بنجاح' },
        { status: 200, headers: corsHeaders() }
      );
    }

    // ── 11. CREATIVES MANAGEMENT ──
    if (action === 'create_creative') {
      const { title, badge, imageUrl, caption, isActive = true } = body;
      if (!caption && !imageUrl && !title) {
        return NextResponse.json(
          { success: false, error: 'يرجى إدخال عنوان الإعلان أو نصه أو صورته' },
          { status: 400, headers: corsHeaders() }
        );
      }

      const newCreative = {
        id: `crt-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        title: (title || '').trim() || 'إعلان ترويجي جديد',
        badge: (badge || '').trim() || 'عام',
        imageUrl: (imageUrl || '').trim(),
        caption: (caption || '').trim(),
        isActive: isActive !== false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (!Array.isArray(data.creatives)) data.creatives = [];
      data.creatives.unshift(newCreative);
      writeAffiliatesData(data);

      return NextResponse.json(
        {
          success: true,
          creative: newCreative,
          message: 'تمت إضافة الإعلان الترويجي بنجاح',
        },
        { status: 200, headers: corsHeaders() }
      );
    }

    if (action === 'update_creative') {
      const { id, title, badge, imageUrl, caption, isActive } = body;
      if (!id) {
        return NextResponse.json(
          { success: false, error: 'معرف الإعلان مطلوب' },
          { status: 400, headers: corsHeaders() }
        );
      }

      if (!Array.isArray(data.creatives)) data.creatives = [];
      const idx = data.creatives.findIndex((c) => c.id === id);
      if (idx === -1) {
        return NextResponse.json(
          { success: false, error: 'الإعلان غير موجود' },
          { status: 404, headers: corsHeaders() }
        );
      }

      const target = { ...data.creatives[idx] };
      if (title !== undefined) target.title = (title || '').trim();
      if (badge !== undefined) target.badge = (badge || '').trim();
      if (imageUrl !== undefined) target.imageUrl = (imageUrl || '').trim();
      if (caption !== undefined) target.caption = (caption || '').trim();
      if (isActive !== undefined) target.isActive = Boolean(isActive);
      target.updatedAt = new Date().toISOString();

      data.creatives[idx] = target;
      writeAffiliatesData(data);

      return NextResponse.json(
        {
          success: true,
          creative: target,
          message: 'تم تحديث الإعلان الترويجي بنجاح',
        },
        { status: 200, headers: corsHeaders() }
      );
    }

    if (action === 'delete_creative') {
      const { id } = body;
      if (!id) {
        return NextResponse.json(
          { success: false, error: 'معرف الإعلان مطلوب للحذف' },
          { status: 400, headers: corsHeaders() }
        );
      }

      if (!Array.isArray(data.creatives)) data.creatives = [];
      data.creatives = data.creatives.filter((c) => c.id !== id);
      writeAffiliatesData(data);

      return NextResponse.json(
        {
          success: true,
          message: 'تم حذف الإعلان الترويجي بنجاح',
        },
        { status: 200, headers: corsHeaders() }
      );
    }

    return NextResponse.json(
      { success: false, error: 'إجراء غير معروف' },
      { status: 400, headers: corsHeaders() }
    );
  } catch (err) {
    console.error('Affiliate POST error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: corsHeaders() }
    );
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'partner';
    const id = searchParams.get('id');
    const deleteRelated = searchParams.get('deleteRelated') !== 'false';

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'المعرف مطلوب للحذف' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const data = readAffiliatesData();

    if (type === 'creative') {
      if (!Array.isArray(data.creatives)) data.creatives = [];
      data.creatives = data.creatives.filter((c) => c.id !== id);
      writeAffiliatesData(data);
      return NextResponse.json(
        { success: true, message: 'تم حذف الإعلان الترويجي بنجاح' },
        { status: 200, headers: corsHeaders() }
      );
    }

    if (type === 'partner') {
      const pIdx = data.partners.findIndex((p) => p.id === id || p.referralCode === id);
      if (pIdx === -1) {
        return NextResponse.json(
          { success: false, error: 'الشريك غير موجود' },
          { status: 404, headers: corsHeaders() }
        );
      }
      const target = data.partners[pIdx];
      data.partners.splice(pIdx, 1);

      if (deleteRelated) {
        data.clicks = (data.clicks || []).filter(
          (c) => c.partnerId !== target.id && c.referralCode !== target.referralCode
        );
        data.referredUsers = (data.referredUsers || []).filter(
          (u) => u.partnerId !== target.id && u.referralCode !== target.referralCode
        );
        data.conversions = (data.conversions || []).filter(
          (c) => c.partnerId !== target.id && c.referralCode !== target.referralCode
        );
        data.payouts = (data.payouts || []).filter((p) => p.partnerId !== target.id);
      }

      writeAffiliatesData(data);
      return NextResponse.json(
        {
          success: true,
          message: `تم حذف الشريك "${target.userName}" بنجاح`,
        },
        { status: 200, headers: corsHeaders() }
      );
    }

    if (type === 'lead') {
      const idx = (data.referredUsers || []).findIndex((u) => u.id === id);
      if (idx === -1) {
        return NextResponse.json(
          { success: false, error: 'العضو المحال غير موجود' },
          { status: 404, headers: corsHeaders() }
        );
      }
      data.referredUsers.splice(idx, 1);
      writeAffiliatesData(data);
      return NextResponse.json(
        { success: true, message: 'تم حذف العضو المحال بنجاح' },
        { status: 200, headers: corsHeaders() }
      );
    }

    return NextResponse.json(
      { success: false, error: 'نوع الحذف غير معروف' },
      { status: 400, headers: corsHeaders() }
    );
  } catch (err) {
    console.error('Affiliates DELETE error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: corsHeaders() }
    );
  }
}
