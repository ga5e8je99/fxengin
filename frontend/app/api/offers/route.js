import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

function getOffersFilePath() {
  const candidates = [
    path.resolve('/app', 'data', 'offers.json'),
    path.resolve(process.cwd(), '..', 'shared-data', 'offers.json'),
    path.resolve(process.cwd(), 'shared-data', 'offers.json'),
    path.join(process.cwd(), 'data', 'offers.json'),
    path.resolve(process.cwd(), '..', 'admin', 'data', 'offers.json'),
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return path.join(process.cwd(), 'data', 'offers.json');
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const filePath = getOffersFilePath();

    let offers = [];
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          offers = parsed;
        }
      } catch (_) {}
    } else {
      // Only fallback if the file does not exist on disk at all
      const fallbackPath = path.join(process.cwd(), 'data', 'offers.json');
      if (fs.existsSync(fallbackPath)) {
        try {
          offers = JSON.parse(fs.readFileSync(fallbackPath, 'utf-8'));
        } catch (_) {}
      }
    }

    // Only return active and currently valid (unexpired) offers on public website
    const now = new Date();
    offers = (Array.isArray(offers) ? offers : []).filter((o) => {
      // Must not be explicitly inactive
      if (o.isActive === false) return false;

      // If scheduled with a future start date, do not show yet
      if (o.startDate) {
        const start = new Date(o.startDate);
        if (!isNaN(start.getTime()) && now < start) return false;
      }

      // If tied to an expiration period, automatically remove from website once expired
      if (o.endDate) {
        const end = new Date(o.endDate);
        if (!isNaN(end.getTime()) && now > end) return false;
      }

      return true;
    });

    if (category && category !== 'all') {
      offers = offers.filter((o) => o.category === category);
    }

    return NextResponse.json(
      { success: true, data: offers },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message, data: [] },
      { status: 500 }
    );
  }
}
