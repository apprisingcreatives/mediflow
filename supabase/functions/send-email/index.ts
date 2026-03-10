// @ts-nocheck - This file runs on Deno runtime, not Node.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FROM_EMAIL =
  Deno.env.get('FROM_EMAIL') ||
  'MediFlow <noreply@mediflow.apprisingcreatives.com>';

interface EmailNotification {
  id: string;
  recipient_email: string;
  recipient_name: string | null;
  subject: string;
  body: string;
  html_body: string | null;
  notification_type: string;
}

async function sendViaResend(
  to: string,
  subject: string,
  html: string | null,
  text: string,
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject,
        html: html || undefined,
        text,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', data);
      return { success: false, error: data.message || 'Failed to send email' };
    }

    console.log('Email sent successfully:', data.id);
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { notification_id } = body as { notification_id?: string };

    if (!notification_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: notification_id' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Fetch the notification
    const { data: notification, error: fetchError } = await supabase
      .from('email_notifications')
      .select(
        'id, recipient_email, recipient_name, subject, body, html_body, notification_type',
      )
      .eq('id', notification_id)
      .single();

    if (fetchError || !notification) {
      console.error('Notification not found:', fetchError);
      return new Response(JSON.stringify({ error: 'Notification not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const emailNotification = notification as EmailNotification;

    // Send the email
    const {
      success,
      error: sendError,
      messageId,
    } = await sendViaResend(
      emailNotification.recipient_email,
      emailNotification.subject,
      emailNotification.html_body,
      emailNotification.body,
    );

    // Update notification status
    await supabase
      .from('email_notifications')
      .update({
        status: success ? 'sent' : 'failed',
        sent_at: success ? new Date().toISOString() : null,
        error_message: sendError || null,
        metadata: success ? { resend_message_id: messageId } : undefined,
      })
      .eq('id', notification_id);

    return new Response(
      JSON.stringify({
        success,
        message: success ? 'Email sent successfully' : 'Failed to send email',
        error: sendError,
        messageId,
      }),
      {
        status: success ? 200 : 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
