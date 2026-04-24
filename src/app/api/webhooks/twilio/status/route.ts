import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { validateTwilioSignature } from '@/lib/twilio';

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const params = Object.fromEntries(new URLSearchParams(rawBody));

  const signature = request.headers.get('x-twilio-signature') || '';
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/status`;

  if (!validateTwilioSignature(signature, url, params)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const { MessageSid, MessageStatus } = params;

  if (!MessageSid || !MessageStatus) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const validStatuses = ['sent', 'delivered', 'failed', 'undelivered'];
  if (validStatuses.includes(MessageStatus)) {
    await supabaseAdmin
      .from('sms_notifications')
      .update({ status: MessageStatus })
      .eq('twilio_sid', MessageSid);
  }

  return NextResponse.json({ success: true });
}
