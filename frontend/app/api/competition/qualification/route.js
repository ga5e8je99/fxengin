import { NextResponse } from 'next/server';
import {
  getOrCreateParticipant,
  confirmCommunityTask,
  readCompetitionData,
} from '../../../lib/competitionQualification';

export const dynamic = 'force-dynamic';

function getAuthUserFromRequest(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return null;
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) return null;

    // Decode JWT payload (payload is part 1 of 3)
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payloadStr = Buffer.from(parts[1], 'base64').toString('utf-8');
    const payload = JSON.parse(payloadStr);

    return {
      id: payload.id || payload.sub,
      email: payload.email,
      fullName: payload.fullName || payload.name,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  let user = getAuthUserFromRequest(request);

  // Fallback to query param if internal
  const queryUserId = searchParams.get('userId');
  if (!user && queryUserId) {
    user = { id: queryUserId };
  }

  if (!user || !user.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  // Parse optional passed subscriptions & courses from client query/state
  let subscriptions = [];
  let courses = [];
  try {
    const subsParam = searchParams.get('subs');
    const coursesParam = searchParams.get('courses');
    if (subsParam) subscriptions = JSON.parse(subsParam);
    if (coursesParam) courses = JSON.parse(coursesParam);
  } catch {}

  const participant = getOrCreateParticipant(user, subscriptions, courses);

  return NextResponse.json({
    success: true,
    participant,
  });
}

export async function POST(request) {
  const user = getAuthUserFromRequest(request);
  const body = await request.json().catch(() => ({}));
  const userId = user?.id || body.userId;

  if (!userId) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const action = body.action || 'confirm_community';

  if (action === 'confirm_community') {
    const updated = confirmCommunityTask(userId, {
      joined: body.joined !== false,
      shared: body.shared !== false,
    });
    return NextResponse.json({
      success: true,
      participant: updated,
      message: 'تم تحديث حالة الانضمام للمجتمع بنجاح!',
    });
  }

  if (action === 'refresh') {
    const data = readCompetitionData();
    const participant = data.participants.find((p) => p.userId === userId);
    return NextResponse.json({
      success: true,
      participant,
    });
  }

  return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 });
}
