import { NextRequest, NextResponse } from 'next/server';
import { savePushSubscription } from '@/lib/db';

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    return NextResponse.json(
      { error: 'Invalid push subscription' },
      { status: 400 }
    );
  }

  await savePushSubscription(body.endpoint, body.keys.p256dh, body.keys.auth);

  return NextResponse.json({ success: true });
}
