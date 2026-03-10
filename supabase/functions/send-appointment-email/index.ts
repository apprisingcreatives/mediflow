// @ts-nocheck - This file runs on Deno runtime, not Node.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const APP_URL = Deno.env.get('APP_URL') || 'http://localhost:3000';

// MediFlow brand colors
const BRAND_COLORS = {
  primary: '#1a5f5a', // Teal header
  secondary: '#2dd4bf', // Teal button
  text: '#1f2937',
  textLight: '#6b7280',
  background: '#f8fafc',
  white: '#ffffff',
};

interface AppointmentData {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes: string | null;
  patient: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  practitioner: {
    id: string;
    name: string;
    specialization: string | null;
  };
  service: {
    id: string;
    name: string;
    duration_minutes: number;
  };
  clinic: {
    id: string;
    name: string;
    address: string | null;
    phone: string | null;
  };
  checkin_token?: string;
}

type NotificationType =
  | 'appointment_created'
  | 'appointment_updated'
  | 'appointment_reminder_24hr'
  | 'appointment_start';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function getEmailSubject(
  type: NotificationType,
  appointment: AppointmentData,
): string {
  const clinicName = appointment.clinic.name;
  const date = formatDate(appointment.appointment_date);

  switch (type) {
    case 'appointment_created':
      return `Appointment Confirmed - ${clinicName}`;
    case 'appointment_updated':
      return `Appointment Updated - ${clinicName}`;
    case 'appointment_reminder_24hr':
      return `Reminder: Your appointment tomorrow at ${clinicName}`;
    case 'appointment_start':
      return `Your appointment is starting now - ${clinicName}`;
    default:
      return `Appointment Notification - ${clinicName}`;
  }
}

function getEmailContent(
  type: NotificationType,
  appointment: AppointmentData,
): { heading: string; message: string; showCheckinButton: boolean } {
  switch (type) {
    case 'appointment_created':
      return {
        heading: 'Your Appointment is Confirmed',
        message:
          'Your appointment has been successfully scheduled. Please find the details below.',
        showCheckinButton: false,
      };
    case 'appointment_updated':
      return {
        heading: 'Your Appointment Has Been Updated',
        message:
          'Your appointment details have been changed. Please review the updated information below.',
        showCheckinButton: false,
      };
    case 'appointment_reminder_24hr':
      return {
        heading: 'Appointment Reminder',
        message:
          'This is a friendly reminder that you have an appointment scheduled for tomorrow. Please review the details below.',
        showCheckinButton: false,
      };
    case 'appointment_start':
      return {
        heading: 'Your Appointment is Starting',
        message:
          "Your appointment is about to begin. Click the button below to check in and let us know you're ready.",
        showCheckinButton: true,
      };
    default:
      return {
        heading: 'Appointment Notification',
        message: 'Here are your appointment details.',
        showCheckinButton: false,
      };
  }
}

function generateEmailHtml(
  type: NotificationType,
  appointment: AppointmentData,
): string {
  const { heading, message, showCheckinButton } = getEmailContent(
    type,
    appointment,
  );
  const checkinUrl = `${APP_URL}/api/appointments/${appointment.id}/checkin?token=${appointment.checkin_token}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${heading}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: ${BRAND_COLORS.background};">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: ${BRAND_COLORS.white}; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: ${BRAND_COLORS.primary}; padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: ${BRAND_COLORS.white}; font-size: 28px; font-weight: 700;">MediFlow</h1>
              <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">Intelligent Healthcare Management</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; color: ${BRAND_COLORS.text}; font-size: 24px; font-weight: 600;">${heading}</h2>
              <p style="margin: 0 0 24px; color: ${BRAND_COLORS.textLight}; font-size: 16px; line-height: 1.6;">
                ${message}
              </p>
              
              <!-- Appointment Details Card -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: ${BRAND_COLORS.background}; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 24px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0;">
                          <p style="margin: 0; color: ${BRAND_COLORS.textLight}; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Date & Time</p>
                          <p style="margin: 4px 0 0; color: ${BRAND_COLORS.text}; font-size: 16px; font-weight: 500;">
                            ${formatDate(appointment.appointment_date)} at ${formatTime(appointment.appointment_time)}
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-top: 1px solid #e5e7eb;">
                          <p style="margin: 0; color: ${BRAND_COLORS.textLight}; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Service</p>
                          <p style="margin: 4px 0 0; color: ${BRAND_COLORS.text}; font-size: 16px; font-weight: 500;">
                            ${appointment.service.name} (${appointment.service.duration_minutes} min)
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-top: 1px solid #e5e7eb;">
                          <p style="margin: 0; color: ${BRAND_COLORS.textLight}; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Practitioner</p>
                          <p style="margin: 4px 0 0; color: ${BRAND_COLORS.text}; font-size: 16px; font-weight: 500;">
                            ${appointment.practitioner.name}${appointment.practitioner.specialization ? ` - ${appointment.practitioner.specialization}` : ''}
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-top: 1px solid #e5e7eb;">
                          <p style="margin: 0; color: ${BRAND_COLORS.textLight}; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Clinic</p>
                          <p style="margin: 4px 0 0; color: ${BRAND_COLORS.text}; font-size: 16px; font-weight: 500;">
                            ${appointment.clinic.name}
                          </p>
                          ${appointment.clinic.address ? `<p style="margin: 4px 0 0; color: ${BRAND_COLORS.textLight}; font-size: 14px;">${appointment.clinic.address}</p>` : ''}
                          ${appointment.clinic.phone ? `<p style="margin: 4px 0 0; color: ${BRAND_COLORS.textLight}; font-size: 14px;">Phone: ${appointment.clinic.phone}</p>` : ''}
                        </td>
                      </tr>
                      ${
                        appointment.notes
                          ? `
                      <tr>
                        <td style="padding: 8px 0; border-top: 1px solid #e5e7eb;">
                          <p style="margin: 0; color: ${BRAND_COLORS.textLight}; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Notes</p>
                          <p style="margin: 4px 0 0; color: ${BRAND_COLORS.text}; font-size: 14px;">${appointment.notes}</p>
                        </td>
                      </tr>
                      `
                          : ''
                      }
                    </table>
                  </td>
                </tr>
              </table>
              
              ${
                showCheckinButton
                  ? `
              <!-- Check-in Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 16px 0;">
                    <a href="${checkinUrl}" style="display: inline-block; padding: 16px 48px; background-color: ${BRAND_COLORS.secondary}; color: ${BRAND_COLORS.white}; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                      Check In Now
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 16px 0 0; color: ${BRAND_COLORS.textLight}; font-size: 14px; text-align: center;">
                <strong>If the button doesn't work:</strong><br>
                Copy and paste this link into your browser:
              </p>
              <p style="margin: 8px 0 0; padding: 12px; background-color: ${BRAND_COLORS.background}; border-radius: 4px; word-break: break-all;">
                <a href="${checkinUrl}" style="color: ${BRAND_COLORS.primary}; font-size: 12px; text-decoration: underline;">${checkinUrl}</a>
              </p>
              `
                  : ''
              }
              
              <p style="margin: 24px 0 0; color: ${BRAND_COLORS.textLight}; font-size: 14px; line-height: 1.6;">
                If you need to reschedule or cancel your appointment, please contact the clinic directly or log in to your patient portal.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: ${BRAND_COLORS.background}; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: ${BRAND_COLORS.textLight}; font-size: 12px;">
                This email was sent by MediFlow on behalf of ${appointment.clinic.name}.
              </p>
              <p style="margin: 8px 0 0; color: ${BRAND_COLORS.textLight}; font-size: 12px;">
                © ${new Date().getFullYear()} MediFlow. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function generatePlainText(
  type: NotificationType,
  appointment: AppointmentData,
): string {
  const { heading, message, showCheckinButton } = getEmailContent(
    type,
    appointment,
  );
  const checkinUrl = `${APP_URL}/api/appointments/${appointment.id}/checkin?token=${appointment.checkin_token}`;

  let text = `
${heading}

${message}

APPOINTMENT DETAILS
-------------------
Date: ${formatDate(appointment.appointment_date)}
Time: ${formatTime(appointment.appointment_time)}
Service: ${appointment.service.name} (${appointment.service.duration_minutes} min)
Practitioner: ${appointment.practitioner.name}${appointment.practitioner.specialization ? ` - ${appointment.practitioner.specialization}` : ''}
Clinic: ${appointment.clinic.name}
${appointment.clinic.address ? `Address: ${appointment.clinic.address}` : ''}
${appointment.clinic.phone ? `Phone: ${appointment.clinic.phone}` : ''}
${appointment.notes ? `Notes: ${appointment.notes}` : ''}
`;

  if (showCheckinButton) {
    text += `
CHECK IN NOW
------------
Click this link to check in for your appointment:
${checkinUrl}
`;
  }

  text += `
-------------------
This email was sent by MediFlow on behalf of ${appointment.clinic.name}.
`;

  return text.trim();
}

async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text: string,
  fromName: string,
): Promise<{ success: boolean; error?: string }> {
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
        from: `${fromName} <noreply@mediflow.apprisingcreatives.com>`,
        to: [to],
        subject,
        html,
        text,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Resend API error:', errorData);
      return {
        success: false,
        error: errorData.message || 'Failed to send email',
      };
    }

    const data = await response.json();
    console.log('Email sent successfully:', data.id);
    return { success: true };
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
    const { appointment_id, notification_type } = (await req.json()) as {
      appointment_id: string;
      notification_type: NotificationType;
    };

    if (!appointment_id || !notification_type) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: appointment_id, notification_type',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Initialize Supabase client with service role
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });

    // Fetch appointment with all related data
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select(
        `
        *,
        patient:patients (id, first_name, last_name, email),
        practitioner:practitioners (id, name, specialization),
        service:clinic_services (id, name, duration_minutes),
        clinic:clinics (id, name, address, phone)
      `,
      )
      .eq('id', appointment_id)
      .single();

    if (fetchError || !appointment) {
      console.error('Failed to fetch appointment:', fetchError);
      return new Response(JSON.stringify({ error: 'Appointment not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate check-in token for appointment_start notifications
    let checkinToken = appointment.checkin_token;
    if (notification_type === 'appointment_start' && !checkinToken) {
      const { data: tokenData } = await supabase.rpc('generate_checkin_token', {
        p_appointment_id: appointment_id,
      });
      checkinToken = tokenData;
    }

    const appointmentData: AppointmentData = {
      ...appointment,
      checkin_token: checkinToken,
    };

    // Generate email content
    const subject = getEmailSubject(notification_type, appointmentData);
    const html = generateEmailHtml(notification_type, appointmentData);
    const text = generatePlainText(notification_type, appointmentData);

    // Send email
    const { success, error: sendError } = await sendEmail(
      appointment.patient.email,
      subject,
      html,
      text,
      appointment.clinic.name,
    );

    // Log notification in database
    await supabase.from('email_notifications').insert({
      recipient_email: appointment.patient.email,
      recipient_name: `${appointment.patient.first_name} ${appointment.patient.last_name}`,
      recipient_type: 'patient',
      subject,
      body: text,
      html_body: html,
      notification_type,
      related_entity_type: 'appointment',
      related_entity_id: appointment_id,
      status: success ? 'sent' : 'failed',
      sent_at: success ? new Date().toISOString() : null,
      error_message: sendError || null,
      metadata: {
        clinic_id: appointment.clinic.id,
        practitioner_id: appointment.practitioner.id,
        service_id: appointment.service.id,
      },
    });

    // Update appointment notification tracking
    const updateField = `notification_${notification_type.replace('appointment_', '')}_sent`;
    await supabase
      .from('appointments')
      .update({ [updateField]: true })
      .eq('id', appointment_id);

    return new Response(
      JSON.stringify({
        success,
        message: success ? 'Email sent successfully' : 'Failed to send email',
        error: sendError,
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
