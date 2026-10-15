import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getCandidatePaths() {
  const list = [];
  const primary = path.join(process.cwd(), 'data', 'competition-qualification.json');
  list.push(primary);

  if (process.env.SHARED_DATA_DIR) {
    list.push(path.join(process.env.SHARED_DATA_DIR, 'competition-qualification.json'));
  }
  list.push('/app/data/competition-qualification.json');
  list.push('/root/fxengin-website/shared-data/competition-qualification.json');
  list.push(path.join(process.cwd(), '..', 'shared-data', 'competition-qualification.json'));
  list.push(path.join(process.cwd(), '..', 'fx-engin', 'data', 'competition-qualification.json'));
  list.push(path.join(process.cwd(), '..', 'fxengin-admin', 'data', 'competition-qualification.json'));

  return [...new Set(list)];
}

function resolveReadFile() {
  const candidates = getCandidatePaths();
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
  return bestFile || path.join(process.cwd(), 'data', 'competition-qualification.json');
}

function readData() {
  try {
    const file = resolveReadFile();
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf-8');
      const parsed = JSON.parse(content);
      return {
        participants: Array.isArray(parsed?.participants) ? parsed.participants : [],
        clicks: Array.isArray(parsed?.clicks) ? parsed.clicks : [],
      };
    }
  } catch (err) {
    console.error('Error reading competition-qualification.json in admin:', err);
  }
  return { participants: [], clicks: [] };
}

function writeData(data) {
  const content = JSON.stringify(data, null, 2);
  const candidates = getCandidatePaths();

  for (const f of candidates) {
    try {
      const dir = path.dirname(f);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(f, content, 'utf-8');
    } catch {}
  }
}

export async function GET() {
  const data = readData();
  const participants = data.participants || [];
  const clicks = data.clicks || [];

  const totalParticipants = participants.length;
  const qualifiedCount = participants.filter((p) => p.isQualified || p.manualApproval).length;
  const inProgressCount = totalParticipants - qualifiedCount;
  const totalClicks = clicks.length;

  return NextResponse.json({
    success: true,
    stats: {
      totalParticipants,
      qualifiedCount,
      inProgressCount,
      totalClicks,
    },
    participants,
    recentClicks: clicks.slice(-100).reverse(),
  });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { action, userId, balance, category } = body;
  const data = readData();
  const nowIso = new Date().toISOString();

  // 1. إضافة متسابق يدوي (مشترك عبر الشركة مباشرة)
  if (action === 'add_manual_participant') {
    const pUserId = body.userId || `company_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const cleanEmail = (body.userEmail || body.email || '').trim().toLowerCase();
    const existingIndex = data.participants.findIndex(
      (p) => p.userId === pUserId || (cleanEmail && p.userEmail && p.userEmail.toLowerCase() === cleanEmail)
    );

    const manualParticipant = {
      userId: pUserId,
      userName: body.userName || body.fullName || 'متسابق FXENGIN',
      userEmail: cleanEmail,
      userPhone: body.userPhone || body.phone || '',
      planCategory: body.planCategory || 'STANDARD',
      categoryTitleAr: body.categoryTitleAr || body.planTitle || 'مشترك عبر الشركة',
      categoryTitleEn: body.categoryTitleEn || 'Company Direct Participant',
      assignedBalance: Number(body.assignedBalance || body.initialBalance || body.balance || 10000),
      accountNumber: body.accountNumber || '',
      broker: body.broker || body.brokerServer || 'FXENGIN Prime ECN',
      isCompanyDirect: true,
      manualApproval: true,
      isQualified: true,
      qualifiedAt: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
      tasks: {
        telegram: {
          channel: 'tg',
          titleAr: 'مشاركة لينك التليجرام لـ 10 مستخدمين',
          titleEn: 'Share Telegram Link to 10 Users',
          required: 10,
          current: 10,
          completed: true,
          subLink: `/c/tg/${pUserId}`,
          targetUrl: 'https://t.me/FXENGIN1NEWS',
        },
        instagram: {
          channel: 'ig',
          titleAr: 'مشاركة حساب الانستجرام لـ 10 مستخدمين',
          titleEn: 'Share Instagram to 10 Users',
          required: 10,
          current: 10,
          completed: true,
          subLink: `/c/ig/${pUserId}`,
          targetUrl: 'https://www.instagram.com/fx_engin/',
        },
        facebook: {
          channel: 'fb',
          titleAr: 'مشاركة صفحة الفيسبوك لـ 10 مستخدمين',
          titleEn: 'Share Facebook to 10 Users',
          required: 10,
          current: 10,
          completed: true,
          subLink: `/c/fb/${pUserId}`,
          targetUrl: 'https://www.facebook.com/profile.php?id=61592983707520',
        },
        community: {
          channel: 'community',
          titleAr: 'الانضمام لمجتمعنا (ربح 10%) ومشاركة الرابط',
          titleEn: 'Join 10% Profit Community & Share Link',
          required: 1,
          current: 1,
          joined: true,
          shared: true,
          completed: true,
          subLink: `/c/community/${pUserId}`,
          targetUrl: 'https://fxengen.com/join-us',
        },
      },
    };

    if (existingIndex >= 0) {
      data.participants[existingIndex] = {
        ...data.participants[existingIndex],
        ...manualParticipant,
        createdAt: data.participants[existingIndex].createdAt || nowIso,
      };
    } else {
      data.participants.unshift(manualParticipant);
    }

    writeData(data);
    return NextResponse.json({
      success: true,
      participant: manualParticipant,
      message: 'تم إضافة المتسابق وتأهيله يدوياً بنجاح!',
    });
  }

  // 2. حذف متسابق
  if (action === 'delete_participant') {
    if (!userId && !body.email) {
      return NextResponse.json({ success: false, message: 'Missing userId or email' }, { status: 400 });
    }
    const cleanEmail = (body.email || body.userEmail || '').trim().toLowerCase();
    data.participants = data.participants.filter(
      (p) => p.userId !== userId && (!cleanEmail || !p.userEmail || p.userEmail.toLowerCase() !== cleanEmail)
    );
    data.clicks = data.clicks.filter((c) => c.userId !== userId);
    writeData(data);
    return NextResponse.json({
      success: true,
      message: 'تم حذف المتسابق من قائمة التأهل بنجاح',
    });
  }

  if (!userId) {
    return NextResponse.json({ success: false, message: 'Missing userId' }, { status: 400 });
  }

  const participant = data.participants.find((p) => p.userId === userId);

  if (!participant) {
    return NextResponse.json({ success: false, message: 'Participant not found' }, { status: 404 });
  }


  if (action === 'approve') {
    participant.manualApproval = true;
    participant.isQualified = true;
    participant.qualifiedAt = nowIso;
    participant.updatedAt = nowIso;
    Object.values(participant.tasks || {}).forEach((t) => {
      t.completed = true;
      t.current = t.required;
    });
    writeData(data);
    return NextResponse.json({
      success: true,
      participant,
      message: 'تم اعتماد وتأهيل المتسابق يدوياً بنجاح!',
    });
  }

  if (action === 'reset') {
    participant.manualApproval = false;
    participant.isQualified = false;
    participant.qualifiedAt = null;
    participant.updatedAt = nowIso;
    Object.values(participant.tasks || {}).forEach((t) => {
      t.completed = false;
      t.current = 0;
      if (t.joined) t.joined = false;
      if (t.shared) t.shared = false;
    });
    data.clicks = data.clicks.filter((c) => c.userId !== userId);
    writeData(data);
    return NextResponse.json({
      success: true,
      participant,
      message: 'تمت إعادة ضبط عدادات المتسابق بنجاح!',
    });
  }

  if (action === 'update_tier') {
    if (balance) participant.assignedBalance = Number(balance);
    if (category) participant.planCategory = category;
    participant.updatedAt = nowIso;
    writeData(data);
    return NextResponse.json({
      success: true,
      participant,
      message: 'تم تحديث فئة ورصيد المتسابق بنجاح!',
    });
  }

  return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
}
