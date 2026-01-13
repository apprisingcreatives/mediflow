"use client";

import { supabase } from "@/lib/supabase";

export interface EmailParams {
  recipientEmail: string;
  recipientName?: string;
  recipientType?: "patient" | "clinic" | "admin";
  subject: string;
  body: string;
  htmlBody?: string;
  notificationType: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  metadata?: Record<string, unknown>;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  html_body: string | null;
  variables: string[];
}

export async function sendEmail(params: EmailParams) {
  const { error } = await supabase.from("email_notifications").insert({
    recipient_email: params.recipientEmail,
    recipient_name: params.recipientName,
    recipient_type: params.recipientType,
    subject: params.subject,
    body: params.body,
    html_body: params.htmlBody,
    notification_type: params.notificationType,
    related_entity_type: params.relatedEntityType,
    related_entity_id: params.relatedEntityId,
    status: "pending",
    metadata: params.metadata,
  });

  if (error) {
    console.error("Failed to queue email:", error);
    return { success: false, error };
  }

  return { success: true };
}

export async function getEmailTemplate(templateName: string): Promise<EmailTemplate | null> {
  const { data, error } = await supabase
    .from("email_templates")
    .select("*")
    .eq("name", templateName)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    console.error("Failed to get email template:", error);
    return null;
  }

  return data;
}

export function replaceTemplateVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  Object.entries(variables).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), value);
  });
  return result;
}

export async function sendTemplatedEmail(
  templateName: string,
  recipientEmail: string,
  recipientName: string,
  variables: Record<string, string>,
  recipientType?: "patient" | "clinic" | "admin",
  relatedEntityType?: string,
  relatedEntityId?: string
) {
  const template = await getEmailTemplate(templateName);
  if (!template) {
    return { success: false, error: "Template not found" };
  }

  const subject = replaceTemplateVariables(template.subject, variables);
  const body = replaceTemplateVariables(template.body, variables);
  const htmlBody = template.html_body
    ? replaceTemplateVariables(template.html_body, variables)
    : undefined;

  return sendEmail({
    recipientEmail,
    recipientName,
    recipientType,
    subject,
    body,
    htmlBody,
    notificationType: templateName,
    relatedEntityType,
    relatedEntityId,
    metadata: variables,
  });
}

// Pre-built notification functions
export async function sendWelcomePatientEmail(
  patientEmail: string,
  patientName: string
) {
  return sendTemplatedEmail(
    "welcome_patient",
    patientEmail,
    patientName,
    { patient_name: patientName },
    "patient"
  );
}

export async function sendAppointmentConfirmation(
  patientEmail: string,
  patientName: string,
  doctorName: string,
  clinicName: string,
  date: string,
  time: string,
  appointmentId: string
) {
  return sendTemplatedEmail(
    "appointment_confirmation",
    patientEmail,
    patientName,
    {
      patient_name: patientName,
      doctor_name: doctorName,
      clinic_name: clinicName,
      date,
      time,
    },
    "patient",
    "appointment",
    appointmentId
  );
}

export async function sendAppointmentReminder(
  patientEmail: string,
  patientName: string,
  doctorName: string,
  date: string,
  time: string,
  appointmentId: string
) {
  return sendTemplatedEmail(
    "appointment_reminder",
    patientEmail,
    patientName,
    {
      patient_name: patientName,
      doctor_name: doctorName,
      date,
      time,
    },
    "patient",
    "appointment",
    appointmentId
  );
}

export async function sendTrialEndingEmail(
  clinicEmail: string,
  clinicName: string,
  endDate: string,
  clinicId: string
) {
  return sendTemplatedEmail(
    "trial_ending",
    clinicEmail,
    clinicName,
    {
      clinic_name: clinicName,
      end_date: endDate,
    },
    "clinic",
    "clinic",
    clinicId
  );
}

export async function sendTrialExpiredEmail(
  clinicEmail: string,
  clinicName: string,
  clinicId: string
) {
  return sendTemplatedEmail(
    "trial_expired",
    clinicEmail,
    clinicName,
    { clinic_name: clinicName },
    "clinic",
    "clinic",
    clinicId
  );
}

export async function sendClinicWelcomeEmail(
  adminEmail: string,
  adminName: string,
  clinicName: string,
  trialEndDate: string,
  clinicId: string
) {
  return sendTemplatedEmail(
    "clinic_welcome",
    adminEmail,
    adminName,
    {
      admin_name: adminName,
      clinic_name: clinicName,
      trial_end_date: trialEndDate,
    },
    "clinic",
    "clinic",
    clinicId
  );
}

export async function sendPaymentSuccessEmail(
  clinicEmail: string,
  clinicName: string,
  amount: string,
  clinicId: string
) {
  return sendTemplatedEmail(
    "payment_success",
    clinicEmail,
    clinicName,
    {
      clinic_name: clinicName,
      amount,
    },
    "clinic",
    "clinic",
    clinicId
  );
}
