import { NextResponse } from 'next/server';
import { recordSubLinkClick } from '../../../lib/competitionQualification';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const unwrappedParams = await params;
  const channel = unwrappedParams?.channel || 'tg';
  const userId = unwrappedParams?.userId;

  // Extract client IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : realIp || '127.0.0.1';

  let redirectUrl = 'https://t.me/FXENGIN1NEWS';

  if (userId) {
    const res = recordSubLinkClick(channel, userId, clientIp);
    if (res?.targetUrl) {
      redirectUrl = res.targetUrl;
    }
  }

  // Redirect to official social/community destination
  return NextResponse.redirect(redirectUrl, {
    status: 302,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
