import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getEventsFilePath() {
  const candidates = [
    path.resolve('/app', 'data', 'broker-events.json'),
    path.resolve(process.cwd(), '..', 'shared-data', 'broker-events.json'),
    path.resolve(process.cwd(), 'shared-data', 'broker-events.json'),
    path.join(process.cwd(), 'data', 'broker-events.json'),
    path.resolve(process.cwd(), '..', 'admin', 'data', 'broker-events.json'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return path.join(process.cwd(), 'data', 'broker-events.json');
}

function readEvents() {
  const fp = getEventsFilePath();
  try {
    if (fs.existsSync(fp)) {
      const content = fs.readFileSync(fp, 'utf-8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.error('Error reading broker-events.json:', e);
  }
  return [];
}

function writeEvents(events) {
  const targetPaths = [
    getEventsFilePath(),
    path.join(process.cwd(), 'data', 'broker-events.json'),
    path.resolve(process.cwd(), '..', 'shared-data', 'broker-events.json'),
    path.resolve(process.cwd(), 'shared-data', 'broker-events.json'),
    path.resolve('/app', 'data', 'broker-events.json'),
  ];
  const uniquePaths = Array.from(new Set(targetPaths));
  let ok = false;
  for (const fp of uniquePaths) {
    try {
      const dir = path.dirname(fp);
      if (fs.existsSync(dir)) {
        fs.writeFileSync(fp, JSON.stringify(events, null, 2), 'utf-8');
        ok = true;
      }
    } catch (_) {}
  }
  return ok;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const brokerId = searchParams.get('brokerId');
    const status = searchParams.get('status');
    const id = searchParams.get('id');

    let events = readEvents();

    if (id) {
      const single = events.find((e) => e.id === id);
      if (!single) {
        return NextResponse.json({ success: false, error: 'الحدث غير موجود' }, { status: 404 });
      }
      return NextResponse.json({ success: true, event: single });
    }

    if (brokerId && brokerId !== 'all') {
      events = events.filter((e) => e.brokerId === brokerId || e.brokerSlug === brokerId);
    }

    if (status && status !== 'all') {
      events = events.filter((e) => e.status === status);
    }

    // Sort by eventDate ascending or createdAt descending
    events.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return NextResponse.json({
      success: true,
      data: events,
      total: events.length,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      brokerId,
      brokerName,
      titleAr,
      titleEn,
      descriptionAr,
      eventDate,
      startTime,
      endTime,
      durationHours,
      country,
      city,
      venueName,
      venueType,
      venueAddress,
      expectedAttendees,
      budgetUsd,
      sponsorshipType,
      invitationType,
      isVipEvent,
      vipPerks,
      servicesRequested,
      speakersRequested,
      targetAudience,
      notes,
      repContact,
    } = body;

    if (!brokerId || !titleAr || !eventDate || !city) {
      return NextResponse.json(
        { success: false, error: 'يرجى استيفاء الحقول الإجبارية (اسم الوسيط، عنوان الإيفينت، التاريخ، والمدينة)' },
        { status: 400 }
      );
    }

    const events = readEvents();
    const newId = `EVT-${new Date().getFullYear()}-${String(events.length + 1).padStart(3, '0')}`;

    const newEvent = {
      id: newId,
      brokerId,
      brokerSlug: brokerId,
      brokerName: brokerName || 'شريك FXENGIN المتعاقد',
      titleAr: String(titleAr).trim(),
      titleEn: String(titleEn || titleAr).trim(),
      descriptionAr: descriptionAr || '',
      eventDate: String(eventDate),
      startTime: startTime || '18:00',
      endTime: endTime || '22:00',
      durationHours: Number(durationHours) || 4,
      country: country || 'الشرق الأوسط',
      city: String(city).trim(),
      venueName: venueName || 'سيتم التحديد بالتنسيق مع إدارة FXENGIN',
      venueType: venueType || 'HOTEL_LUXURY',
      venueAddress: venueAddress || '',
      expectedAttendees: Number(expectedAttendees) || 100,
      budgetUsd: Number(budgetUsd) || 20000,
      sponsorshipType: sponsorshipType || 'FULL_BROKER_SPONSORED',
      invitationType: invitationType || 'VIP_INVITATIONS_ONLY',
      isVipEvent: Boolean(isVipEvent ?? (invitationType === 'VIP_INVITATIONS_ONLY')),
      vipPerks: Array.isArray(vipPerks) ? vipPerks : [],
      servicesRequested: {
        catering: servicesRequested?.catering || 'OPEN_BUFFET_VIP',
        mediaCoverage: Boolean(servicesRequested?.mediaCoverage ?? true),
        liveStreaming: Boolean(servicesRequested?.liveStreaming ?? true),
        avStageProduction: Boolean(servicesRequested?.avStageProduction ?? true),
        fxenginSpeakers: Boolean(servicesRequested?.fxenginSpeakers ?? true),
        brandingRollups: Boolean(servicesRequested?.brandingRollups ?? true),
        giveaways: Boolean(servicesRequested?.giveaways ?? true),
      },
      speakersRequested: speakersRequested || 'خبراء ومحللو منظومة FXENGIN',
      targetAudience: targetAudience || 'مجتمع متداولي النخبة والمستثمرين',
      notes: notes || '',
      repContact: repContact || '',
      status: 'PENDING_REVIEW', // Initial status
      adminNotes: 'تم استلام طلب تنظيم الإيفينت بنجاح، جاري مراجعة المواعيد والتنسيق مع فريق المؤتمرات.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    events.unshift(newEvent);
    writeEvents(events);

    return NextResponse.json({
      success: true,
      message: 'تم إرسال طلب تنظيم الإيفينت بنجاح وسيتم التواصل لتنسيق التفاصيل الفنية واللوجستية',
      event: newEvent,
    });
  } catch (error) {
    console.error('Error creating broker event:', error);
    return NextResponse.json({ success: false, error: 'تعذر حفظ طلب الإيفينت' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'معرف الحدث مطلوب' }, { status: 400 });
    }

    const events = readEvents();
    const idx = events.findIndex((e) => e.id === id);
    if (idx === -1) {
      return NextResponse.json({ success: false, error: 'الحدث غير موجود' }, { status: 404 });
    }

    events[idx] = {
      ...events[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    writeEvents(events);

    return NextResponse.json({
      success: true,
      message: 'تم تحديث بيانات الإيفينت بنجاح',
      event: events[idx],
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'معرف الحدث مطلوب' }, { status: 400 });
    }

    let events = readEvents();
    const initialLen = events.length;
    events = events.filter((e) => e.id !== id);

    if (events.length === initialLen) {
      return NextResponse.json({ success: false, error: 'الحدث غير موجود' }, { status: 404 });
    }

    writeEvents(events);

    return NextResponse.json({
      success: true,
      message: 'تم حذف طلب الإيفينت بنجاح',
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
