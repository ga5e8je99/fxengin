import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DATA_FILE = path.join(process.cwd(), 'data', 'affiliates.json');

function getAffiliatesCandidatePaths() {
  const list = [];
  const primary = path.join(process.cwd(), 'data', 'affiliates.json');
  list.push(primary);

  if (process.env.SHARED_DATA_DIR) {
    list.push(path.join(process.env.SHARED_DATA_DIR, 'affiliates.json'));
  }
  list.push('/app/data/affiliates.json');
  list.push(path.join(process.cwd(), '..', 'shared-data', 'affiliates.json'));
  list.push(path.join(process.cwd(), '..', 'fx-engin', 'data', 'affiliates.json'));
  list.push(path.join(process.cwd(), '..', 'fxengin-admin', 'data', 'affiliates.json'));

  return [...new Set(list)];
}

function resolveAffiliatesReadFile() {
  const candidates = getAffiliatesCandidatePaths();
  let bestFile = null;
  let bestMtime = 0;

  for (const f of candidates) {
    try {
      if (fs.existsSync(f)) {
        const stats = fs.statSync(f);
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
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf-8');
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
    console.error('Error reading affiliates.json in admin:', err);
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
      console.error('Error fallback writing affiliates.json in admin:', err);
      return false;
    }
  }
  return true;
}

export async function GET(req) {
  try {
    const data = readAffiliatesData();

    const confirmedConversions = data.conversions.filter((c) => c.status === 'CONFIRMED');
    const pendingConversions = data.conversions.filter((c) => c.status === 'PENDING' || !c.status);

    const totalEarningsAll = data.partners.reduce(
      (acc, p) => acc + (Number(p.totalEarnings) || 0),
      0
    );
    const totalAvailableAll = data.partners.reduce(
      (acc, p) => acc + (Number(p.availableBalance) || 0),
      0
    );

    const coursesCount = confirmedConversions.filter(
      (c) =>
        c.productType === 'COURSE' ||
        (!c.productType &&
          !c.productName?.toLowerCase().includes('group') &&
          !c.productName?.includes('جروب') &&
          !c.productName?.includes('توصيات') &&
          !c.productName?.includes('signals'))
    ).length;

    const groupsCount = confirmedConversions.filter(
      (c) =>
        c.productType === 'GROUP' ||
        c.productName?.toLowerCase().includes('group') ||
        c.productName?.includes('جروب') ||
        c.productName?.includes('توصيات') ||
        c.productName?.includes('signals') ||
        c.productName?.includes('إشارات')
    ).length;

    const totalSalesVolume = confirmedConversions.reduce(
      (acc, c) => acc + (Number(c.orderAmount) || 0),
      0
    );

    return NextResponse.json({
      success: true,
      summary: {
        totalPartners: data.partners.length,
        totalReferredUsers: data.referredUsers.length,
        totalConversions: confirmedConversions.length,
        pendingConversionsCount: pendingConversions.length,
        coursesCount,
        groupsCount,
        totalSalesVolume: Number(totalSalesVolume).toFixed(2),
        totalEarningsAll: Number(totalEarningsAll).toFixed(2),
        totalAvailableAll: Number(totalAvailableAll).toFixed(2),
        totalClicks: data.clicks.length,
        totalPayouts: data.payouts.length,
        pendingPayoutsCount: data.payouts.filter((p) => p.status === 'PENDING').length,
        totalCreatives: (data.creatives || []).length,
      },
      partners: data.partners,
      conversions: data.conversions.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      ),
      referredUsers: data.referredUsers.sort(
        (a, b) => new Date(b.registeredAt || 0) - new Date(a.registeredAt || 0)
      ),
      payouts: data.payouts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
      creatives: (data.creatives || []).sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      ),
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (err) {
    console.error('Admin Affiliates API error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action } = body;
    const data = readAffiliatesData();

    if (action === 'update_payout') {
      const { payoutId, status, adminNotes } = body;
      const payoutIndex = data.payouts.findIndex((p) => p.id === payoutId);
      if (payoutIndex === -1) {
        return NextResponse.json({ success: false, error: 'طلب السحب غير موجود' }, { status: 404 });
      }

      const payout = data.payouts[payoutIndex];
      const prevStatus = payout.status;
      payout.status = status; // 'COMPLETED' | 'REJECTED' | 'PENDING'
      if (adminNotes !== undefined) payout.adminNotes = adminNotes;
      payout.updatedAt = new Date().toISOString();

      // If rejected from pending, refund available balance to partner
      if (status === 'REJECTED' && prevStatus === 'PENDING') {
        const partnerIndex = data.partners.findIndex((p) => p.id === payout.partnerId);
        if (partnerIndex !== -1) {
          data.partners[partnerIndex].availableBalance =
            Math.round(((data.partners[partnerIndex].availableBalance || 0) + payout.amount) * 100) / 100;
        }
      }

      writeAffiliatesData(data);
      return NextResponse.json({ success: true, payout, message: `تم تحديث حالة الطلب إلى ${status}` });
    }

    // ── CONFIRM CONVERSION & CREDIT PROFIT (اعتماد وتأكيد احتساب الربح بعد كود التفعيل) ──
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
          { status: 400 }
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
          { status: 404 }
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
          { status: 200 }
        );
      }

      // Mark confirmed
      conv.status = 'CONFIRMED';
      conv.confirmedAt = new Date().toISOString();

      // Credit partner
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
      } else {
        refUser = {
          id: `ref-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
          referralCode: conv.referralCode,
          partnerId: conv.partnerId,
          partnerName: conv.partnerName,
          userId: conv.buyerId || null,
          userName: conv.buyerName || 'مشترك جديد',
          userEmail: conv.buyerEmail || '',
          userPhone: conv.buyerPhone || '',
          registeredAt: new Date().toISOString(),
          subscriptionsCount: 1,
          totalSpent: Math.round((Number(conv.orderAmount) || 0) * 100) / 100,
          totalCommission: Math.round((Number(conv.commissionAmount) || 0) * 100) / 100,
          status: 'SUBSCRIBED',
        };
        data.referredUsers.push(refUser);
        if (pIdx !== -1) {
          data.partners[pIdx].totalReferredUsers = (data.partners[pIdx].totalReferredUsers || 0) + 1;
        }
      }

      writeAffiliatesData(data);

      return NextResponse.json(
        {
          success: true,
          message: `تم اعتماد وتأكيد كود التفعيل واحتساب عمولة بقيمة $${conv.commissionAmount} للشريك بنجاح!`,
          conversion: conv,
        },
        { status: 200 }
      );
    }

    // ── DELETE PARTNER ──
    if (action === 'delete_partner') {
      const { partnerId, referralCode, deleteRelated = true } = body;
      const partnerIndex = data.partners.findIndex(
        (p) => (partnerId && p.id === partnerId) || (referralCode && p.referralCode === referralCode)
      );

      if (partnerIndex === -1) {
        return NextResponse.json({ success: false, error: 'الشريك المطلوب حذفه غير موجود' }, { status: 404 });
      }

      const target = data.partners[partnerIndex];
      const targetCode = target.referralCode;
      const targetId = target.id;

      // Remove from partners list
      data.partners.splice(partnerIndex, 1);

      // Optionally remove associated clicks, leads, conversions, payouts
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
      return NextResponse.json({
        success: true,
        message: `تم حذف الشريك "${target.userName}" وإلغاء كود الإحالة (${targetCode}) بنجاح`,
        deletedPartner: target,
      });
    }

    // ── DELETE REFERRED USER (LEAD) ──
    if (action === 'delete_referred_user') {
      const { leadId } = body;
      const leadIndex = (data.referredUsers || []).findIndex((u) => u.id === leadId);
      if (leadIndex === -1) {
        return NextResponse.json({ success: false, error: 'العضو المحال غير موجود' }, { status: 404 });
      }

      const targetLead = data.referredUsers[leadIndex];
      data.referredUsers.splice(leadIndex, 1);

      // Decrement partner's totalReferredUsers count
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
      return NextResponse.json({ success: true, message: 'تم حذف العضو المحال بنجاح' });
    }

    // ── DELETE CONVERSION ──
    if (action === 'delete_conversion') {
      const { conversionId } = body;
      const convIndex = (data.conversions || []).findIndex((c) => c.id === conversionId);
      if (convIndex === -1) {
        return NextResponse.json({ success: false, error: 'سجل الاشتراك غير موجود' }, { status: 404 });
      }

      const targetConv = data.conversions[convIndex];
      data.conversions.splice(convIndex, 1);

      // Revert partner commission if still active
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
      return NextResponse.json({ success: true, message: 'تم حذف سجل الاشتراك بنجاح' });
    }

    // ── DELETE PAYOUT ──
    if (action === 'delete_payout') {
      const { payoutId } = body;
      const payoutIndex = (data.payouts || []).findIndex((p) => p.id === payoutId);
      if (payoutIndex === -1) {
        return NextResponse.json({ success: false, error: 'طلب السحب غير موجود' }, { status: 404 });
      }

      data.payouts.splice(payoutIndex, 1);
      writeAffiliatesData(data);
      return NextResponse.json({ success: true, message: 'تم حذف سجل طلب السحب بنجاح' });
    }

    // ── CREATIVES MANAGEMENT (المواد التسويقية والإعلانات) ──
    if (action === 'create_creative') {
      const { title, badge, imageUrl, caption, isActive = true } = body;
      if (!caption && !imageUrl && !title) {
        return NextResponse.json(
          { success: false, error: 'يرجى إدخال عنوان الإعلان أو نصه أو صورته' },
          { status: 400 }
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

      return NextResponse.json({
        success: true,
        creative: newCreative,
        message: 'تمت إضافة الإعلان الترويجي بنجاح',
      });
    }

    if (action === 'update_creative') {
      const { id, title, badge, imageUrl, caption, isActive } = body;
      if (!id) {
        return NextResponse.json({ success: false, error: 'معرف الإعلان مطلوب' }, { status: 400 });
      }

      if (!Array.isArray(data.creatives)) data.creatives = [];
      const idx = data.creatives.findIndex((c) => c.id === id);
      if (idx === -1) {
        return NextResponse.json({ success: false, error: 'الإعلان غير موجود' }, { status: 404 });
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

      return NextResponse.json({
        success: true,
        creative: target,
        message: 'تم تحديث الإعلان الترويجي بنجاح',
      });
    }

    if (action === 'delete_creative') {
      const { id } = body;
      if (!id) {
        return NextResponse.json({ success: false, error: 'معرف الإعلان مطلوب للحذف' }, { status: 400 });
      }

      if (!Array.isArray(data.creatives)) data.creatives = [];
      data.creatives = data.creatives.filter((c) => c.id !== id);
      writeAffiliatesData(data);

      return NextResponse.json({
        success: true,
        message: 'تم حذف الإعلان الترويجي بنجاح',
      });
    }

    return NextResponse.json({ success: false, error: 'إجراء غير مدعوم' }, { status: 400 });
  } catch (err) {
    console.error('Admin Affiliates POST error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'partner';
    const id = searchParams.get('id');
    const deleteRelated = searchParams.get('deleteRelated') !== 'false';

    if (!id) {
      return NextResponse.json({ success: false, error: 'المعرف مطلوب للحذف' }, { status: 400 });
    }

    const data = readAffiliatesData();

    if (type === 'creative') {
      if (!Array.isArray(data.creatives)) data.creatives = [];
      data.creatives = data.creatives.filter((c) => c.id !== id);
      writeAffiliatesData(data);
      return NextResponse.json({ success: true, message: 'تم حذف الإعلان الترويجي بنجاح' });
    }

    if (type === 'partner') {
      const pIdx = data.partners.findIndex((p) => p.id === id || p.referralCode === id);
      if (pIdx === -1) {
        return NextResponse.json({ success: false, error: 'الشريك غير موجود' }, { status: 404 });
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
      return NextResponse.json({
        success: true,
        message: `تم حذف الشريك "${target.userName}" بنجاح`,
      });
    }

    if (type === 'lead') {
      const idx = (data.referredUsers || []).findIndex((u) => u.id === id);
      if (idx === -1) {
        return NextResponse.json({ success: false, error: 'العضو المحال غير موجود' }, { status: 404 });
      }
      data.referredUsers.splice(idx, 1);
      writeAffiliatesData(data);
      return NextResponse.json({ success: true, message: 'تم حذف العضو المحال بنجاح' });
    }

    return NextResponse.json({ success: false, error: 'نوع الحذف غير معروف' }, { status: 400 });
  } catch (err) {
    console.error('Admin Affiliates DELETE error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
