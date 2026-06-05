import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const cronSecret = process.env.CRON_SECRET;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = { processed: 0, failed: 0, skipped: 0 };

  try {
    const { data: appointments } = await supabaseAdmin
      .from('appointments')
      .select('id, refund_attempts, refund_scheduled_at')
      .eq('payment_status', 'refund_pending')
      .lte('refund_scheduled_at', new Date().toISOString())
      .lt('refund_attempts', 3)
      .order('refund_scheduled_at', { ascending: true })
      .limit(20);

    if (!appointments || appointments.length === 0) {
      return NextResponse.json({ message: 'No pending refunds', ...results });
    }

    for (const appt of appointments) {
      try {
        const res = await fetch(
          `${appUrl}/api/appointments/${appt.id}/refund`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${cronSecret}`,
              'Content-Type': 'application/json',
            },
          },
        );

        if (res.ok) {
          results.processed++;
        } else {
          results.failed++;
        }
      } catch {
        results.failed++;
      }
    }

    return NextResponse.json({ message: 'Refund processing complete', ...results });
  } catch (error) {
    console.error('Process refunds cron error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
