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
    path.resolve(process.cwd(), '..', 'frontend', 'data', 'broker-events.json'),
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
    path.resolve(process.cwd(), '..', 'frontend', 'data', 'broker-events.json'),
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

    let events = readEvents();

    if (brokerId && brokerId !== 'all') {
      events = events.filter((e) => e.brokerId === brokerId || e.brokerSlug === brokerId);
    }

    if (status && status !== 'all') {
      events = events.filter((e) => e.status === status);
    }

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
    const events = readEvents();
    const newId = `EVT-${new Date().getFullYear()}-${String(events.length + 1).padStart(3, '0')}`;

    const newEvent = {
      ...body,
      id: body.id || newId,
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    events.unshift(newEvent);
    writeEvents(events);

    return NextResponse.json({ success: true, event: newEvent });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
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
      message: 'تم تحديث حالة وبيانات الإيفينت بنجاح',
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

    return NextResponse.json({ success: true, message: 'تم حذف الإيفينت' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
