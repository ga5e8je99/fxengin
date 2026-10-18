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
      const content = fs.readFileSync(filePath, 'utf-8');
      offers = JSON.parse(content);
    }

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
