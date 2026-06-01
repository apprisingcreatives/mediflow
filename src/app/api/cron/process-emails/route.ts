import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import nodemailer from 'nodemailer';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL =
  process.env.FROM_EMAIL || 'MediFlow <noreply@mediflow.apprisingcreatives.com>';
const BATCH_SIZE = 50;

const isLocal =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('127.0.0.1') ||
  process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('localhost');

async function sendViaSmtp(
  to: string,
  subject: string,
  html: string | null,
  text: string,
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    const transport = nodemailer.createTransport({
      host: '127.0.0.1',
      port: 54325,
      secure: false,
      tls: { rejectUnauthorized: false },
    });

    const info = await transport.sendMail({
      from: FROM_EMAIL,
      to,
      subject,
      html: html || undefined,
      text,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'SMTP error';
    console.error('SMTP send error:', msg);
    return { success: false, error: msg };
  }
}

async function sendViaResend(
  to: string,
  subject: string,
  html: string | null,
  text: string,
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  if (!RESEND_API_KEY) {
    return { success: false, error: 'RESEND_API_KEY not configured' };
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
      return { success: false, error: data.message || 'Resend API error' };
    }

    return { success: true, messageId: data.id };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Resend error';
    return { success: false, error: msg };
  }
}

async function sendEmail(
  to: string,
  subject: string,
  html: string | null,
  text: string,
) {
  if (isLocal) {
    return sendViaSmtp(to, subject, html, text);
  }
  return sendViaResend(to, subject, html, text);
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = { sent: 0, failed: 0, skipped: 0 };

  try {
    const { data: notifications, error: fetchError } = await supabaseAdmin
      .from('email_notifications')
      .select('id, recipient_email, recipient_name, subject, body, html_body, notification_type')
      .in('status', ['pending', 'queued'])
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchError) {
      console.error('Failed to fetch notifications:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    if (!notifications || notifications.length === 0) {
      return NextResponse.json({ message: 'No pending emails', ...results });
    }

    const ids = notifications.map((n) => n.id);
    await supabaseAdmin
      .from('email_notifications')
      .update({ status: 'processing' })
      .in('id', ids);

    for (const notification of notifications) {
      const { success, error: sendError, messageId } = await sendEmail(
        notification.recipient_email,
        notification.subject,
        notification.html_body,
        notification.body,
      );

      await supabaseAdmin
        .from('email_notifications')
        .update({
          status: success ? 'sent' : 'failed',
          sent_at: success ? new Date().toISOString() : null,
          error_message: sendError || null,
          metadata: messageId ? { message_id: messageId } : undefined,
        })
        .eq('id', notification.id);

      if (success) {
        results.sent++;
      } else {
        results.failed++;
        console.error(`Failed to send email ${notification.id}:`, sendError);
      }
    }

    return NextResponse.json({ message: 'Processing complete', ...results });
  } catch (error) {
    console.error('Process emails error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
