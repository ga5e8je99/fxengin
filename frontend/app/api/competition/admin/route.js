import { NextResponse } from 'next/server';
import {
  readCompetitionData,
  adminOverrideParticipant,
} from '../../../lib/competitionQualification';

export const dynamic = 'force-dynamic';

export async function GET() {
  const data = readCompetitionData();
  const participants = data.participants || [];
  const clicks = data.clicks || [];

  const totalParticipants = participants.length;
  const qualifiedCount = participants.filter((p) => p.isQualified).length;
  const inProgressCount = totalParticipants - qualifiedCount;
  const totalSubClicks = clicks.length;

  return NextResponse.json({
    success: true,
    stats: {
      totalParticipants,
      qualifiedCount,
      inProgressCount,
      totalSubClicks,
    },
    participants,
    recentClicks: clicks.slice(-50).reverse(),
  });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { action, userId } = body;

  if (!userId) {
    return NextResponse.json({ success: false, message: 'Missing userId' }, { status: 400 });
  }

  if (action === 'approve') {
    const updated = adminOverrideParticipant(userId, { approve: true });
    return NextResponse.json({
      success: true,
      participant: updated,
      message: 'تم اعتماد وتأهيل المتسابق يدوياً بنجاح!',
    });
  }

  if (action === 'reset') {
    const updated = adminOverrideParticipant(userId, { reset: true });
    return NextResponse.json({
      success: true,
      participant: updated,
      message: 'تمت إعادة ضبط عدادات ومهام المتسابق بنجاح!',
    });
  }

  return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
}
