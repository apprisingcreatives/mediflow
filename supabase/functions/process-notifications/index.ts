// @ts-nocheck - This file runs on Deno runtime, not Node.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Appointment notification types that need special handling
const APPOINTMENT_NOTIFICATION_TYPES = [
  'appointment_created',
  'appointment_updated',
  'appointment_reminder_24hr',
  'appointment_start',
];

interface QueuedNotification {
  id: string;
  related_entity_id: string | null;
  related_entity_type: string | null;
  notification_type: string;
  recipient_email: string;
  subject: string;
  body: string;
  html_body: string | null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Step 1: Check for 24hr reminders (appointment-specific)
    const { data: reminder24hrCount } = await supabase.rpc('check_24hr_reminders');
    console.log(`Queued ${reminder24hrCount || 0} 24-hour reminder notifications`);

    // Step 2: Check for appointment start notifications (appointment-specific)
    const { data: startCount } = await supabase.rpc('check_appointment_start_notifications');
    console.log(`Queued ${startCount || 0} appointment start notifications`);

    // Step 3: Process all queued and pending notifications
    const { data: queuedNotifications, error: fetchError } = await supabase
      .from('email_notifications')
      .select('id, related_entity_id, related_entity_type, notification_type, recipient_email, subject, body, html_body')
      .in('status', ['queued', 'pending'])
      .order('created_at', { ascending: true })
      .limit(50);

    if (fetchError) {
      console.error('Failed to fetch queued notifications:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch queued notifications' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const notifications = (queuedNotifications || []) as QueuedNotification[];
    let processed = 0;
    let failed = 0;

    for (const notification of notifications) {
      try {
        // Mark as processing
        await supabase
          .from('email_notifications')
          .update({ status: 'processing' })
          .eq('id', notification.id);

        let sendResponse: Response;
        let result: { success?: boolean; error?: string };

        // Check if this is an appointment notification that needs special handling
        const isAppointmentNotification = 
          APPOINTMENT_NOTIFICATION_TYPES.includes(notification.notification_type) &&
          notification.related_entity_type === 'appointment' &&
          notification.related_entity_id;

        if (isAppointmentNotification) {
          // Use the appointment-specific email function (generates rich HTML)
          sendResponse = await fetch(
            `${SUPABASE_URL}/functions/v1/send-appointment-email`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              },
              body: JSON.stringify({
                appointment_id: notification.related_entity_id,
                notification_type: notification.notification_type,
              }),
            }
          );
          result = await sendResponse.json();
        } else {
          // Use the generic email function (sends pre-formatted content)
          sendResponse = await fetch(
            `${SUPABASE_URL}/functions/v1/send-email`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              },
              body: JSON.stringify({
                notification_id: notification.id,
              }),
            }
          );
          result = await sendResponse.json();
        }

        if (sendResponse.ok && result.success) {
          // For appointment emails, the send function updates the status
          // For generic emails, the send-email function updates the status
          // But let's ensure it's marked as sent
          await supabase
            .from('email_notifications')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
            })
            .eq('id', notification.id);
          processed++;
        } else {
          await supabase
            .from('email_notifications')
            .update({
              status: 'failed',
              error_message: result.error || 'Unknown error',
            })
            .eq('id', notification.id);
          failed++;
        }
      } catch (error) {
        console.error(`Failed to process notification ${notification.id}:`, error);
        await supabase
          .from('email_notifications')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('id', notification.id);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notification processing complete',
        stats: {
          reminder_24hr_queued: reminder24hrCount || 0,
          appointment_start_queued: startCount || 0,
          processed,
          failed,
          total_in_queue: notifications.length,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
