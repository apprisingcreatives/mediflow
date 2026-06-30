import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createNotifications } from '@/lib/notifications';
import { sendSMS } from '@/lib/unisms';
import { normalizeToE164, isValidPHMobile } from '@/lib/phone';
import { requireActiveSubscription } from '@/lib/plan-gating';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const jwtSecret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'mediflow-rebook-secret';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mediflow.apprisingcreatives.com';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
}

// POST - Create appointment (patients only)
export async function POST(request: Request) {
  try {
    // Get authorization token from header
    const authHeader = request.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Create a Supabase client with the user's access token
    // This ensures auth.uid() works correctly in RLS policies
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Verify token and get user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      clinic_id,
      branch_id,
      patient_id: bodyPatientId,
      practitioner_id,
      service_id,
      appointment_date,
      appointment_time,
      notes,
      patient_info,
      booked_by,
      payment_method,
    } = body;

    if (clinic_id) {
      const subCheck = await requireActiveSubscription(clinic_id);
      if (subCheck !== true) return subCheck;
    }

    // Validate required fields
    if (!appointment_date || !appointment_time) {
      return NextResponse.json(
        { error: 'Date and time are required' },
        { status: 400 },
      );
    }

    // Resolve patient: if patient_id is provided (clinic admin booking), verify the caller
    // is a clinic admin for that clinic. Otherwise, look up by auth user (patient self-booking).
    let patient: { id: string; email: string; first_name: string; last_name: string; phone: string | null } | null = null;

    if (bodyPatientId && clinic_id) {
      // Clinic admin booking for a patient — verify admin role
      const { data: adminRecord } = await supabaseAdmin
        .from('clinic_admins')
        .select('id')
        .eq('auth_user_id', user.id)
        .eq('clinic_id', clinic_id)
        .eq('is_active', true)
        .single();

      if (!adminRecord) {
        return NextResponse.json(
          { error: 'Not authorized to book for this patient' },
          { status: 403 },
        );
      }

      const { data: targetPatient } = await supabaseAdmin
        .from('patients')
        .select('id, email, first_name, last_name, phone')
        .eq('id', bodyPatientId)
        .single();

      patient = targetPatient;
    } else {
      // Patient self-booking
      const { data: selfPatient } = await supabase
        .from('patients')
        .select('id, email, first_name, last_name, phone')
        .eq('auth_user_id', user.id)
        .single();

      patient = selfPatient;
    }

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient record not found' },
        { status: 404 },
      );
    }

    // Update patient record with info from booking form
    if (patient_info) {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      const fields = [
        'first_name', 'last_name', 'phone', 'date_of_birth', 'gender',
        'address', 'city', 'emergency_contact_name', 'emergency_contact_phone',
        'blood_type', 'current_medications', 'allergies', 'chronic_conditions',
        'medical_notes', 'insurance_provider', 'insurance_policy_number',
      ];

      for (const field of fields) {
        if (patient_info[field] !== undefined && patient_info[field] !== null) {
          updateData[field] = patient_info[field];
        }
      }

      const { error: updateError } = await supabaseAdmin
        .from('patients')
        .update(updateData)
        .eq('id', patient.id);

      if (updateError) {
        console.error('Failed to update patient record:', updateError);
        // Continue with appointment creation — non-critical
      }
    }

    // Ensure patient_clinics record exists (for clinic-patient relationship)
    if (clinic_id) {
      const { error: patientClinicError } = await supabaseAdmin
        .from('patient_clinics')
        .upsert(
          {
            patient_id: patient.id,
            clinic_id: clinic_id,
            is_primary: false,
          },
          {
            onConflict: 'patient_id,clinic_id',
            ignoreDuplicates: true,
          }
        );

      if (patientClinicError) {
        console.error('Failed to create patient_clinics record:', patientClinicError);
        // Continue - the relationship might already exist
      }
    }

    // Resolve service price for payment
    let servicePrice: number | null = null;
    if (service_id) {
      const { data: svc } = await supabaseAdmin
        .from('clinic_services')
        .select('price')
        .eq('id', service_id)
        .single();
      servicePrice = svc?.price ?? null;
    }

    // Check daily appointment limit
    if (practitioner_id && appointment_date) {
      const { data: withinLimit } = await supabaseAdmin.rpc('check_daily_appointment_limit', {
        p_practitioner_id: practitioner_id,
        p_date: appointment_date,
      });
      if (withinLimit === false) {
        return NextResponse.json(
          { error: 'This practitioner has reached their maximum appointments for the day.' },
          { status: 409 },
        );
      }
    }

    const isCash = payment_method === 'cash';
    const isOnline = payment_method === 'online';

    // Create appointment
    const { data: appointment, error: appointmentError } = await supabaseAdmin
      .from('appointments')
      .insert({
        patient_id: patient.id,
        clinic_id: clinic_id || null,
        branch_id: branch_id || null,
        practitioner_id: practitioner_id || null,
        service_id: service_id || null,
        appointment_date,
        appointment_time,
        status: 'scheduled',
        notes: notes || null,
        booked_by: booked_by || 'patient',
        payment_status: isCash ? 'pay_at_clinic' : isOnline ? 'pending' : 'pending',
        payment_method: isCash ? 'cash' : null,
        payment_amount: servicePrice,
      })
      .select()
      .single();

    if (appointmentError) {
      if (appointmentError.code === '23505') {
        return NextResponse.json(
          { error: 'This time slot was just booked. Please select another.' },
          { status: 409 },
        );
      }
      console.error('Appointment creation error:', appointmentError);
      return NextResponse.json(
        { error: appointmentError.message },
        { status: 500 },
      );
    }

    // Check if clinic requires intake and update appointment status
    let clinicName = '';
    let serviceName = '';
    let practitionerName = '';

    if (clinic_id) {
      const { data: clinic } = await supabase
        .from('clinics')
        .select('name, intake_required')
        .eq('id', clinic_id)
        .single();
      clinicName = clinic?.name || '';

      if (clinic?.intake_required && appointment) {
        let intakeStatus = 'pending';

        // Check if patient already completed intake for this clinic
        // and if the clinic's questions/documents haven't changed since
        const { data: lastCompleted } = await supabaseAdmin
          .from('appointments')
          .select('id, updated_at')
          .eq('patient_id', patient.id)
          .eq('clinic_id', clinic_id)
          .eq('intake_status', 'completed')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (lastCompleted) {
          const completedAt = lastCompleted.updated_at;

          // Check if questions or required documents were modified after last completed intake
          const [{ data: changedQuestions }, { data: changedDocs }] = await Promise.all([
            supabaseAdmin
              .from('clinic_onboarding_questions')
              .select('id')
              .eq('clinic_id', clinic_id)
              .eq('is_active', true)
              .gt('updated_at', completedAt)
              .limit(1),
            supabaseAdmin
              .from('clinic_required_documents')
              .select('id')
              .eq('clinic_id', clinic_id)
              .eq('is_active', true)
              .gt('updated_at', completedAt)
              .limit(1),
          ]);

          const questionsChanged = (changedQuestions && changedQuestions.length > 0) || false;
          const docsChanged = (changedDocs && changedDocs.length > 0) || false;

          // Also check for newly added questions the patient never answered
          const [{ data: activeQuestions }, { data: answeredQuestions }] = await Promise.all([
            supabaseAdmin
              .from('clinic_onboarding_questions')
              .select('id')
              .eq('clinic_id', clinic_id)
              .eq('is_active', true),
            supabaseAdmin
              .from('patient_question_responses')
              .select('question_id')
              .eq('patient_id', patient.id)
              .eq('appointment_id', lastCompleted.id),
          ]);

          const answeredIds = new Set((answeredQuestions || []).map((r: any) => r.question_id));
          const hasNewQuestions = (activeQuestions || []).some((q: any) => !answeredIds.has(q.id));

          if (!questionsChanged && !docsChanged && !hasNewQuestions) {
            intakeStatus = 'completed';

            // Copy previous responses to new appointment
            const { data: prevResponses } = await supabaseAdmin
              .from('patient_question_responses')
              .select('patient_id, clinic_id, question_id, response_value, response_options')
              .eq('patient_id', patient.id)
              .eq('appointment_id', lastCompleted.id);

            if (prevResponses && prevResponses.length > 0) {
              await supabaseAdmin
                .from('patient_question_responses')
                .insert(
                  prevResponses.map((r: any) => ({
                    ...r,
                    appointment_id: appointment.id,
                  }))
                );
            }
          }
        }

        await supabaseAdmin
          .from('appointments')
          .update({ intake_status: intakeStatus })
          .eq('id', appointment.id);
        appointment.intake_status = intakeStatus;
      }
    }

    if (service_id) {
      const { data: service } = await supabase
        .from('clinic_services')
        .select('name')
        .eq('id', service_id)
        .single();
      serviceName = service?.name || '';
    }

    if (practitioner_id) {
      const { data: practitioner } = await supabase
        .from('practitioners')
        .select('name')
        .eq('id', practitioner_id)
        .single();
      practitionerName = practitioner?.name || '';
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      patient_id: patient.id,
      clinic_id: clinic_id || null,
      actor_id: user.id,
      actor_role: 'patient',
      action_type: 'appointment_created',
      entity_type: 'appointment',
      entity_id: appointment.id,
      metadata: {
        clinic_name: clinicName,
        practitioner_name: practitionerName,
        service_name: serviceName,
        date: appointment_date,
        time: appointment_time,
      },
    });

    // Fire-and-forget in-app notifications
    {
      const notifTitle = 'New Appointment';
      const notifMessage = `${patient.first_name} ${patient.last_name} — ${formatDate(appointment_date)} at ${formatTime(appointment_time)}${serviceName ? ` (${serviceName})` : ''}`;
      const items: Parameters<typeof createNotifications>[0] = [];

      // Notify practitioner
      if (practitioner_id) {
        const { data: prac } = await supabaseAdmin
          .from('practitioners')
          .select('auth_user_id')
          .eq('id', practitioner_id)
          .single();
        if (prac?.auth_user_id) {
          items.push({
            recipientId: prac.auth_user_id,
            recipientType: 'practitioner',
            clinicId: clinic_id,
            type: 'appointment.created',
            title: notifTitle,
            message: notifMessage,
            actionUrl: `/clinic/${clinic_id}/appointments`,
          });
        }
      }

      // Notify clinic owner(s)
      if (clinic_id) {
        const { data: owners } = await supabaseAdmin
          .from('clinic_admins')
          .select('auth_user_id')
          .eq('clinic_id', clinic_id)
          .eq('staff_role', 'owner')
          .eq('is_active', true);
        for (const owner of owners ?? []) {
          if (owner.auth_user_id && owner.auth_user_id !== user.id) {
            items.push({
              recipientId: owner.auth_user_id,
              recipientType: 'clinic_admin',
              clinicId: clinic_id,
              type: 'appointment.created',
              title: notifTitle,
              message: notifMessage,
              actionUrl: `/clinic/${clinic_id}/appointments`,
            });
          }
        }
      }

      // Notify patient (if booked by admin)
      if (booked_by === 'clinic_admin' && patient) {
        const { data: patientAuth } = await supabaseAdmin
          .from('patients')
          .select('auth_user_id')
          .eq('id', patient.id)
          .single();
        if (patientAuth?.auth_user_id) {
          items.push({
            recipientId: patientAuth.auth_user_id,
            recipientType: 'patient',
            clinicId: clinic_id,
            type: 'appointment.created',
            title: 'Appointment Scheduled',
            message: `An appointment has been scheduled for you on ${formatDate(appointment_date)} at ${formatTime(appointment_time)}${clinicName ? ` at ${clinicName}` : ''}`,
            actionUrl: '/patient/appointments',
          });
        }
      }

      if (items.length > 0) createNotifications(items);
    }

    // Generate confirm/cancel tokens for email links
    const confirmToken = jwt.sign(
      { appointmentId: appointment.id, patientId: patient.id, action: 'confirm' },
      jwtSecret,
      { expiresIn: '48h' },
    );
    const cancelToken = jwt.sign(
      { appointmentId: appointment.id, patientId: patient.id, action: 'cancel' },
      jwtSecret,
      { expiresIn: '48h' },
    );
    const confirmUrl = `${appUrl}/confirm/${confirmToken}`;
    const cancelUrl = `${appUrl}/cancel/${cancelToken}`;
    const dateFormatted = formatDate(appointment_date);
    const timeFormatted = formatTime(appointment_time);
    const bookedBy = booked_by || 'patient';
    const patientFullName = `${patient.first_name} ${patient.last_name}`;

    const detailsList = `<ul><li><strong>Date:</strong> ${dateFormatted}</li><li><strong>Time:</strong> ${timeFormatted}</li>${clinicName ? `<li><strong>Clinic:</strong> ${clinicName}</li>` : ''}${practitionerName ? `<li><strong>Doctor:</strong> ${practitionerName}</li>` : ''}${serviceName ? `<li><strong>Service:</strong> ${serviceName}</li>` : ''}</ul>`;
    const actionButtons = `<p><a href="${confirmUrl}" style="display:inline-block;padding:12px 24px;background:#14b8a6;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;margin-right:12px">Confirm Appointment</a> <a href="${cancelUrl}" style="display:inline-block;padding:12px 24px;background:#ef4444;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold">Cancel Appointment</a></p>`;

    if (bookedBy === 'patient') {
      // Patient booked → notify clinic admin to confirm
      const { data: clinicAdmin } = await supabaseAdmin
        .from('clinic_admins')
        .select('email, name')
        .eq('clinic_id', clinic_id)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (clinicAdmin) {
        await supabaseAdmin.from('email_notifications').insert({
          recipient_email: clinicAdmin.email,
          recipient_name: clinicAdmin.name,
          recipient_type: 'clinic',
          subject: `New Appointment Request from ${patientFullName} - MediFlow`,
          body: `Dear ${clinicAdmin.name}, ${patientFullName} has booked an appointment on ${dateFormatted} at ${timeFormatted}. Please confirm or cancel: Confirm: ${confirmUrl} Cancel: ${cancelUrl}`,
          html_body: `<h1>New Appointment Request</h1><p>Dear ${clinicAdmin.name},</p><p><strong>${patientFullName}</strong> has booked an appointment:</p>${detailsList}<p>Please confirm or cancel this appointment:</p>${actionButtons}`,
          notification_type: 'appointment_booked',
          related_entity_type: 'appointment',
          related_entity_id: appointment.id,
          status: 'pending',
        });
      }

      // Also send a receipt email to the patient (no action buttons)
      await supabaseAdmin.from('email_notifications').insert({
        recipient_email: patient.email,
        recipient_name: patientFullName,
        recipient_type: 'patient',
        subject: 'Appointment Booked - MediFlow',
        body: `Dear ${patient.first_name}, Your appointment on ${dateFormatted} at ${timeFormatted}${clinicName ? ` at ${clinicName}` : ''} has been booked. You will receive a confirmation once the clinic confirms.`,
        html_body: `<h1>Appointment Booked</h1><p>Dear ${patient.first_name},</p><p>Your appointment has been booked:</p>${detailsList}<p>You will receive a confirmation email once the clinic confirms your appointment.</p>`,
        notification_type: 'appointment_booked',
        related_entity_type: 'appointment',
        related_entity_id: appointment.id,
        status: 'pending',
      });
    } else {
      // Clinic admin booked → notify patient to confirm
      await supabaseAdmin.from('email_notifications').insert({
        recipient_email: patient.email,
        recipient_name: patientFullName,
        recipient_type: 'patient',
        subject: 'New Appointment Scheduled for You - MediFlow',
        body: `Dear ${patient.first_name}, An appointment has been scheduled for you on ${dateFormatted} at ${timeFormatted}${clinicName ? ` at ${clinicName}` : ''}. Please confirm: ${confirmUrl} or cancel: ${cancelUrl}`,
        html_body: `<h1>New Appointment Scheduled</h1><p>Dear ${patient.first_name},</p><p>An appointment has been scheduled for you:</p>${detailsList}<p>Please confirm or cancel your appointment:</p>${actionButtons}`,
        notification_type: 'appointment_booked',
        related_entity_type: 'appointment',
        related_entity_id: appointment.id,
        status: 'pending',
      });
    }

    // Send booking confirmation SMS
    try {
      const phone = await getPatientPhone(patient.id, patient.phone);
      if (phone) {
        let msgBody = `Hi ${patient.first_name}, your appointment at ${clinicName || 'the clinic'} on ${dateFormatted} at ${timeFormatted} is booked.`;

        if (isCash && servicePrice) {
          msgBody += ` Please pay PHP ${servicePrice.toLocaleString()} at the clinic.`;
        } else if (isOnline && servicePrice) {
          msgBody += ` Complete your payment online.`;
        }

        const { messageId } = await sendSMS(phone, msgBody);
        await supabaseAdmin.from('sms_notifications').insert({
          appointment_id: appointment.id,
          patient_id: patient.id,
          clinic_id: clinic_id || null,
          phone_e164: phone,
          message_body: msgBody,
          reminder_type: 'booking_confirmation',
          provider_message_id: messageId,
          status: 'sent',
          sent_at: new Date().toISOString(),
          idempotency_key: `booking:${appointment.id}`,
        });
      }
    } catch (smsErr) {
      console.error('Booking confirmation SMS error:', smsErr);
    }

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// GET - Get appointments (patients see their own, clinics see all in their clinic)
export async function GET(request: Request) {
  try {
    // Get authorization token from header
    const authHeader = request.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Create a Supabase client with the user's access token
    // This ensures auth.uid() works correctly in RLS policies
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Verify token and get user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinic_id');
    const branchId = searchParams.get('branch_id');

    // Check if user is a patient
    const { data: patient } = await supabase
      .from('patients')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (patient) {
      // Patient: only see their own appointments
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(
          `
          *,
          clinics(id, name),
          practitioners(id, name),
          clinic_services(id, name)
        `,
        )
        .eq('patient_id', patient.id)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ appointments });
    }

    // Check if user is a clinic admin
    const { data: clinicAdmin } = await supabase
      .from('clinic_admins')
      .select('id, clinic_id')
      .eq('auth_user_id', user.id)
      .single();

    if (clinicAdmin) {
      // Clinic admin: see all appointments for their clinic
      let query = supabase
        .from('appointments')
        .select(
          `
          *,
          patients(id, first_name, last_name, email),
          practitioners(id, name),
          clinic_services(id, name)
        `,
        )
        .eq('clinic_id', clinicAdmin.clinic_id);

      // Optional: filter by specific clinic if provided
      if (clinicId) {
        query = query.eq('clinic_id', clinicId);
      }

      // Optional: filter by branch
      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data: appointments, error } = await query
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ appointments });
    }

    // User is neither patient nor clinic admin
    return NextResponse.json(
      { error: 'Unauthorized: Not a patient or clinic admin' },
      { status: 403 },
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

async function getPatientPhone(
  patientId: string,
  fallbackPhone?: string | null,
): Promise<string | null> {
  const { data: prefs } = await supabaseAdmin
    .from('patient_notification_preferences')
    .select('phone_e164, sms_enabled, sms_opted_out')
    .eq('patient_id', patientId)
    .single();

  if (prefs?.sms_opted_out || prefs?.sms_enabled === false) return null;

  if (prefs?.phone_e164 && isValidPHMobile(prefs.phone_e164)) {
    return prefs.phone_e164;
  }

  const normalized = normalizeToE164(fallbackPhone);
  if (normalized && isValidPHMobile(normalized)) return normalized;
  return null;
}
