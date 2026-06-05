import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const cronSecret = process.env.CRON_SECRET;
const STALE_THRESHOLD_HOURS = 2;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = { cancelled: 0, errors: 0 };

  try {
    const cutoff = new Date(Date.now() - STALE_THRESHOLD_HOURS * 60 * 60 * 1000).toISOString();

    const { data: staleAppointments } = await supabaseAdmin
      .from('appointments')
      .select('id, patient_id, clinic_id')
      .eq('payment_status', 'pending')
      .not('paymongo_checkout_id', 'is', null)
      .lt('created_at', cutoff)
      .in('status', ['scheduled', 'confirmed'])
      .limit(50);

    if (!staleAppointments || staleAppointments.length === 0) {
      return NextResponse.json({ message: 'No abandoned checkouts', ...results });
    }

    for (const appt of staleAppointments) {
      try {
        await supabaseAdmin
          .from('appointments')
          .update({
            status: 'cancelled',
            notes: 'Auto-cancelled: payment not completed within 2 hours',
            updated_at: new Date().toISOString(),
          })
          .eq('id', appt.id);

        await supabaseAdmin.from('activity_logs').insert({
          patient_id: appt.patient_id,
          clinic_id: appt.clinic_id,
          actor_role: 'system',
          action_type: 'appointment_auto_cancelled_abandoned_payment',
          entity_type: 'appointment',
          entity_id: appt.id,
          metadata: { reason: 'abandoned_checkout', threshold_hours: STALE_THRESHOLD_HOURS },
        });

        results.cancelled++;
      } catch {
        results.errors++;
      }
    }

    return NextResponse.json({ message: 'Abandoned checkout cleanup complete', ...results });
  } catch (error) {
    console.error('Cleanup abandoned checkouts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
