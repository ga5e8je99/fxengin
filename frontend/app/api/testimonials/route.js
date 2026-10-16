import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DATA_FILE = path.join(process.cwd(), 'data', 'testimonials.json');

function corsHeaders(isPublicGet = false) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
    ...(isPublicGet ? { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' } : {}),
  };
}

function getBackendBase() {
  return (
    process.env.INTERNAL_BACKEND_URL ||
    process.env.BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    (process.env.NODE_ENV === 'production' ? 'http://fxengin-backend:3000' : 'http://localhost:5001')
  ).replace(/\/+$/, '');
}

function readLocalTestimonials() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading testimonials.json:', err);
  }
  return [];
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');

  // Try live NestJS backend first
  try {
    const backendUrl = getBackendBase();
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    const res = await fetch(`${backendUrl}/testimonials${query}`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });

    if (res.ok) {
      const json = await res.json();
      const list = Array.isArray(json) ? json : json?.data;
      if (Array.isArray(list) && list.length > 0) {
        return NextResponse.json(
          { success: true, count: list.length, data: list },
          { status: 200, headers: corsHeaders(true) }
        );
      }
    }
  } catch (err) {
    console.warn('Backend /testimonials fetch failed, falling back to local data:', err.message);
  }

  // Graceful fallback to local testimonials.json
  let testimonials = readLocalTestimonials();
  if (category && category !== 'ALL' && category !== 'all') {
    testimonials = testimonials.filter((t) => t.category === category);
  }

  return NextResponse.json(
    { success: true, count: testimonials.length, data: testimonials },
    { status: 200, headers: corsHeaders(true) }
  );
}
