import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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
      patient_id: bodyPatientId,
      practitioner_id,
      service_id,
      appointment_date,
      appointment_time,
      notes,
      patient_info,
      booked_by,
    } = body;

    // Validate required fields
    if (!appointment_date || !appointment_time) {
      return NextResponse.json(
        { error: 'Date and time are required' },
        { status: 400 },
      );
    }

    // Resolve patient: if patient_id is provided (clinic admin booking), verify the caller
    // is a clinic admin for that clinic. Otherwise, look up by auth user (patient self-booking).
    let patient: { id: string; email: string; first_name: string; last_name: string } | null = null;

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
        .select('id, email, first_name, last_name')
        .eq('id', bodyPatientId)
        .single();

      patient = targetPatient;
    } else {
      // Patient self-booking
      const { data: selfPatient } = await supabase
        .from('patients')
        .select('id, email, first_name, last_name')
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

    // Create appointment
    const { data: appointment, error: appointmentError } = await supabaseAdmin
      .from('appointments')
      .insert({
        patient_id: patient.id,
        clinic_id: clinic_id || null,
        practitioner_id: practitioner_id || null,
        service_id: service_id || null,
        appointment_date,
        appointment_time,
        status: 'scheduled',
        notes: notes || null,
        booked_by: booked_by || 'patient',
      })
      .select()
      .single();

    if (appointmentError) {
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

    // Queue confirmation email
    await supabase.from('email_notifications').insert({
      recipient_email: patient.email,
      recipient_name: `${patient.first_name} ${patient.last_name}`,
      recipient_type: 'patient',
      subject: 'Appointment Confirmed - MediFlow',
      body: `Dear ${patient.first_name}, Your appointment has been confirmed for ${appointment_date} at ${appointment_time}${clinicName ? ` at ${clinicName}` : ''}${practitionerName ? ` with ${practitionerName}` : ''}.`,
      html_body: `<h1>Appointment Confirmed</h1><p>Dear ${patient.first_name},</p><p>Your appointment has been confirmed:</p><ul><li><strong>Date:</strong> ${appointment_date}</li><li><strong>Time:</strong> ${appointment_time}</li>${clinicName ? `<li><strong>Clinic:</strong> ${clinicName}</li>` : ''}${practitionerName ? `<li><strong>Doctor:</strong> ${practitionerName}</li>` : ''}${serviceName ? `<li><strong>Service:</strong> ${serviceName}</li>` : ''}</ul><p>Please arrive 15 minutes before your appointment time.</p>`,
      notification_type: 'appointment_confirmation',
      related_entity_type: 'appointment',
      related_entity_id: appointment.id,
      status: 'pending',
    });

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
