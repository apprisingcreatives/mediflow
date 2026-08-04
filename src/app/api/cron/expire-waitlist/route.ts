import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('appointment_waitlist')
    .update({
      status: 'expired',
      updated_at: new Date().toISOString(),
    })
    .eq('status', 'waiting')
    .lt('expires_at', new Date().toISOString())
    .select('id');

  if (error) {
    console.error('Expire waitlist error:', error);
    return NextResponse.json({ error: 'Failed to expire waitlist entries' }, { status: 500 });
  }

  return NextResponse.json({ success: true, expired: data?.length || 0 });
}
